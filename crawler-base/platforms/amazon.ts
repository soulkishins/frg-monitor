import { IAdvertisement, IPagination, IPage } from "../base/types";
import { ServiceError, PaginationError, ScrapingError, ParsingError } from "../errors";
import { S3Uploader } from "../services/s3-uploader";
import { Scraper, Parser } from "../services/scraper";
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

interface PhotoInfo {
    id: string;
    url: string;
    advertisementId: string;
}

export class AmazonScraper extends Scraper {
    constructor(parser: Parser) {
        super(parser);
    }

    protected getURL(keyword: string): string {
        return `https://www.amazon.com.br/s?k=${encodeURIComponent(keyword)}`;
    }

    protected getReferer(): string {
        return 'https://www.amazon.com.br/';
    }

    public joinPagination(pages: IPagination[], pagination: IPagination[]): IPagination[] {
        for (const page of pages) {
            const index = pagination.findIndex(p => this.isSamePage(p, page));
            if (index === -1) {
                pagination.push(page);
            }
        }
        return pagination;
    }

    private isSamePage(page1: IPagination, page2: IPagination): boolean {
        if (!page2.link || page2.link.indexOf('page=') === -1)
            return true;
        const pos1 = page1.link.indexOf('page=');
        const pos1End = page1.link.indexOf('&', pos1);
        const pos2 = page2.link.indexOf('page=');
        const pos2End = page2.link.indexOf('&', pos2);
        const page1Number = page1.link.substring(pos1 + 5, pos1End);
        const page2Number = page2.link.substring(pos2 + 5, pos2End);
        return page1Number === page2Number;
    }
}

export class AmazonParser extends Parser {
    constructor(uploader: S3Uploader) {
        super(uploader);
    }

    public parseInitialPage($: CheerioAPI): IAdvertisement[] {
        try {
            const advertisements: IAdvertisement[] = [];
            
            $('div[role="listitem"]').each((_, element) => {
                const $element = $(element);
                const title = $element.find('h2.a-size-base-plus.a-spacing-none.a-color-base.a-text-normal span').text().trim();
                const url = 'https://www.amazon.com.br' + $element.find('a.a-link-normal').attr('href');
                const priceElement = $element.find('span.a-price span.a-offscreen');
                const price = priceElement.length ? 
                    parseFloat(priceElement.text().replace('R$', '').replace('.', '').replace(',', '.').trim()) : 0;
                const asin = $element.attr('data-asin') || '';

                if (title && url) {
                    advertisements.push({
                        st_title: title,
                        db_price: price,
                        st_url: url,
                        st_plataform: 'Amazon',
                        st_plataform_id: asin,
                        st_status: 'NEW'
                    });
                }
            });

            return advertisements;
        } catch (error) {
            throw new ScrapingError('Failed to extract advertisements', error as Error);
        }
    }

    public parseInitialPagination($: CheerioAPI): IPagination[] {
        const pages: IPagination[] = [];
        $('div.s-pagination-container .s-pagination-item').each((_, element) => {
            const $element = $(element);
            const pageNum = $element.text().trim();
            if (pageNum && !isNaN(Number(pageNum))) {
                pages.push({
                    visited: $element.hasClass('s-pagination-selected'),
                    link: 'https://www.amazon.com.br' + $element.attr('href') || ''
                });
            }
        });
        if (pages.length > 0 && !pages[0].link) {
            pages[0].link = 'https://www.amazon.com.br/s?&page=1&';
        }
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
            
            const asinValue = $('#deliveryBlockSelectAsin').val() || $('#ASIN').val() || '';
            const asin = typeof asinValue === 'string' ? asinValue : typeof asinValue === 'object' ? asinValue[0] : '';
            if (!asin) {
                throw new ParsingError('Failed to extract product information', html, new Error('ASIN not found'));
            }

            const title = $('#productTitle').text()?.trim();
            const description = $('#productDescription').text()?.trim();
            const priceElement = $('.a-price .a-offscreen');
            const price = priceElement.length ? 
                parseFloat(priceElement.text().replace('R$', '').replace('.', '').replace(',', '.').trim()) : 0;

            const seller = $('#sellerProfileTriggerId').text()?.trim() || $('#merchantInfoFeature_feature_div .offer-display-feature-text span').text()?.trim() || $('#merchant-info').text()?.trim();
            let sellers: { name: string, value: number }[] = [];

            try {
                const qid = $('#qid').val() || '';
                const smid = $('#smid').val() || '';
                const sourcecustomerorglistid = $('#sourcecustomerorglistid').val() || '';
                const sourcecustomerorglistitemid = $('#sourcecustomerorglistitemid').val() || '';
                const sr = $('#sr').val() || '';
                const pc = $('#pc').val() || 'dp';
                const aodOfferUrl = `https://www.amazon.com.br/gp/product/ajax/ref=dp_aod_unknown_mbc?asin=${asin}&m=&qid=${qid}&smid=${smid}&sourcecustomerorglistid=${sourcecustomerorglistid}&sourcecustomerorglistitemid=${sourcecustomerorglistitemid}&sr=${sr}&pc=${pc}&experienceId=aodAjaxMain`;
                const aodOfferResponse = await fetch(aodOfferUrl);
                const aodOfferData = await aodOfferResponse.text();

                const $aodOffer = cheerio.load(aodOfferData);

                $aodOffer("#aod-offer").each((_, element) => {
                    const $element = $(element);
                    const sellerName = $element.find('#aod-offer-soldBy a').text().trim();
                    const sellerValue = parseFloat(
                        $element
                        .find('span[id^=aod-price] .aok-offscreen')
                        .text()
                        .replace('R$', '')
                        .replace('.', '')
                        .replace(',', '.')
                        .trim()
                    );
                    sellers.push({
                        name: sellerName,
                        value: sellerValue
                    });
                });

                // ordernar sellers por value, menor para o maior
                sellers.sort((a, b) => a.value - b.value);
            } catch (error) {
                console.error('AmazonParser: Error parsing AOD Offer', error);
            }

            const photos: PhotoInfo[] = [];
            $('#imageBlock img').each((_, element) => {
                const imgUrl = $(element).attr('src');
                if (imgUrl) {
                    photos.push({
                        id: imgUrl.split('/').pop() || '',
                        url: imgUrl,
                        advertisementId: asin!
                    });
                }
            });

            const s3Photos = await this.uploadPhotos(photos, 'Amazon');

            const advertisement: IAdvertisement = {
                id_advertisement: '',
                id_brand: '',
                st_plataform: 'Amazon',
                st_plataform_id: asin,
                st_url: url,
                st_title: title,
                st_description: description,
                st_photos: s3Photos.join(','),
                db_price: price > 0.0 ? price : sellers[0]?.value,
                st_vendor: seller ? seller : sellers[0]?.name || '',
                st_details: JSON.stringify({
                    sellers: sellers
                }),
                st_status: 'NEW',
                st_ml_json: html
            };

            return advertisement;

        } catch (error) {
            throw new ParsingError('Failed to extract product information', html, error as Error);
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
}