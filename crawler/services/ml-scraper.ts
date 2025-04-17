import axios from "axios";
import * as cheerio from 'cheerio';
import { ScrapingError } from "../errors";
import { IMLPage, IMLAdvertisementUrl, IPagination, IMLAdvertisement } from "../base/types";
import { MLParser } from "./ml-parser";

export class MLScraper {
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

    constructor(private readonly parser: MLParser) {}

    public async searchAdvertisements(keyword: string): Promise<IMLPage> {
        try {
            const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(keyword)}`;
            const response = await axios.get(searchUrl, {headers: this.headers, timeout: 5000});

            console.log('searchAdvertisements', response.data);
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
        const advertisementsJson = $('script[type=application/ld+json]').text();
        try {
            const advertisementsJsonParsed = JSON.parse(advertisementsJson);
            /*
            $('.ui-search-result__wrapper').each((i, elem) => {
                const title = $(elem).find('.poly-component__title').text().trim();
                const price = $(elem).find('.poly-component__price').text().trim();
                const link = $(elem).find('.poly-component__title').attr('href') || '';
                advertisements.push({ title, price, link });
            });
            */
            const page = advertisementsJsonParsed['@graph'].find((item: any) => item['@type'] === 'SearchResultsPage');
            advertisementsJsonParsed['@graph'].forEach((item: any) => {
                if (item['@type'] === 'Product') {
                    advertisements.push({ title: item.name, price: item.offers.price, link: item.offers.url });
                }
            });
            console.log('Page', page, advertisements);
        } catch (error) {
            console.log('advertisementsJson', advertisementsJson);
            throw new ScrapingError('Falha ao extrair anúncios', error as Error);
        }
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

            const response = await axios.get(nextPageUrl, {headers: this.headers, timeout: 5000});
            //console.log('nextPage', response.data);
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