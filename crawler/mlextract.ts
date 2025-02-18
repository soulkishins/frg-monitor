import axios from 'axios';
import { S3 } from '@aws-sdk/client-s3';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { MLJsonExtractor } from './mlparser';
import { AdvertisementManager } from './rds';

interface IMLAdvertisement {
    id_advertisement: string;
    id_brand: string;
    st_plataform: string;
    st_plataform_id: string;
    st_url: string;
    st_title?: string;
    st_description?: string;
    st_photos?: string;
    db_price?: number;
    st_vendor?: string;
    st_details?: string;
    st_status: string;
}

interface IMLPage {
    advertisements: IMLAdvertisementUrl[];
    pages: { current: string, link: string }[];
}
interface AWSConfig {
    region: string;
    bucketName: string;
}

interface IMLAdvertisementUrl {
    title: string;
    price: string;
    link: string;
}

interface IClientBrandProduct {
    id_product?: string;
    st_varity_seq?: string;
    st_varity_name?: string;
}

export class MercadoLivreScraper {
    private s3: S3;
    private bucketName: string;

    constructor(config: AWSConfig) {
        this.s3 = new S3({
            region: config.region
        });
        this.bucketName = config.bucketName;
    }

    private async uploadToS3(imageUrl: string, photoId: string, plataform: string): Promise<string> {
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const extension = imageUrl.split('.').pop();
            const key = `anuncios/${plataform}/${photoId}.${extension}`;

            const result = await this.s3.putObject({
                Bucket: this.bucketName,
                Key: key,
                Body: response.data,
                ContentType: `image/${extension}`
            });

            return `${photoId}.${extension}`;
        } catch (error) {
            console.log(`Erro ao fazer upload da imagem: ${error}`);
            throw error;
        }
    }

    private async extractAdvertisementDetails(url: IMLAdvertisementUrl): Promise<IMLAdvertisement> {
        const st_plataform = 'MERCADOLIVRE'

        try {
            // Remover o hash da URL
            url.link = url.link.substring(0, url.link.indexOf('#'));

            // Extrair PreloadedState
            const mlLoadData = await MLJsonExtractor.extractFromUrl(url.link);
            if (!mlLoadData) {
                throw new Error('Não foi possível extrair os dados do produto');
            }

            const advertisementInfo = MLJsonExtractor.extractAdvertisementInfo(mlLoadData);

            // Upload das fotos para S3
            const s3Photos = await Promise.all(
                advertisementInfo.photos?.map(photoUrl => this.uploadToS3(photoUrl.url, photoUrl.id, st_plataform)) || []
            );

            return {
                id_advertisement: '', // Será preenchido posteriormente
                id_brand: '', // Será preenchido posteriormente
                st_plataform: st_plataform,
                st_plataform_id: advertisementInfo.id,
                st_url: url.link,
                st_title: advertisementInfo.title,
                st_description: advertisementInfo.description,
                st_photos: s3Photos.join(','),
                db_price: advertisementInfo.price,
                st_vendor: advertisementInfo.seller?.name,
                st_details: JSON.stringify({
                    seller:advertisementInfo.seller,
                    details: {
                        originalPrice: advertisementInfo.original_price,
                        sold: advertisementInfo.sold,
                        stock: advertisementInfo.stock,
                        new: advertisementInfo.new,
                        relatedSearches: advertisementInfo.relatedSearches
                    }
                }),
                st_status: 'NEW'
            };
        } catch (error) {
            console.log(`Erro ao extrair detalhes do anúncio: ${error}`);
            return {
                id_advertisement: '', // Será preenchido posteriormente
                id_brand: '', // Será preenchido posteriormente
                st_plataform: st_plataform,
                st_plataform_id: url.link.match(/MLB-\d+/)?.[0] || 'N/A',
                st_url: url.link,
                st_title: url.title,
                st_description: `Erro ao extrair detalhes do anúncio: ${error}`,
                st_photos: '',
                db_price: Number(url.price),
                st_vendor: 'N/A',
                st_status: 'NEW_ERROR'
            };
        }
    }

    public async searchAdvertisements(keyword: string): Promise<IMLPage> {
        try {
            const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(keyword)}`;
            const response = await axios.get(searchUrl);
            const $ = cheerio.load(response.data);
            
            const advertisementUrls: IMLAdvertisementUrl[] = [];
            $('.ui-search-result__wrapper').each((i, elem) => {
                const title = $(elem).find('.poly-component__title').text().trim();
                const price = $(elem).find('.poly-component__price').text().trim();
                const link = $(elem).find('.poly-component__title').attr('href') || '';
                advertisementUrls.push({ title, price, link });
            });

            const pages: { current: string, link: string }[] = [];
            $('.andes-pagination__button a').each((i, elem) => {
                const link = $(elem).attr('href') || '';
                const current = $(elem).attr('aria-current') || '';
                pages.push({ current, link });
            });

            return { advertisements: advertisementUrls, pages };
        } catch (error) {
            console.log(`Erro na busca de produtos: ${error}`);
            throw error;
        }
    }

    public async nextPage(page: IMLPage): Promise<IMLPage> {
        try {
            const currentPage = page.pages.findIndex(p => p.current === 'page');
            if (currentPage === page.pages.length - 1) {
                return { advertisements: [], pages: [] };
            }

            const searchUrl = page.pages[currentPage + 1].link;
            if (!searchUrl) {
                return { advertisements: [], pages: [] };
            }

            console.log(`Procurando na página: ${searchUrl}`);

            const response = await axios.get(searchUrl);
            const $ = cheerio.load(response.data);
            
            const advertisementUrls: IMLAdvertisementUrl[] = [];
            $('.ui-search-result__wrapper').each((i, elem) => {
                const title = $(elem).find('.poly-component__title').text().trim();
                const price = $(elem).find('.poly-component__price').text().trim();
                const link = $(elem).find('.poly-component__title').attr('href') || '';
                advertisementUrls.push({ title, price, link });
            });

            const pages: { current: string, link: string }[] = [];
            $('.andes-pagination__button a').each((i, elem) => {
                const link = $(elem).attr('href') || '';
                const current = $(elem).attr('aria-current') || '';
                pages.push({ current, link });
            });

            return { advertisements: advertisementUrls, pages };
        } catch (error) {
            console.log(`Erro na busca de produtos: ${error}`);
            throw error;
        }
    }

    public async readAdvertisements(page: IMLPage): Promise<IMLAdvertisement[]> {
        try {
            const advertisements = await Promise.all(
                page.advertisements.map(async url => await this.extractAdvertisementDetails(url))
            );
            return advertisements;
        } catch (error) {
            console.log(`Erro na busca de produtos: ${error}`);
            throw error;
        }
    }

    public async searchAndSaveAdvertisements(
        keyword: string, 
        idBrand: string,
        brandProducts: IClientBrandProduct[],
        adManager: AdvertisementManager // Tipo do AdvertisementManager
    ): Promise<void> {
        try {
            var page = await this.searchAdvertisements(keyword);
            while (page.advertisements.length > 0) {
                const advertisements = await this.readAdvertisements(page);

                for (const advertisement of advertisements) {
                    var advertisementData = await adManager.getAdvertisementByPlataform(advertisement.st_plataform, advertisement.st_plataform_id, advertisement.st_url);
                    
                    advertisement.id_advertisement = advertisementData?.id_advertisement || uuidv4();
                    advertisement.id_brand = idBrand;
                    if (advertisementData) {
                        // Atualizar anúncio no banco de dados
                        await adManager.updateAdvertisement(advertisementData, advertisement);

                        // Adicionar registro no histórico
                        await adManager.addHistory({
                            id_advertisement: advertisementData?.id_advertisement,
                            dt_history: new Date(),
                            st_status: 'NEW',
                            st_action: 'CAPTURED',
                            st_history: JSON.stringify(advertisement)
                        });

                        continue;
                    }

                    // Criar anúncio no banco de dados
                    const adId = await adManager.createAdvertisement(advertisement);

                    // Adicionar registro na tabela de produtos
                    for (const brandProduct of brandProducts) {
                        await adManager.addProduct({
                            ...brandProduct,
                            id_advertisement: adId
                        });
                    }

                    // Adicionar registro no histórico
                    await adManager.addHistory({
                        id_advertisement: adId,
                        dt_history: new Date(),
                        st_status: 'NEW',
                        st_action: 'CAPTURED',
                        st_history: JSON.stringify(advertisement)
                    });
                }

                page = await this.nextPage(page);
            }
        } catch (error) {
            console.log(`Erro ao salvar produtos: ${error}`);
            throw error;
        }
    }
}
