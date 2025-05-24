import { MLParser } from '../../services/ml-parser';
import { S3Uploader } from '../../services/s3-uploader';
import { PreloadedState } from '../../base/types';
import { describe, it, jest, expect, beforeEach } from '@jest/globals';
import { mockedAxios } from '../../utils/mockedAxios';

describe('MLParser', () => {
    let parser: MLParser;
    let mockUploader: jest.Mocked<S3Uploader>;

    beforeEach(() => {
        mockUploader = {
            uploadImage: jest.fn()
        } as any;

        parser = new MLParser(mockUploader);
    });

    describe('extractAdvertisementInfo', () => {
        it('deve extrair informações básicas do anúncio corretamente', () => {
            const mockState: PreloadedState = {
                response: '',
                initialState: {
                    id: 'MLB123',
                    components: {
                        description: {
                            content: 'Descrição do produto'
                        },
                        short_description: [{
                            type: 'header',
                            title: 'Título do Produto',
                            subtitle: 'Novo | 10 vendidos'
                        }, {
                            type: 'price',
                            price: {
                                value: 100,
                                original_value: 120
                            }
                        }]
                    }
                }
            };

            const result = MLParser.extractAdvertisementInfo(mockState);

            expect(result).toEqual({
                id: 'MLB123',
                title: 'Título do Produto',
                description: 'Descrição do produto',
                price: 100,
                original_price: 120,
                new: true,
                sold: 10
            });
        });
    });

    describe('extractAdvertisementDetails', () => {
        it('deve extrair detalhes completos do anúncio', async () => {
            const mockUrl = {
                title: 'Produto Teste',
                price: 'R$ 100,00',
                link: 'http://test.com/MLB-123456'
            };

            const mockState = {
                response: '',
                initialState: {
                    id: 'MLB123456',
                    components: {
                        description: {
                            content: 'Descrição detalhada'
                        },
                        short_description: [{
                            type: 'header',
                            title: 'Produto Teste',
                            subtitle: 'Usado | 5 vendidos'
                        }, {
                            type: 'price',
                            price: {
                                value: 100,
                                original_value: 150
                            }
                        }],
                        pictures: [{
                            url: 'http://test.com/image1.jpg'
                        }]
                    },
                    seller: {
                        id: 123,
                        nickname: 'Vendedor Teste'
                    }
                }
            };

            mockUploader.uploadImage.mockResolvedValueOnce('image1.jpg');

            const result = await parser.extractAdvertisementDetails(mockUrl);

            expect(result).toEqual({
                id_advertisement: expect.any(String),
                id_brand: '',
                st_plataform: 'MERCADOLIVRE',
                st_plataform_id: 'MLB123456',
                st_url: 'http://test.com/MLB-123456',
                st_title: 'Produto Teste',
                st_description: 'Descrição detalhada',
                st_photos: 'image1.jpg',
                db_price: 100,
                st_vendor: 'Vendedor Teste',
                st_details: expect.any(String),
                st_status: 'NEW'
            });
        });

        it('deve lidar com erros na extração de detalhes', async () => {
            const mockUrl = {
                title: 'Produto Com Erro',
                price: 'R$ 200,00',
                link: 'http://test.com/MLB-789012'
            };

            mockedAxios.get.mockRejectedValueOnce(new Error('Falha na requisição'));

            const result = await parser.extractAdvertisementDetails(mockUrl);

            expect(result).toEqual({
                id_advertisement: '',
                id_brand: '',
                st_plataform: 'MERCADOLIVRE',
                st_plataform_id: 'MLB-789012',
                st_url: mockUrl.link,
                st_title: mockUrl.title,
                st_description: expect.stringContaining('Erro ao extrair detalhes'),
                st_photos: 'N/A',
                db_price: 200,
                st_vendor: 'N/A',
                st_status: 'ERROR'
            });
        });
    });
}); 