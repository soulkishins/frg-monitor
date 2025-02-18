import { ConfigManager } from './config';
import { AdvertisementManager } from './rds';
import { MercadoLivreScraper } from './mlextract';

async function main() {
    try {
        console.log('Iniciando crawler...');
        
        console.log('Carregando configurações...');
        // Carregar configurações do Secrets Manager
        const configManager = ConfigManager.getInstance();
        const config = await configManager.loadConfig();
        console.log('Configurações carregadas com sucesso.');

        console.log('Iniciando serviços...');
        // Inicializar serviços com as configurações
        const adManager = new AdvertisementManager(config.database);
        const mlScraper = new MercadoLivreScraper(config.aws);
        console.log('Serviços iniciados com sucesso.');

        console.log('Iniciando busca...');
        // Executar a busca
        await mlScraper.searchAndSaveAdvertisements(
            'Máscara Nutricurls Wella 150g',
            '8eb1907c-0da7-4a37-8406-4f5066b77690',
            [{
                id_product: 'd67caf98-f6a6-456c-b3b2-0237d177a386',
                st_varity_seq: '1',
                st_varity_name: '100ML'
            }],
            adManager
        );
        console.log('Busca finalizada com sucesso.');
    } catch (error) {
        console.log('Erro na execução:', error);
        throw error;
    }
}

main().catch(console.log);