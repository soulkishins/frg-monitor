import { v4 as uuidv4 } from 'uuid';
import { AdvertisementManager } from "../aws/rds";
import { IAdvertisement, IKeyword, IPage, IPagination, IStatistics } from "../base/types";
import { PaginationError, ScrapingError } from "../errors";
import { Scraper } from "./scraper";
import { SQSService } from '../aws/sqs';

export class AdvertisementService {
    constructor(
        private readonly scraper: Scraper,
        private readonly adManager: AdvertisementManager,
        private readonly sqsService: SQSService
    ) {}

    private initializeStatistics(): IStatistics {
        return {
            nr_pages: 0, // Número de páginas processadas - Crawler
            nr_total: 0, // Número total de anúncios localizados - Crawler
            nr_processed: 0, // Número de anúncios processados - Crawler
            nr_created: 0, // Número de anúncios criados - Crawler
            nr_updated: 0, // Número de anúncios atualizados - Crawler
            nr_error: 0, // Número de anúncios com erro - Crawler
            nr_reconcile: 0, // Número de anúncios processados pela AI
            nr_manual_revision: 0, // Número de anúncios para revisão manual - AI
            nr_reported: 0, // Número de anúncios reportados  - AI
            nr_already_reported: 0, // Número de anúncios já reportados anteriormente - AI
            nr_invalidate: 0, // Número de anúncios inválidos - Crawler + AI
            st_status: null // Status da execução
        };
    }

    private updateExecutionStatus(statistics: IStatistics, error?: any): void {
        // Define o status da execução
        // SE - Execução com Sucesso
        // PE - Execução com Falha Parcial
        // ET - Execução com Falha Total
        // EP - Execução com Erro de Paginação
        // GE - Execução com Erro Genérico
        if (error) {
            if (error instanceof ScrapingError) {
                statistics.st_status = statistics.nr_processed > 0 ? 'PE' : 'ET';
            }
            else if (error instanceof PaginationError) {
                statistics.st_status = statistics.nr_pages > 0 ? 'EP' : 'ET';
            } else {
                statistics.st_status = 'GE';
            }
        }
        statistics.st_status = statistics.nr_error === 0 ? 'SE' : 'PE';
    }

    public async searchAndSaveAdvertisements(params: IKeyword): Promise<void> {
        try {
            // Inicializa as estatísticas de Execução
            params.statistics = this.initializeStatistics();

            // Busca e processa anúncios da primeira página
            let page = await this.scraper.searchAdvertisements(params.keyword);
            const pagination: IPagination[] = page.pages;
            // Se houver anúncios na página, processa-os
            while (page.advertisements.length > 0) {
                console.log('SearchAndSaveAdvertisements: Processando página', page.advertisements.length);
                console.log('SearchAndSaveAdvertisements: Anúncios', page.advertisements);
                params.statistics.nr_pages += 1; // Incrementa o número de páginas processadas
                params.statistics.nr_total += page.advertisements.length; // Incrementa o número total de anúncios localizados
                await this.processAdvertisements(page, params); // Processa os anúncios da página atual
                page = await this.scraper.nextPage(page); // Obtém a próxima página
                page.pages = this.joinPagination(page.pages, pagination); // Atualiza a lista de páginas
            }
            // Atualiza o status da execução
            this.updateExecutionStatus(params.statistics);
            
        } catch (error) {
            // Atualiza o status da execução
            this.updateExecutionStatus(params.statistics, error);
            console.error('Erro ao processar anúncios', error);
        } finally {
            // Atualiza o status da execução
            console.log('SearchAndSaveAdvertisements: Atualizando estatisticas', params.statistics);
            await this.adManager.updateStatistics(params);
        }
    }

    private joinPagination(pages: IPagination[], pagination: IPagination[]): IPagination[] {
        return this.scraper.joinPagination(pages, pagination);
    }

    private async processAdvertisements(
        page: IPage, params: IKeyword
    ): Promise<void> {
        // Cria uma lista de anúncios para enviar para a fila de processamento da AI
        // Processa os anúncios da página atual
        let sqsAds: (string|undefined)[] = await Promise.all(page.advertisements.map(async(advertisement) => {
            // Verifica se o anúncio já existe no banco de dados
            // const existingAd = await this.adManager.getAdvertisementByPlataform(
            //     advertisement.st_plataform,
            //     advertisement.st_plataform_id,
            //     advertisement.st_url,
            //     params.brand_id
            // );
            // Se o anúncio não existe no banco de dados ou não está invalidado, processa o anúncio
            // if (!existingAd || advertisement.st_status !== 'INVALIDATE') {
            //     // Lê os dados do anúncio
                const ad = await this.scraper.readAdvertisements(advertisement);
            //     // Processa o anúncio para atualizar o status e os dados
            //     await this.processAdvertisement(ad, existingAd, params);
            //     // Se o anúncio não está com erro, adiciona na lista de anúncios para enviar para a fila de processamento da AI
            //     if (ad.st_status !== 'ERROR') {
            //         return ad.id_advertisement;
            //     }
            // }
            return undefined;
        }));

        // Remove os anúncios inválidos da lista
        sqsAds = sqsAds.filter(ad => ad !== undefined);

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
        advertisement: IAdvertisement,
        existingAd: IAdvertisement | null,
        params: IKeyword
    ): Promise<void> {
        // Incrementa o número de anúncios processados
        params.statistics.nr_processed += 1;

        // Incrementa o número de anúncios com erro
        if (advertisement.st_status === 'ERROR') {
            params.statistics.nr_error += 1;
        }

        // Incrementa o número de anúncios já reportados anteriormente
        if (existingAd && existingAd.st_status === 'REPORTED') {
            params.statistics.nr_already_reported += 1;
        }

        // Atualiza o ID do anúncio
        advertisement.id_advertisement = existingAd?.id_advertisement || uuidv4();
        // Atualiza o ID da marca
        advertisement.id_brand = params.brand_id;

        // Se o anúncio já existe no banco de dados, atualiza o anúncio
        if (existingAd) {
            params.statistics.nr_updated += 1;
            await this.updateExistingAdvertisement(existingAd, advertisement, params);
        } else {
            // Incrementa o número de anúncios criados
            params.statistics.nr_created += 1;
            // Cria um novo anúncio
            await this.createNewAdvertisement(advertisement, params);
        }
    }

    private async updateExistingAdvertisement(
        existingAd: IAdvertisement,
        newAd: IAdvertisement,
        params: IKeyword
    ): Promise<void> {
        // Atualiza o anúncio
        await this.adManager.updateAdvertisement(existingAd, newAd);
        // Adiciona a palavra chave ao anúncio
        await Promise.all([
            // Adiciona a palavra chave ao anúncio
            this.adManager.addKeyword({
                id_advertisement: existingAd.id_advertisement!,
                id_keyword: params.keyword_id,
                st_keyword: params.keyword
            }),
            // Adiciona os produtos ao anúncio
            ...params.products.map(product => 
                this.adManager.addProduct({
                    ...product,
                    id_advertisement: existingAd.id_advertisement
                })
            ),
            // Adiciona o histórico de anúncios
            this.addAdvertisementHistory(existingAd.id_advertisement!, newAd, 'CRAWLER_UPDATED', existingAd.st_status)
        ]);
    }

    private async createNewAdvertisement(
        advertisement: IAdvertisement,
        params: IKeyword
    ): Promise<void> {
        // Cria um novo anúncio
        const adId = await this.adManager.createAdvertisement(advertisement);
        // Adiciona a palavra chave ao anúncio
        await Promise.all([
            // Adiciona a palavra chave ao anúncio
            this.adManager.addKeyword({
                id_advertisement: adId,
                id_keyword: params.keyword_id,
                st_keyword: params.keyword
            }),
            // Adiciona os produtos ao anúncio
            ...params.products.map(product => 
                this.adManager.addProduct({
                    ...product,
                    id_advertisement: adId
                })
            ),
            // Adiciona o histórico de anúncios
            this.addAdvertisementHistory(adId, advertisement, 'CRAWLER_CREATED', advertisement.st_status)
        ]);
    }

    private async addAdvertisementHistory(
        adId: string,
        advertisement: IAdvertisement,
        action: 'CRAWLER_CREATED' | 'CRAWLER_UPDATED',
        status: string
    ): Promise<void> {
        // Remove o JSON do anúncio
        const ml_json = advertisement.st_ml_json || '';
        delete advertisement.st_ml_json;
        // Se o status do anúncio é erro e o status do anúncio é novo, atualiza o status do anúncio para novo
        if (status === 'ERROR' && advertisement.st_status === 'NEW') {
            status = 'NEW';
        }
        // Adiciona o histórico de anúncios
        await this.adManager.addHistory({
            id_advertisement: adId,
            st_status: status || 'NEW',
            st_action: action,
            st_ml_json: ml_json,
            st_history: JSON.stringify(advertisement)
        });
    }
} 