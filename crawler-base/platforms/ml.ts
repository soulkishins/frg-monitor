import { exit } from "process";
import { IAdvertisement, IPagination, IPage } from "../base/types";
import { ServiceError, PaginationError, ScrapingError, ParsingError } from "../errors";
import { S3Uploader } from "../services/s3-uploader";
import { Scraper, Parser } from "../services/scraper";
import * as cheerio from 'cheerio';

export class MLScraper extends Scraper {
    constructor(parser: Parser) {
        super(parser);
    }

    protected getURL(keyword: string): string {
        return `https://lista.mercadolivre.com.br/${encodeURIComponent(keyword)}`;
    }

    protected getReferer(): string {
        return 'https://www.mercadolivre.com.br/';
    }
}

export class MLParser extends Parser {
    private static readonly PRELOADED_STATE_REGEX = /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/;

    constructor(uploader: S3Uploader) {
        super(uploader);
    }

    public parseInitialPage($: cheerio.CheerioAPI): IAdvertisement[] {
        const advertisements: IAdvertisement[] = [];
        const advertisementsJson = $('script[type=application/ld+json]').text();
        try {
            const advertisementsJsonParsed = JSON.parse(advertisementsJson);
            advertisementsJsonParsed['@graph'].forEach((item: any) => {
                if (item['@type'] === 'Product') {
                    advertisements.push({
                        st_title: item.name,
                        db_price: item.offers.price,
                        st_url: this.removeUrlHash(item.offers.url),
                        st_plataform: 'ML',
                        st_plataform_id: this.getMLId(item.offers.url),
                        st_status: 'NEW'
                    });
                }
            });
        } catch (error) {
            throw new ScrapingError('Falha ao extrair anúncios', error as Error);
        }
        return advertisements;
    }

    public parseInitialPagination($: cheerio.CheerioAPI): IPagination[] {
        const pages: IPagination[] = [];
        const paginationJson = $('script[id=__PRELOADED_STATE__]').text();
        const paginationParsed = JSON.parse(paginationJson);
        const pagination = paginationParsed.pageState.initialState.pagination.pagination_nodes_url;
        if (pagination) {
            pagination.forEach((link: any) => {
                pages.push({ visited: link.is_actual_page, link: link.url });
            });
        }
        return pages;
    }

    public parseNextPage($: cheerio.CheerioAPI): IAdvertisement[] {
        return this.parseInitialPage($);
    }

    public parseNextPagination($: cheerio.CheerioAPI): IPagination[] {
        return this.parseInitialPagination($);
    }

    public async parseAdvertisement(url: string, html: string): Promise<IAdvertisement> {
        try {
            const preloadedState = this.extractPreloadedState(html);
            const advertisementInfo = MLParser.extractAdvertisementInfo(preloadedState);
            const s3Photos = await this.uploadPhotos(advertisementInfo.photos, 'ML');
            return this.createAdvertisement(advertisementInfo, url, s3Photos, 'ML', html);
        } catch (error) {
            throw new ParsingError('Falha ao extrair informações do anúncio', html, error as Error);
        }
    }

    private createAdvertisement(
        info: ProductInfo,
        url: string,
        photos: string[],
        platform: string,
        html: string
    ): IAdvertisement {
        return {
            id_advertisement: '',
            id_brand: '',
            st_plataform: platform,
            st_plataform_id: info.id,
            st_url: url,
            st_title: info.title,
            st_description: info.description,
            st_photos: photos.join(','),
            db_price: info.price,
            st_vendor: info.seller?.name,
            st_details: JSON.stringify({
                seller: info.seller,
                details: {
                    originalPrice: info.original_price,
                    sold: info.sold,
                    stock: info.stock,
                    new: info.new
                }
            }),
            st_status: 'NEW',
            st_ml_json: html
        };
    }

    private extractPreloadedState(html: string): PreloadedState {
        const match = html.match(MLParser.PRELOADED_STATE_REGEX);
        if (!match?.[1])
            throw new ParsingError('PreloadedState not found', html);
        const jsonStr = match[1].replace(/\\u002F/g, '/');
        return JSON.parse(jsonStr) as PreloadedState;
    }

    public static extractAdvertisementInfo(preloadedState: PreloadedState): ProductInfo {
        try {
            const result: ProductInfo = {
                id: preloadedState.initialState.id
            };

            // Extraia descrição do anúncio
            const descriptionComponent = preloadedState.initialState.components.description 
                || preloadedState.initialState.components.content_left?.find((comp: any) => comp.type === 'description');
            if (descriptionComponent) {
                result.description = descriptionComponent.content;
            }

            // Extrair informações dos componentes
            if (preloadedState.initialState.components.short_description) {
                for (const component of preloadedState.initialState.components.short_description) {
                    // Extraia descrição do anúncio
                    if (component.type === 'header' && component.title) {
                        result.title = component.title as string;
                        result.new = component.subtitle?.includes('Novo');
                        result.sold = Number(component.subtitle?.match(/\d+/)?.[0]);
                    }
                    if (component.type === 'available_quantity') {
                        const quantityComponent = component as PriceComponent;
                        result.stock = quantityComponent.quantity_selector?.available_quantity;
                    }
                    // Extrair preço
                    if (component.type === 'price' && (component as PriceComponent).price) {
                        const priceComponent = component as PriceComponent;
                        result.price = priceComponent.price.value;
                        result.original_price = priceComponent.price.original_value;
                    }
                }
            }
            
            if (preloadedState.initialState.components.header?.type === 'header') {
                var component = preloadedState.initialState.components['header'] as any;
                result.title = component.title as string;
                result.new = component.subtitle?.includes('Novo');
                result.sold = Number(component.subtitle?.match(/\d+/)?.[0]);
            }

            if (preloadedState.initialState.components.price?.type === 'price') {
                var component = preloadedState.initialState.components.price as any;
                result.price = component.price.value;
                result.original_price = component.price.original_value;
            }

            if (preloadedState.initialState.components['available_quantity']?.type === 'available_quantity') {
                var component = preloadedState.initialState.components.available_quantity as any;
                result.stock = component['picker']?.['track']?.['melidata_event']?.['event_data']?.['quantity'] || 0;
            }

            // Extrair informações do vendedor
            const sellerComponent = preloadedState.initialState.components.seller_experiment;
            if (sellerComponent?.seller_info) {
                result.seller = {
                    name: sellerComponent.seller_info.title,
                    power_seller_status: sellerComponent.seller_info.power_seller_status?.title,
                    reputation_rank: sellerComponent.seller_info.thermometer?.rank
                };
            }
            else {
                const seller_data = preloadedState.initialState.components.seller_data;
                if (seller_data?.components) {
                    const seller_header = seller_data.components.find((comp: any) => comp.type === 'seller_header');
                    result.seller = {
                        name: seller_header?.title?.text.replace('Vendido por ', '')
                    };
                }
            }

            const galleryComponent = preloadedState.initialState.components.fixed?.gallery
            || preloadedState.initialState.components.gallery;
            if (galleryComponent?.pictures) {
                const pictureConfig = galleryComponent.picture_config;
                result.photos = galleryComponent.pictures.map(
                    (photo: any) => {
                        return {
                            id: photo.id,
                            url: pictureConfig.template_zoom.replace('{id}', photo.id).replace('{sanitizedTitle}', ''),
                            advertisementId: result.id
                        }
                    }
                );
            }

            // Extrair buscas relacionadas
            const relatedComponent = preloadedState.initialState.components.related_searches 
            || preloadedState.initialState.components.head?.find(
                (comp: any) => comp.type === 'related_searches'
            );
            if (relatedComponent?.related_searches) {
                result.relatedSearches = relatedComponent.related_searches.map(
                    (search: any) => search.label.text
                );
            }

            return result;
        } catch (error) {
            console.log('Erro ao extrair informações do anúncio:', error, JSON.stringify(preloadedState, null, 2));
            throw error;
        }
    }

    private async uploadPhotos(photos: PhotoInfo[] | undefined, platform: string): Promise<string[]> {
        if (!photos) return [];
        
        return await Promise.all(
            photos.map(photo => 
                this.uploader.uploadImage({
                    imageUrl: photo.url,
                    photoId: photo.id,
                    advertisementId: photo.advertisementId,
                    platform
                })
            )
        );
    }

    private removeUrlHash(url: string): string {
        if (url.indexOf('#') > -1) {
            return url.substring(0, url.indexOf('#'));
        }
        return url;
    }

    private getMLId(url: string): string {
        return url.match(/MLB-\d+/)?.[0].replace('-', '') || url.match(/MLB\d+/)?.[0] || '';
    }

}

interface PreloadedState {
    initialState: {
        id: string;
        components: { [key: string]: any;}
    };
}

interface ProductInfo {
    id: string;
    title?: string;
    description?: string;
    price?: number;
    original_price?: number;
    stock?: number;
    sold?: number;
    new?: boolean;
    seller?: {
        name: string;
        power_seller_status?: string;
        reputation_rank?: string;
    };
    photos?: PhotoInfo[];
    relatedSearches?: string[];
}

interface RelatedSearch {
    target: string;
    timeout: number;
    duration: number;
    label: Label;
}

interface Label {
    text: string;
    color?: string;
    bg_color?: string;
    font_size?: string;
    font_family?: string;
    type?: string;
}

interface Component {
    id: string;
    type: string;
    state: string;
    title?: {
        text: string;
    } | string;
    subtitle?: string;
    content?: string;
    related_searches?: RelatedSearch[];
    closeable?: boolean;
    carousel?: any;
    carousel_config?: {
        site_id: string;
        item_id: string;
        category_id: string;
        web_device: string;
        client: string;
        recommended: {
            force_categories: string;
            cnt: number;
        };
        d2id: string;
        picture_id: string;
        min_recomms: number;
        limit: number;
    };
    background_color?: string;
    is_carousel_polycard?: boolean;
    has_native_card_shadow_background?: boolean;
    has_bottom_spacing?: boolean;
}

interface PhotoInfo {
    id: string;
    url: string;
    advertisementId: string;
}

interface Price {
    type: string;
    value: number;
    original_value?: number;
    currency_symbol: string;
    currency_id: string;
    billing: boolean;
}

interface PriceComponent extends Component {
    price: Price;
    discount_label?: {
        color: string;
        value: number;
        value_font_size: string;
    };
    subtitles?: Array<{
        id?: string;
        text: string;
        color: string;
        font_size: string;
        font_family: string;
        values?: Record<string, any>;
    }>;
    quantity_selector?: {
        available_quantity: number;
        minimum_quantity: number;
    };
}