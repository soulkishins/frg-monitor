import { v4 as uuidv4 } from 'uuid';
import { ScrapingError, ServiceError } from "../errors";
import { AdvertisementManager } from "../aws/rds";
import { IAdvertisement, IKeyword, IMLAdvertisement, IMLPage } from "../base/types";
import { MLScraper } from "./ml-scraper";
import { SQSService } from '../aws/sqs';
export class AdvertisementService {
    constructor(
        private readonly scraper: MLScraper,
        private readonly adManager: AdvertisementManager,
        private readonly sqsService: SQSService
    ) {}

    public async searchAndSaveAdvertisements(params: IKeyword): Promise<void> {
        try {
            params.statistics = {
                nr_pages: 0,
                nr_total: 0,
                nr_processed: 0,
                nr_created: 0,
                nr_updated: 0,
                nr_error: 0,
                nr_manual_revision: 0,
                nr_reported: 0,
                nr_already_reported: 0,
                nr_invalidate: 0,
                nr_reconcile: 0,
                st_status: null
            };

            let page = await this.scraper.searchAdvertisements(params.keyword);            
            while (page.advertisements.length > 0) {
                params.statistics.nr_pages += 1;
                await this.processAdvertisements(page, params);
                page = await this.scraper.nextPage(page);
            }

            params.statistics.st_status = params.statistics.nr_error === 0 ? 'SE' : 'PE';
        } catch (error) {
            if (error instanceof ScrapingError) {
                if (error.type === 'P' && params.statistics.nr_pages > 0) {
                    params.statistics.st_status = 'EP';
                } else if (error.type === 'P' && params.statistics.nr_pages === 0) {
                    params.statistics.st_status = 'ET';
                } else {
                    params.statistics.st_status = 'GE';
                }
            } else {
                params.statistics.st_status = 'GE';
            }
            throw new ServiceError('Falha ao processar anúncios', error as Error);
        } finally {
            await this.adManager.updateStatistics(params);
        }
    }

    private async processAdvertisements(
        page: IMLPage,
        params: IKeyword
    ): Promise<void> {
        const advertisements = await this.scraper.readAdvertisements(page);

        await Promise.all(
            advertisements.map(advertisement => this.processAdvertisement(advertisement, params))
        );

        const sqsAds = advertisements.map(ad => ad.id_advertisement);
        
        // Enviar mensagens em lotes de 50 registros
        const batchSize = 50;
        for (let i = 0; i < sqsAds.length; i += batchSize) {
            const batch = sqsAds.slice(i, i + batchSize);
            const sqsMessage = {
                messageBody: JSON.stringify({
                    advertisements: batch,
                    scheduler_id: params.scheduler_id,
                    scheduler_date: params.datetime
                })
            };
            const messageId = await this.sqsService.sendMessage(sqsMessage);
            console.log(`Message sent with ID: ${messageId} (batch ${Math.floor(i/batchSize) + 1})`);
        }
    }

    private async processAdvertisement(
        advertisement: IMLAdvertisement,
        params: IKeyword
    ): Promise<void> {
        const existingAd = await this.adManager.getAdvertisementByPlataform(
            advertisement.st_plataform,
            advertisement.st_plataform_id,
            advertisement.st_url,
            params.brand_id
        );

        params.statistics.nr_total += 1;
        params.statistics.nr_processed += 1;

        if (advertisement.st_status === 'ERROR') {
            params.statistics.nr_error += 1;
        }

        if (existingAd && existingAd.st_status === 'REPORTED') {
            params.statistics.nr_already_reported += 1;
        }

        advertisement.id_advertisement = existingAd?.id_advertisement || uuidv4();
        advertisement.id_brand = params.brand_id;

        if (existingAd) {
            params.statistics.nr_updated += 1;
            await this.updateExistingAdvertisement(existingAd, advertisement, params);
        } else {
            params.statistics.nr_created += 1;
            await this.createNewAdvertisement(advertisement, params);
        }
    }

    private async updateExistingAdvertisement(
        existingAd: IAdvertisement,
        newAd: IMLAdvertisement,
        params: IKeyword
    ): Promise<void> {
        await this.adManager.updateAdvertisement(existingAd, newAd);
        await Promise.all([
            this.adManager.addKeyword({
                id_advertisement: existingAd.id_advertisement,
                id_keyword: params.keyword_id,
                st_keyword: params.keyword
            }),
            ...params.products.map(product => 
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
        params: IKeyword
    ): Promise<void> {
        const adId = await this.adManager.createAdvertisement(advertisement);
        
        await Promise.all([
            this.adManager.addKeyword({
                id_advertisement: adId,
                id_keyword: params.keyword_id,
                st_keyword: params.keyword
            }),
            ...params.products.map(product => 
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
        if (status === 'ERROR' && advertisement.st_status === 'NEW') {
            status = 'NEW';
        }
        await this.adManager.addHistory({
            id_advertisement: adId,
            st_status: status || 'NEW',
            st_action: action,
            st_ml_json: ml_json,
            st_history: JSON.stringify(advertisement)
        });
    }
} 