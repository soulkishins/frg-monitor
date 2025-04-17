import axios from "axios";
import { ParsingError } from "../errors";
import { S3Uploader } from "./s3-uploader";
import { IMLAdvertisement, IMLAdvertisementUrl, PreloadedState, ProductInfo, PhotoInfo, PriceComponent, AdvertisementResponse } from "../base/types";

export class MLParser {
    private static readonly PRELOADED_STATE_REGEX = /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/;
    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        //'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,zh-HK;q=0.6,zh-SG;q=0.5,zh;q=0.4',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.mercadolivre.com.br/',
        'Device-Memory': '8',
        'Downlink': '10',
        'Dpr': '1',
        'Ect': '4g',
        'Priority': 'u=0, i',
        'Rtt': '50',
        'Sec-Ch-Ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Viewport-Width': '1920'
    };

    constructor(private readonly uploader: S3Uploader) {}

    public async extractAdvertisementDetails(url: IMLAdvertisementUrl): Promise<IMLAdvertisement> {
        const st_plataform = 'MERCADOLIVRE';

        try {
            //const cleanUrl = this.removeUrlHash(url.link);
            const response = await this.requestData(url.link);
            
            if (response.status > 299) {
                url.link = response.url
                return this.createErrorAdvertisement(url, st_plataform, 'Response with status code ' + response.status, response.html);
            }

            const preloadedState = this.extractPreloadedState(response.html);
            const advertisementInfo = MLParser.extractAdvertisementInfo(preloadedState);
            const s3Photos = await this.uploadPhotos(advertisementInfo.photos, st_plataform);

            return this.createAdvertisement(advertisementInfo, response.url, s3Photos, st_plataform, response.html);
        } catch (error: any) {
            return this.createErrorAdvertisement(url, st_plataform, error.message, (error as ParsingError).html);
        }
    }

    private removeUrlHash(url: string): string {
        return url.substring(0, url.indexOf('#'));
    }

    // Função para aguardar um tempo aleatório entre min e max milissegundos
    private sleep(min = 1500, max = 4000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    private async requestData(url: string): Promise<AdvertisementResponse> {
        try {
            await this.sleep();
            const response = await axios.get(url, {
                headers: this.headers,
                timeout: 5000,
                maxRedirects: 10
            });
            return {
                html: response.data,
                url: response.request?.res?.responseUrl || url,
                status: response.status
            };
        } catch (error: any) {
            console.log('requestData', url, error);
            if (error.response) {
                return {
                    html: error.response.data,
                    url: error.response.request?.res?.responseUrl || url,
                    status: error.response.status
                };
            }
            return {
                html: error.message,
                url: url,
                status: 500
            };
        }
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

    private createAdvertisement(
        info: ProductInfo,
        url: string,
        photos: string[],
        platform: string,
        html: string
    ): IMLAdvertisement {
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
                    new: info.new,
                    relatedSearches: info.relatedSearches
                }
            }),
            st_status: 'NEW',
            ml_json: html
        };
    }

    private createErrorAdvertisement(
        url: IMLAdvertisementUrl,
        platform: string,
        error: string,
        html: string
    ): IMLAdvertisement {
        return {
            id_advertisement: '',
            id_brand: '',
            st_plataform: platform,
            st_plataform_id: url.link.match(/MLB-\d+/)?.[0].replace('-', '') || url.link.match(/MLB\d+/)?.[0] || 'N/A',
            st_url: url.link,
            st_title: url.title,
            st_description: `Erro: ${error}`,
            st_photos: 'N/A',
            db_price: Number(url.price),
            st_vendor: 'N/A',
            st_status: 'ERROR',
            ml_json: html
        };
    }
} 