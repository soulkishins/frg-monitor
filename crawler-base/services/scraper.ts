import axios from "axios";
import * as cheerio from 'cheerio';
import { Agent } from 'https';
import { IAdvertisement, IPagination, IPage } from "../base/types";
import { ServiceError, PaginationError, ScrapingError } from "../errors";
import { S3Uploader } from "./s3-uploader";

const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,zh-HK;q=0.6,zh-SG;q=0.5,zh;q=0.4',
    'Cache-Control': 'max-age=0',
    'Referer': '',
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

export class Scraper {
    private readonly agent: Agent;

    constructor(protected readonly parser: Parser) {
        this.agent = new Agent({
            keepAlive: true,
            keepAliveMsecs: 3000,
            maxSockets: 100,
            timeout: 60000
        });
        headers.Referer = this.getReferer();
    }

    public async validateIP(): Promise<string> {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    }

    protected getHeaders(): Record<string, string> {
        return { ...headers };
    }

    // Função para aguardar um tempo aleatório entre min e max milissegundos
    private sleep(min = 1500, max = 4000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    public async searchAdvertisements(keyword: string): Promise<IPage> {
        try {
            console.log('Search: Iniciando busca de produtos', keyword);
            await this.sleep();
            const searchUrl = this.getURL(keyword);
            console.log('Search: URL de busca', searchUrl);
            const response = await axios.get(searchUrl, {
                headers: this.getHeaders(), 
                timeout: 5000,
                decompress: true,
                httpsAgent: this.agent
            });
            //console.log('Search: Resposta da busca', response.data);
            const $ = cheerio.load(response.data);
            return {
                advertisements: this.parser.parseInitialPage($),
                pages: this.parser.parseInitialPagination($)
            };
        } catch (error) {
            throw new PaginationError('Falha na busca de inicial', error as Error);
        }
    }

    public async nextPage(page: IPage): Promise<IPage> {
        const nextPage = page.pages.find(p => p.visited === false);
        if (nextPage) {
            return await this.openPage(nextPage);
        }
        return {pages: [], advertisements: []};
    }

    private async openPage(page: IPagination): Promise<IPage> {
        try {
            console.log('NextPage: Carregando próxima página', page.link);
            await this.sleep();
            page.visited = true;
            const searchUrl = page.link;
            console.log('NextPage: URL de busca', searchUrl);
            const response = await axios.get(searchUrl, {
                headers: this.getHeaders(), 
                timeout: 5000,
                decompress: true,
                httpsAgent: this.agent
            });
            //console.log('NextPage: Resposta da busca', response.data);
            const $ = cheerio.load(response.data);
            return {
                advertisements: this.parser.parseNextPage($),
                pages: this.parser.parseNextPagination($)
            };
        } catch (error) {
            throw new PaginationError('Falha na busca da próxima página', error as Error);
        }
    }

    public async readAdvertisements(advertisement: IAdvertisement): Promise<IAdvertisement> {
        try {
            console.log('ReadAdvertisements: Carregando anúncio', advertisement.st_url);
            await this.sleep();
            const response = await axios.get(advertisement.st_url, {
                headers: this.getHeaders(),
                timeout: 5000,
                decompress: true,
                httpsAgent: this.agent
            });
            //console.log('ReadAdvertisements: Resposta do anúncio', response.data);
            if (response.status > 299) {
                advertisement.st_status = 'ERROR';
                advertisement.st_description = `Erro: ${response.status}`;
                advertisement.st_ml_json = response.data;
                return advertisement;
            }
            return this.parser.parseAdvertisement(response.request?.res?.responseUrl || advertisement.st_url, response.data);
        } catch (error) {
            throw new ScrapingError('Falha na leitura dos anúncios', error as Error);
        }
    }

    protected getURL(keyword: string): string {
        throw new ServiceError('Not implemented');
    }

    protected getReferer(): string {
        throw new ServiceError('Not implemented');
    }

    public joinPagination(pages: IPagination[], pagination: IPagination[]): IPagination[] {
        for (const page of pages) {
            const index = pagination.findIndex(p => p.link === page.link);
            if (index === -1) {
                pagination.push(page);
            }
        }
        return pagination;
    }
}

export class Parser {
    constructor(protected readonly uploader: S3Uploader) {}

    public parseInitialPage(html: cheerio.CheerioAPI): IAdvertisement[] {
        throw new ServiceError('Not implemented');
    }

    public parseInitialPagination(html: cheerio.CheerioAPI): IPagination[] {
        throw new ServiceError('Not implemented');
    }

    public parseNextPage(html: cheerio.CheerioAPI): IAdvertisement[] {
        throw new ServiceError('Not implemented');
    }

    public parseNextPagination(html: cheerio.CheerioAPI): IPagination[] {
        throw new ServiceError('Not implemented');
    }

    public async parseAdvertisement(url: string, html: string): Promise<IAdvertisement> {
        throw new ServiceError('Not implemented');
    }
}
