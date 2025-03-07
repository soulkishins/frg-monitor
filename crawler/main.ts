import { ConfigManager } from './base/config';
import { AdvertisementManager } from './aws/rds';
import { S3Uploader } from './services/s3-uploader';
import { MLParser } from './services/ml-parser';
import { MLScraper } from './services/ml-scraper';
import { AdvertisementService } from './services/advertisement-service';

export const handler = async (event: any) => {
    try {
        for (const record of event.Records) {
            console.log('Iniciando crawler...', JSON.stringify(event));
            // Extrair dados da mensagem SQS
            const messageBody = JSON.parse(record.body);

            console.log('Dados recebidos:', JSON.stringify(messageBody));
            
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
                adManager
            );
            console.log('Serviços iniciados com sucesso.');

            console.log('Iniciando busca...');
            // Executar a busca com os dados da mensagem SQS
            await adService.searchAndSaveAdvertisements(messageBody);
            console.log('Busca finalizada com sucesso.');
        }

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
