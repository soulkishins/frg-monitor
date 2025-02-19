import { ConfigManager } from './base/config';
import { AdvertisementManager } from './aws/rds';
import { S3Uploader } from './services/s3-uploader';
import { MLParser } from './services/ml-parser';
import { MLScraper } from './services/ml-scraper';
import { AdvertisementService } from './services/advertisement-service';

export const handler = async (event) => {
    try {
        console.log('Iniciando crawler...');
        
        console.log('Carregando configurações...');
        // Carregar configurações do Secrets Manager
        const configManager = ConfigManager.getInstance();
        const config = await configManager.loadConfig();
        console.log('Configurações carregadas com sucesso.');

        console.log('Iniciando serviços...');
        // Inicializar serviços com as configurações
        const uploader = new S3Uploader(config.aws);
        const parser = new MLParser(uploader);
        const scraper = new MLScraper(parser);
        const adManager = new AdvertisementManager(config.database);
        
        const adService = new AdvertisementService(
            scraper,
            parser,
            uploader,
            adManager
        );
        console.log('Serviços iniciados com sucesso.');

        console.log('Iniciando busca...');
        // Executar a busca
        await adService.searchAndSaveAdvertisements({
            keyword: 'Máscara Nutricurls Wella 150g',
            idBrand: '8eb1907c-0da7-4a37-8406-4f5066b77690',
            brandProducts: [{
                id_product: 'd67caf98-f6a6-456c-b3b2-0237d177a386',
                st_varity_seq: '1',
                st_varity_name: '100ML'
            }]
        });
        console.log('Busca finalizada com sucesso.');

        return {
            statusCode: 200,
            body: JSON.stringify('Busca finalizada com sucesso.'),
        };
    } catch (error) {
        console.log('Erro na execução:', error);
        return {
            statusCode: 500,
            body: JSON.stringify(`Erro na execução: ${error}`),
        };
    }    
};
