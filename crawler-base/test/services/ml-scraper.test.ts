import { MLScraper } from '../../services/ml-scraper';
import { MLParser } from '../../services/ml-parser';
import axios from 'axios';
import { describe, it, jest, expect, beforeEach } from '@jest/globals';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MLScraper', () => {
    let scraper: MLScraper;
    let mockParser: jest.Mocked<MLParser>;

    beforeEach(() => {
        mockParser = {
            extractAdvertisementDetails: jest.fn()
        } as any;

        scraper = new MLScraper(mockParser);
    });

    describe('searchAdvertisements', () => {
        it('deve buscar anúncios corretamente', async () => {
            const mockHtml = `
                <div class="ui-search-result__wrapper">
                    <a class="poly-component__title" href="http://test.com">Produto Teste</a>
                    <span class="poly-component__price">R$ 100</span>
                </div>
            `;

            mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

            const result = await scraper.searchAdvertisements('teste');

            expect(result.advertisements).toHaveLength(1);
            expect(result.advertisements[0]).toEqual({
                title: 'Produto Teste',
                price: 'R$ 100',
                link: 'http://test.com'
            });
        });
    });

    describe('readAdvertisements', () => {
        it('deve ler detalhes de múltiplos anúncios', async () => {
            const mockPage = {
                advertisements: [
                    { title: 'Produto 1', price: 'R$ 100', link: 'http://test1.com' },
                    { title: 'Produto 2', price: 'R$ 200', link: 'http://test2.com' }
                ],
                pages: []
            };

            mockParser.extractAdvertisementDetails
                .mockResolvedValueOnce({
                    id_advertisement: 'ad123',
                    id_brand: '',
                    st_plataform: 'MERCADOLIVRE',
                    st_plataform_id: 'MLB123',
                    st_url: 'http://test1.com',
                    st_title: 'Produto 1',
                    st_description: 'Descrição 1',
                    st_photos: 'photo1.jpg',
                    db_price: 100,
                    st_vendor: 'Vendedor 1',
                    st_status: 'NEW'
                })
                .mockResolvedValueOnce({
                    id_advertisement: 'ad456',
                    id_brand: '',
                    st_plataform: 'MERCADOLIVRE',
                    st_plataform_id: 'MLB456',
                    st_url: 'http://test2.com',
                    st_title: 'Produto 2',
                    st_description: 'Descrição 2',
                    st_photos: 'photo2.jpg',
                    db_price: 200,
                    st_vendor: 'Vendedor 2',
                    st_status: 'NEW'
                });

            const result = await scraper.readAdvertisements(mockPage);

            expect(result).toHaveLength(2);
            expect(result[0].id_advertisement).toBe('ad123');
            expect(result[1].id_advertisement).toBe('ad456');
        });

        it('deve lidar com erros na leitura de anúncios', async () => {
            const mockPage = {
                advertisements: [
                    { title: 'Produto Erro', price: 'R$ 300', link: 'http://test.com' }
                ],
                pages: []
            };

            mockParser.extractAdvertisementDetails.mockRejectedValueOnce(
                new Error('Erro ao extrair detalhes')
            );

            const result = await scraper.readAdvertisements(mockPage);

            expect(result).toHaveLength(0);
        });
    });

    describe('nextPage', () => {
        it('deve navegar para a próxima página de resultados', async () => {
            const currentPage = {
                advertisements: [],
                pages: [{ url: 'http://next-page.com' }]
            };

            const mockHtml = `
                <div class="ui-search-result__wrapper">
                    <a href="http://test3.com">Produto 3</a>
                    <span>R$ 300</span>
                </div>
                <a class="andes-pagination__link" href="http://next-next-page.com">Próxima</a>
            `;

            mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

            const result = await scraper.nextPage(currentPage);

            expect(result.advertisements).toHaveLength(1);
            expect(result.pages[0].link).toBe('http://next-next-page.com');
        });
    });
}); 