import { v4 as uuidv4 } from 'uuid';
import { ServiceError } from "../errors";
import { AdvertisementManager } from "../aws/rds";
import { IAdvertisement, IClientBrandProduct, IMLAdvertisement, IMLPage } from "../base/types";
import { MLParser } from "./ml-parser";
import { MLScraper } from "./ml-scraper";
import { S3Uploader } from "./s3-uploader";

export class AdvertisementService {
    constructor(
        private readonly scraper: MLScraper,
        private readonly parser: MLParser,
        private readonly uploader: S3Uploader,
        private readonly adManager: AdvertisementManager
    ) {}

    public async searchAndSaveAdvertisements(params: {
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
        params: { idBrand: string; brandProducts: IClientBrandProduct[] }
    ): Promise<void> {
        const advertisements = await this.scraper.readAdvertisements(page);

        await Promise.all(
            advertisements.map(advertisement => this.processAdvertisement(advertisement, params))
        );
    }

    private async processAdvertisement(
        advertisement: IMLAdvertisement,
        params: { idBrand: string; brandProducts: IClientBrandProduct[] }
    ): Promise<void> {
        const existingAd = await this.adManager.getAdvertisementByPlataform(
            advertisement.st_plataform,
            advertisement.st_plataform_id,
            advertisement.st_url
        );

        advertisement.id_advertisement = existingAd?.id_advertisement || uuidv4();
        advertisement.id_brand = params.idBrand;

        if (existingAd) {
            await this.updateExistingAdvertisement(existingAd, advertisement);
        } else {
            await this.createNewAdvertisement(advertisement, params.brandProducts);
        }
    }

    private async updateExistingAdvertisement(
        existingAd: IAdvertisement,
        newAd: IMLAdvertisement
    ): Promise<void> {
        await this.adManager.updateAdvertisement(existingAd, newAd);
        await this.addAdvertisementHistory(existingAd.id_advertisement, newAd, 'CRAWLER_UPDATED', existingAd.st_status);
    }

    private async createNewAdvertisement(
        advertisement: IMLAdvertisement,
        brandProducts: IClientBrandProduct[]
    ): Promise<void> {
        const adId = await this.adManager.createAdvertisement(advertisement);
        
        await Promise.all([
            ...brandProducts.map(product => 
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
        await this.adManager.addHistory({
            id_advertisement: adId,
            st_status: status || 'NEW',
            st_action: action,
            st_ml_json: ml_json,
            st_history: JSON.stringify(advertisement)
        });
    }
} 