import axios from "axios";
import * as cheerio from 'cheerio';
import { ScrapingError } from "../errors";
import { IMLPage, IMLAdvertisementUrl, IPagination, IMLAdvertisement } from "../base/types";
import { MLParser } from "./ml-parser";

export class MLScraper {
    constructor(private readonly parser: MLParser) {}

    public async searchAdvertisements(keyword: string): Promise<IMLPage> {
        try {
            const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(keyword)}`;
            const response = await axios.get(searchUrl);
            const $ = cheerio.load(response.data);
            
            return {
                advertisements: this.extractAdvertisementsFromPage($),
                pages: this.extractPaginationFromPage($)
            };
        } catch (error) {
            throw new ScrapingError('Falha na busca de produtos', error as Error);
        }
    }

    private extractAdvertisementsFromPage($: cheerio.CheerioAPI): IMLAdvertisementUrl[] {
        const advertisements: IMLAdvertisementUrl[] = [];
        $('.ui-search-result__wrapper').each((i, elem) => {
            const title = $(elem).find('.poly-component__title').text().trim();
            const price = $(elem).find('.poly-component__price').text().trim();
            const link = $(elem).find('.poly-component__title').attr('href') || '';
            advertisements.push({ title, price, link });
        });
        return advertisements;
    }

    private extractPaginationFromPage($: cheerio.CheerioAPI): IPagination[] {
        const pages: IPagination[] = [];
        $('.andes-pagination__button a').each((i, elem) => {
            const link = $(elem).attr('href') || '';
            const current = $(elem).attr('aria-current') || '';
            pages.push({ current, link });
        });
        return pages;
    }

    public async nextPage(page: IMLPage): Promise<IMLPage> {
        try {
            const currentPage = page.pages.findIndex(p => p.current === 'page');
            if (currentPage === page.pages.length - 1) {
                return { advertisements: [], pages: [] };
            }

            const nextPageUrl = page.pages[currentPage + 1].link;
            if (!nextPageUrl) {
                return { advertisements: [], pages: [] };
            }

            const response = await axios.get(nextPageUrl);
            const $ = cheerio.load(response.data);
            
            return {
                advertisements: this.extractAdvertisementsFromPage($),
                pages: this.extractPaginationFromPage($)
            };
        } catch (error) {
            throw new ScrapingError('Falha ao buscar próxima página', error as Error);
        }
    }

    public async readAdvertisements(page: IMLPage): Promise<IMLAdvertisement[]> {
        try {
            const advertisements = await Promise.all(
                page.advertisements.map(async url => await this.parser.extractAdvertisementDetails(url))
            );
            return advertisements;
        } catch (error) {
            throw new ScrapingError('Falha ao ler anúncios', error as Error);
        }
    }
} 