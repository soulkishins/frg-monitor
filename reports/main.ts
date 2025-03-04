import { ConfigManager } from './base/config';
import { CSVGenerator } from './services/csv-generator';
import { ReportManager } from './services/rds';
import { S3Uploader } from './services/s3-uploader';

export const handler = async (event: any) => {
    try {
        for (const record of event.Records) {
            // Extrair dados da mensagem SQS
            console.log('Iniciando gerador de relatório...', JSON.stringify(event));
            const messageBody = JSON.parse(record.body);
            console.log('Dados recebidos:', JSON.stringify(messageBody));

            // Carregar configurações do Secrets Manager
            console.log('Carregando configurações...');
            const configManager = ConfigManager.getInstance();
            const config = await configManager.loadConfig();
            console.log('Configurações carregadas com sucesso.');

            // Inicializar serviços com as configurações
            console.log('Iniciando serviços...');
            const uploader = new S3Uploader(config.aws);
            const reportManager = new ReportManager(config.database);
            const csvGenerator = new CSVGenerator(uploader, reportManager);
            console.log('Serviços iniciados com sucesso.');

            // Executar a geração do relatório
            console.log('Iniciando geração do relatório...');
            await csvGenerator.generateCSV(messageBody);
            console.log('Relatório gerado com sucesso.');

            await reportManager.close();
            console.log('Serviços encerrados com sucesso.');
        }

        return {
            statusCode: 200,
            body: JSON.stringify('Relatório gerado com sucesso.'),
        };
    } catch (error) {
        console.log('Erro na execução:', error);
        return {
            statusCode: 500,
            body: JSON.stringify(`Erro na execução: ${error}`),
        };
    }    
};
