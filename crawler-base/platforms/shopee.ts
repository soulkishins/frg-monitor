import { IAdvertisement, IPagination, IPage } from "../base/types";
import { ServiceError, PaginationError, ScrapingError, ParsingError } from "../errors";
import { S3Uploader } from "../services/s3-uploader";
import { Scraper, Parser } from "../services/scraper";
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export class ShopeeScraper extends Scraper {
    constructor(parser: Parser) {
        super(parser);
    }

    protected getURL(keyword: string): string {
        return `https://shopee.com.br/search?keyword=${encodeURIComponent(keyword)}`;
    }

    protected getReferer(): string {
        return 'https://shopee.com.br/';
    }

    protected override getHeaders(): Record<string, string> {
        return {
            ...super.getHeaders(),
            'af-ac-enc-dat': 'null',
            'x-api-source': 'pc',
            'x-shopee-language': 'pt-BR'
        };
    }
}

export class ShopeeParser extends Parser {
    private static readonly API_DATA_REGEX = /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/;

    constructor(uploader: S3Uploader) {
        super(uploader);
    }

    public parseInitialPage($: CheerioAPI): IAdvertisement[] {
        try {
            const scriptContent = $('script').filter(function(this: any, i: number, elem: any): boolean {
                return $(elem).html()?.includes('__INITIAL_STATE__') ?? false;
            }).first().html() || '';

            const match = scriptContent.match(ShopeeParser.API_DATA_REGEX);
            if (!match?.[1]) {
                throw new ParsingError('Initial state data not found', scriptContent);
            }

            const data = JSON.parse(match[1]);
            const items = data.items || [];
            
            return items.map((item: any) => ({
                st_title: item.name,
                db_price: item.price / 100000, // Shopee prices are in smallest currency unit
                st_url: `https://shopee.com.br/${item.name.replace(/\s+/g, '-')}-i.${item.shopid}.${item.itemid}`,
                st_plataform: 'Shopee',
                st_plataform_id: `${item.itemid}`,
                st_status: 'NEW'
            }));
        } catch (error) {
            throw new ScrapingError('Failed to extract advertisements', error as Error);
        }
    }

    public parseInitialPagination($: CheerioAPI): IPagination[] {
        const pages: IPagination[] = [];
        $('.shopee-page-controller button').each((i, elem) => {
            const pageNum = $(elem).text();
            if (pageNum && !isNaN(Number(pageNum))) {
                pages.push({
                    visited: $(elem).hasClass('shopee-button-solid'),
                    link: `${this.getCurrentUrl()}&page=${pageNum}`
                });
            }
        });
        return pages;
    }

    public parseNextPage($: CheerioAPI): IAdvertisement[] {
        return this.parseInitialPage($);
    }

    public parseNextPagination($: CheerioAPI): IPagination[] {
        return this.parseInitialPagination($);
    }

    public async parseAdvertisement(url: string, html: string): Promise<IAdvertisement> {
        try {
            const $ = cheerio.load(html);
            const scriptContent = $('script').filter(function(this: any, i: number, elem: any): boolean {
                return $(elem).html()?.includes('__INITIAL_STATE__') ?? false;
            }).first().html() || '';

            const match = scriptContent.match(ShopeeParser.API_DATA_REGEX);
            if (!match?.[1]) {
                throw new ParsingError('Product data not found', html);
            }

            const data = JSON.parse(match[1]);
            const productInfo = data.product || {};
            
            const photos = (productInfo.images || []).map((imageId: string) => ({
                id: imageId,
                url: `https://cf.shopee.com.br/file/${imageId}_tn`,
                advertisementId: productInfo.itemid
            }));

            const s3Photos = await this.uploadPhotos(photos, 'Shopee');

            return {
                id_advertisement: '',
                id_brand: '',
                st_plataform: 'Shopee',
                st_plataform_id: productInfo.itemid.toString(),
                st_url: url,
                st_title: productInfo.name,
                st_description: productInfo.description,
                st_photos: s3Photos.join(','),
                db_price: productInfo.price / 100000,
                st_vendor: productInfo.shop_name,
                st_details: JSON.stringify({
                    seller: {
                        name: productInfo.shop_name,
                        shop_id: productInfo.shopid
                    },
                    details: {
                        originalPrice: productInfo.price_before_discount / 100000,
                        sold: productInfo.historical_sold,
                        stock: productInfo.stock,
                        new: !productInfo.used,
                        categories: productInfo.categories
                    }
                }),
                st_status: 'NEW',
                st_ml_json: html
            };
        } catch (error) {
            throw new ParsingError('Failed to extract product information', html, error as Error);
        }
    }

    private getCurrentUrl(): string {
        // Implementation to get current URL from context
        return '';
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
}

interface PhotoInfo {
    id: string;
    url: string;
    advertisementId: string;
}