import { S3Uploader } from './s3-uploader';
import { ExportMessage } from '../base/types';
import { ReportManager } from './rds';
import { promises as fs } from 'fs';
import { parse } from 'json2csv';

export class CSVGenerator {
    private s3Uploader: S3Uploader;
    private reportManager: ReportManager;

    constructor(s3Uploader: S3Uploader, reportManager: ReportManager) {
        this.s3Uploader = s3Uploader;
        this.reportManager = reportManager;
    }

    async generateCSV(message: ExportMessage): Promise<void> {
        try {
            // Inserir registro na tabela de exportação com status PENDING
            await this.reportManager.insertAdvertisementExport(message.key, 'PENDING');

            if (message.ids.length == 0) {
                await this.reportManager.updateAdvertisementExport(message.key, 'NO_DATA');
                return;
            }

            if (message.ids[0] == 'ALL') {
                message.ids = [];
            }

            // Recuperar registros da tabela tb_advertisement
            const advertisements = await this.reportManager.listAdvertisements(message.ids);

            if (advertisements.length == 0) {
                await this.reportManager.updateAdvertisementExport(message.key, 'NO_DATA');
                return;
            }

            // Gerar CSV
            const csv = parse(advertisements, {fields: [{label: 'ID', value: 'id_advertisement'}, {label: 'Descrição', value: 'st_description'}]});
            const filePath = `/tmp/${message.key}`;
            await fs.writeFile(filePath, csv);

            // Fazer upload para o S3
            await this.s3Uploader.uploadFile('anuncios/REPORTS', message.key, Buffer.from(csv));

            // Atualizar status dos registros
            if (message.ids.length == 0) {
                const ids = advertisements.map(ad => ad.id_advertisement);
                await this.reportManager.updateAdvertisement(ids, 'REPORTED');
                await this.reportManager.insertHistoryReport(advertisements, message.user);
            } else {
                await this.reportManager.insertHistoryManual(advertisements, message.user);
            }

            // Atualizar registro na tabela de exportação para COMPLETED
            await this.reportManager.updateAdvertisementExport(message.key, 'COMPLETED');
        } catch (error) {
            console.error('Erro ao gerar CSV:', error);
            // Atualizar registro na tabela de exportação para FAILED
            await this.reportManager.updateAdvertisementExport(message.key, 'ERROR');
            throw error;
        }
    }
} 