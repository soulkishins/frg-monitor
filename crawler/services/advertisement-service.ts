import { v4 as uuidv4 } from 'uuid';
import { ServiceError } from "../errors";
import { AdvertisementManager } from "../aws/rds";
import { IAdvertisement, IClientBrandProduct, IMLAdvertisement, IMLPage } from "../base/types";
import { MLScraper } from "./ml-scraper";

export class AdvertisementService {
    constructor(
        private readonly scraper: MLScraper,
        private readonly adManager: AdvertisementManager
    ) {}

    public async searchAndSaveAdvertisements(params: {
        id_keyword: string;
        keyword: string;
        idBrand: string;
        brandProducts: IClientBrandProduct[];
    }): Promise<void> {
        try {
            let page = await this.scraper.searchAdvertisements(params.keyword);
            
            while (page.advertisements.length > 0) {
                await this.processAdvertisements(page, params);
                page = await this.scraper.nextPage(page);
            }
        } catch (error) {
            throw new ServiceError('Falha ao processar anúncios', error as Error);
        }
    }

    private async processAdvertisements(
        page: IMLPage,
        params: { id_keyword: string; keyword: string; idBrand: string; brandProducts: IClientBrandProduct[] }
    ): Promise<void> {
        const advertisements = await this.scraper.readAdvertisements(page);

        await Promise.all(
            advertisements.map(advertisement => this.processAdvertisement(advertisement, params))
        );
    }

    private async processAdvertisement(
        advertisement: IMLAdvertisement,
        params: { id_keyword: string; keyword: string; idBrand: string; brandProducts: IClientBrandProduct[] }
    ): Promise<void> {
        const existingAd = await this.adManager.getAdvertisementByPlataform(
            advertisement.st_plataform,
            advertisement.st_plataform_id,
            advertisement.st_url,
            params.idBrand
        );

        advertisement.id_advertisement = existingAd?.id_advertisement || uuidv4();
        advertisement.id_brand = params.idBrand;

        if (existingAd) {
            await this.updateExistingAdvertisement(existingAd, advertisement, params);
        } else {
            await this.createNewAdvertisement(advertisement, params);
        }
    }

    private async updateExistingAdvertisement(
        existingAd: IAdvertisement,
        newAd: IMLAdvertisement,
        params: { id_keyword: string; keyword: string; brandProducts: IClientBrandProduct[] }
    ): Promise<void> {
        await this.adManager.updateAdvertisement(existingAd, newAd);
        await Promise.all([
            this.adManager.addKeyword({
                id_advertisement: existingAd.id_advertisement,
                id_keyword: params.id_keyword,
                st_keyword: params.keyword
            }),
            ...params.brandProducts.map(product => 
                this.adManager.addProduct({
                    ...product,
                    id_advertisement: existingAd.id_advertisement
                })
            ),
            this.addAdvertisementHistory(existingAd.id_advertisement, newAd, 'CRAWLER_UPDATED', existingAd.st_status)
        ]);
    }

    private async createNewAdvertisement(
        advertisement: IMLAdvertisement,
        params: { id_keyword: string; keyword: string; brandProducts: IClientBrandProduct[] }
    ): Promise<void> {
        const adId = await this.adManager.createAdvertisement(advertisement);
        
        await Promise.all([
            this.adManager.addKeyword({
                id_advertisement: adId,
                id_keyword: params.id_keyword,
                st_keyword: params.keyword
            }),
            ...params.brandProducts.map(product => 
                this.adManager.addProduct({
                    ...product,
                    id_advertisement: adId
                })
            ),
            this.addAdvertisementHistory(adId, advertisement, 'CRAWLER_CREATED', advertisement.st_status)
        ]);
    }

    private async addAdvertisementHistory(
        adId: string,
        advertisement: IMLAdvertisement,
        action: 'CRAWLER_CREATED' | 'CRAWLER_UPDATED',
        status: string
    ): Promise<void> {
        const ml_json = advertisement.ml_json || {};
        delete advertisement.ml_json;
        await this.adManager.addHistory({
            id_advertisement: adId,
            st_status: status || 'NEW',
            st_action: action,
            st_ml_json: ml_json,
            st_history: JSON.stringify(advertisement)
        });
    }
} 