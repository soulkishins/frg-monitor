import { S3Uploader } from './s3-uploader';
import { ExportMessage } from '../base/types';
import { ReportManager } from './rds';
import { promises as fs } from 'fs';
import * as XLSX from 'xlsx';

export class ExcelGenerator {
    private s3Uploader: S3Uploader;
    private reportManager: ReportManager;
    private idBrand: string = '';
    private products: any[] = [];

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

            let offset = 0;
            const limit = 10;

            var advertisements = await this.reportManager.listAdvertisements(message.ids, offset, limit);
            if (advertisements.length == 0) {
                await this.reportManager.updateAdvertisementExport(message.key, 'NO_DATA');
                return;
            }

            var newWorksheet = XLSX.utils.aoa_to_sheet([
                ['Seller', 'Url', 'Nome do Anúncio', 'Preço', 'Preço Sugerido', 'Abaixo do Preço (em real)', 'Abaixo do Preço (em %)', 'Data'],
            ]);

            let advertisementsID = [];

            while (advertisements.length > 0) {

                console.log(`Localizado ${advertisements.length} registros de anúncio.`);

                // Preparar dados dos advertisements
                const data = [];
                for (const ad of advertisements) {
                    const suggestedPrice = await this.getSuggestedPrice(ad.id_brand, ad.products);
                    let belowPrice = 0;
                    let belowPercentage = 0;
                    if (suggestedPrice > ad.db_price) {
                        belowPrice = suggestedPrice - ad.db_price;
                        belowPercentage = (suggestedPrice - ad.db_price) / suggestedPrice * 100;
                    }
                    data.push([
                        ad.st_vendor,
                        ad.st_url,
                        ad.st_title,
                        this.formatPrice(ad.db_price),
                        this.formatPrice(suggestedPrice),
                        this.formatPrice(belowPrice),
                        this.formatPercentage(belowPercentage),
                        ad.dt_modified ? ad.dt_modified : ad.dt_created
                    ]);
                }

                console.log('Incluindo dados na worksheet:', data);

                // Atualizar a planilha mantendo o cabeçalho e adicionando novos dados
                newWorksheet = XLSX.utils.sheet_add_aoa(newWorksheet, [...data], { origin: 'A' + (offset + 2) });

                advertisementsID.push(...advertisements.map(ad => ({ id_advertisement: ad.id_advertisement, st_status: ad.st_status })));
                offset += limit;
                if (message.ids.length > 0) {
                    break;
                }
                advertisements = await this.reportManager.listAdvertisements(message.ids, offset, limit);
            }

            // Criar novo workbook com a worksheet atualizada
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet!, "Anúncios");

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
                const ids = advertisementsID.map(ad => ad.id_advertisement);
                await this.reportManager.updateAdvertisement(ids, 'REPORTED');
                await this.reportManager.insertHistoryReport(advertisementsID, message.user);
            } else {
                await this.reportManager.insertHistoryManual(advertisementsID, message.user);
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

    private async getSuggestedPrice(idBrand: string, products: string): Promise<number> {
        if (this.idBrand != idBrand) {
            console.log('Buscando produtos da marca:', idBrand);
            this.idBrand = idBrand;
            const products = await this.reportManager.listProductsByBrand(this.idBrand);
            this.products = products.map(p => ({
                id_product: p.id_product,
                st_variety: p.st_variety ? JSON.parse(p.st_variety) : []
            }));
        }

        if (products == null) {
            return 0;
        }

        const productsArray = products.split('!');
        let price = 0;
        for (const productData of productsArray) {
            const productArray = productData.split('|');
            const product = this.products.find(p => p.id_product == productArray[0]);
            if (!product) {
                console.log('Produto não encontrado:', productArray[0]);
                continue;
            }
            const variety = product.st_variety.find((v: any) => v.seq == productArray[1]);
            if (variety == null) {
                console.log('Variedade não encontrada:', productArray[0], productArray[1]);
                continue;
            }
            price += variety.price * Number(productArray[2]);
        }
        return price;
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