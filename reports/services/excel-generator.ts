import { S3Uploader } from './s3-uploader';
import { ExportMessage } from '../base/types';
import { ReportManager } from './rds';
import { promises as fs } from 'fs';
import * as XLSX from 'xlsx';

export class ExcelGenerator {
    private s3Uploader: S3Uploader;
    private reportManager: ReportManager;

    constructor(s3Uploader: S3Uploader, reportManager: ReportManager) {
        this.s3Uploader = s3Uploader;
        this.reportManager = reportManager;
    }

    async generateExcel(message: ExportMessage): Promise<void> {
        try {
            await this.reportManager.insertAdvertisementExport(message.key, 'PENDING');

            if (message.ids.length == 0) {
                await this.reportManager.updateAdvertisementExport(message.key, 'NO_DATA');
                return;
            }

            if (message.ids[0] == 'ALL') {
                message.ids = [];
            }

            const advertisements = await this.reportManager.listAdvertisements(message.ids);

            if (advertisements.length == 0) {
                await this.reportManager.updateAdvertisementExport(message.key, 'NO_DATA');
                return;
            }

            console.log(`Localizado ${advertisements.length} registros de anúncio.`);

            // Preparar dados dos advertisements
            const data = advertisements.map(ad => [
                ad.st_vendor,
                ad.st_url,
                ad.st_title,
                this.formatPrice(ad.db_price),
                this.formatPrice(0),
                this.formatPrice(0),
                this.formatPercentage(0),
                ad.dt_modified ? ad.dt_modified : ad.dt_created
            ]);

            console.log('Incluindo dados na worksheet:', data);

            // Atualizar a planilha mantendo o cabeçalho e adicionando novos dados
            const newWorksheet = XLSX.utils.aoa_to_sheet([
                ['Seller', 'Url', 'Nome do Anúncio', 'Preço', 'Preço Sugerido', 'Abaixo do Preço (em real)', 'Abaixo do Preço (em %)', 'Data'],
                ...data
            ]);

            // Criar novo workbook com a worksheet atualizada
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Anúncios");

            // Salvar arquivo temporariamente
            const filePath = `/tmp/${message.key}`;
            console.log('Salvando arquivo temporariamente:', filePath);

            XLSX.writeFile(newWorkbook, filePath);

            // Ler o arquivo para fazer upload no S3
            console.log('Lendo arquivo para fazer upload no S3:', filePath);
            const fileBuffer = await fs.readFile(filePath);

            // Fazer upload para o S3
            console.log('Fazendo upload para o S3:', filePath);
            await this.s3Uploader.uploadFile('anuncios/REPORTS', `${message.key}`, fileBuffer);

            // Atualizar status dos registros
            if (message.ids.length == 0) {
                const ids = advertisements.map(ad => ad.id_advertisement);
                await this.reportManager.updateAdvertisement(ids, 'REPORTED');
                await this.reportManager.insertHistoryReport(advertisements, message.user);
            } else {
                await this.reportManager.insertHistoryManual(advertisements, message.user);
            }

            // Atualizar registro na tabela de exportação
            await this.reportManager.updateAdvertisementExport(message.key, 'COMPLETED');

            // Limpar arquivo temporário
            //await fs.unlink(filePath);
        } catch (error) {
            console.error('Erro ao gerar planilha:', error);
            await this.reportManager.updateAdvertisementExport(message.key, 'ERROR');
            throw error;
        }
    }

    private formatPrice(price: any): string {
        if (price == null) {
            return 'R$ 0,00';
        } else if (typeof price === 'number') {
            price = price;
        } else if (price instanceof Number) {
            price = price.valueOf();
        } else if (price instanceof String || typeof price === 'string') {
            price = parseFloat(price as string);
        } else {
            throw new Error('Preço inválido: ' + price + ' (' + typeof price + ')');
        }

        return 'R$ ' + price.toFixed(2).replace(',', 'X').replace('.', ',').replace('X', '.');
    }

    private formatPercentage(percentage: number): string {
        return percentage.toFixed(2).replace(',', 'X').replace('.', ',').replace('X', '.') + '%';
    }

    private formatDate(date: any): string {
        if (date == null) {
            return '';
        }

        if (date instanceof Date) {
            return date.toLocaleDateString('pt-BR');
        }

        if (date instanceof String || typeof date === 'string') {
            return new Date(date as string).toLocaleDateString('pt-BR');
        }

        return "Data inválida: " + date + ' (' + typeof date + ')';
    }
} 