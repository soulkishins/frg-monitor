import { ConfigManager } from './base/config';
import { AdvertisementManager } from './aws/rds';
import { S3Uploader } from './services/s3-uploader';
import { AdvertisementService } from './services/advertisement-service';
import { SQSService } from './aws/sqs';
import { getPlatformScraper } from './platforms/helper';

export const handler = async (event: any) => {
    try {
        for (const record of event.Records) {
            console.log('Iniciando crawler...');

            console.log('Dados recebidos:', record.body);
            // Extrair dados da mensagem SQS
            const messageBody = JSON.parse(record.body);

            console.log('Carregando configurações...');
            // Carregar configurações do Secrets Manager
            const configManager = ConfigManager.getInstance();
            const config = await configManager.loadConfig();
            console.log('Configurações carregadas com sucesso.');

            console.log('Iniciando serviços...');
            // Inicializar serviços com as configurações
            const uploader = new S3Uploader(config.aws);
            const scraper = getPlatformScraper(messageBody.platform, uploader);
            const sqsService = new SQSService(config.aws.region, config.aws.queueUrl);
            const adManager = new AdvertisementManager(config.database);
            const adService = new AdvertisementService(
                scraper,
                adManager,
                sqsService
            );
            console.log('Serviços iniciados com sucesso.');

            console.log('Validando IP de Saída...');
            const ip = await scraper.validateIP();
            console.log('IP de Saída:', ip);

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
