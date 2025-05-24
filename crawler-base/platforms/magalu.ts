import { IAdvertisement, IPagination } from "../base/types";
import { ScrapingError, ParsingError } from "../errors";
import { S3Uploader } from "../services/s3-uploader";
import { Scraper, Parser } from "../services/scraper";
import * as cheerio from 'cheerio';

interface MagaluState {
    [key: string]: MagaluState | MagaluState[] | string | string[] | number | boolean | undefined;
}

export class MagaluScraper extends Scraper {
    constructor(parser: Parser) {
        super(parser);
    }

    protected getURL(keyword: string): string {
        return `https://www.magazineluiza.com.br/busca/${encodeURIComponent(keyword)}`;
    }

    protected getReferer(): string {
        return 'https://www.magazineluiza.com.br/';
    }
}

export class MagaluParser extends Parser {
    constructor(uploader: S3Uploader) {
        super(uploader);
    }

    public parseInitialPage($: cheerio.CheerioAPI): IAdvertisement[] {
        const advertisements: IAdvertisement[] = [];
        const title = $('title').text();

        if (title === 'Radware Bot Manager Captcha')
            throw new ScrapingError('Captcha detected');

        const advertisementsJson = $('#__NEXT_DATA__').text();
        try {
            const advertisementsJsonParsed = JSON.parse(advertisementsJson);
            advertisementsJsonParsed
            .props
            .pageProps
            .data
            .search
            .products
            .forEach((item: any) => {
                advertisements.push({
                    st_title: item.title,
                    db_price: parseFloat(item.price.bestPrice),
                    st_url: 'https://www.magazineluiza.com.br/' + item.path,
                    st_vendor: item.seller.description,
                    st_plataform: 'MAGALU',
                    st_plataform_id: item.id,
                    st_details: JSON.stringify({
                        seller: {
                            name: item.seller.description,
                            reputation_rank: item.rating.score
                        },
                        details: {
                            originalPrice: parseFloat(item.price.price)
                        }
                    }),
                    st_status: 'NEW',
                });
            });
            console.log('MagaluParser: Advertisements', advertisements);
        } catch (error) {
            throw new ScrapingError('Falha ao extrair anúncios', error as Error);
        }
        return advertisements;
    }

    public parseInitialPagination($: cheerio.CheerioAPI): IPagination[] {
        const pages: IPagination[] = [];
        const advertisementsJson = $('#__NEXT_DATA__').text();
        try {
            const advertisementsJsonParsed = JSON.parse(advertisementsJson);
            const pagination = advertisementsJsonParsed
            .props
            .pageProps
            .data
            .search
            .pagination;

            const url = advertisementsJsonParsed
            .props
            .pageProps
            .structure
            .resolvedUrl;

            for (let i = 1; i <= pagination.pages; i++) {
                pages.push({
                    visited: false,
                    link: `https://www.magazineluiza.com.br${url}?page=${i}`
                });
            }

            pages[0].visited = true;
            console.log('MagaluParser: Pages', pages);
        } catch (error) {
            throw new ScrapingError('Falha ao extrair anúncios', error as Error);
        }

        return pages;
    }

    public parseNextPage($: cheerio.CheerioAPI): IAdvertisement[] {
        return this.parseInitialPage($);
    }

    public parseNextPagination($: cheerio.CheerioAPI): IPagination[] {
        return [];
    }

    public async parseAdvertisement(url: string, html: string): Promise<IAdvertisement> {
        try {
            const state = this.extractState(html);
            const advertisementInfo = MagaluParser.extractAdvertisementInfo(state);
            const s3Photos = await this.uploadPhotos(advertisementInfo.photos as MagaluState[], 'MAGALU');
            const ad = this.createAdvertisement(advertisementInfo, url, s3Photos, 'MAGALU', html);
            console.log('MagaluParser: Advertisement', ad);
            return ad;
        } catch (error) {
            throw new ParsingError('Falha ao extrair informações do anúncio', html, error as Error);
        }
    }

    private createAdvertisement(
        info: MagaluState,
        url: string,
        photos: string[],
        platform: string,
        html: string
    ): IAdvertisement {
        return {
            id_advertisement: '',
            id_brand: '',
            st_plataform: platform,
            st_plataform_id: info.id as string,
            st_url: url,
            st_title: info.title as string,
            st_description: info.description as string,
            st_photos: photos.join(','),
            db_price: info.price as number,
            st_vendor: info.seller_name as string,
            st_details: JSON.stringify({
                seller: {
                    name: info.seller_name,
                    reputation_rank: info.reputation_rank
                },
                details: {
                    originalPrice: info.original_price
                }
            }),
            st_status: 'NEW',
            st_ml_json: html
        };
    }

    private extractState(html: string): MagaluState {
        const $ = cheerio.load(html);
        const json = $('#__NEXT_DATA__').text();
        if (!json)
            throw new ParsingError('Json not found in __NEXT_DATA__', html);
        return JSON.parse(json);
    }

    public static extractAdvertisementInfo(state: MagaluState): MagaluState {
        try {
            const props = state.props as MagaluState;
            const pageProps = props.pageProps as MagaluState;
            const data = pageProps.data as MagaluState;
            const product = data.product as MagaluState;
            const price = product.price as MagaluState;
            const seller = product.seller as MagaluState;
            const rating = product.rating as MagaluState;
            const media = product.media as MagaluState;
            const images = media.images as string[];

            const result: MagaluState = {
                id: product.id,
                title: product.title,
                description: product.description,
                price: parseFloat(price.bestPrice as string),
                original_price: parseFloat(price.price as string),
                seller_name: seller.description,
                reputation_rank: rating.score,
                photos: images?.map((image: string) => ({
                    id: image.split('/').pop()?.split('.')[0] || '',
                    url: image,
                    advertisementId: product.id
                }))
            };

            return result;
        } catch (error) {
            console.log('Erro ao extrair informações do anúncio:', error, JSON.stringify(state, null, 2));
            throw error;
        }
    }

    private async uploadPhotos(photos: MagaluState[] | undefined, platform: string): Promise<string[]> {
        if (!photos) return [];
        
        return await Promise.all(
            photos.map(photo => 
                this.uploader.uploadImage({
                    imageUrl: photo.url as string,
                    photoId: photo.id as string,
                    advertisementId: photo.advertisementId as string,
                    platform
                })
            )
        );
    }
}