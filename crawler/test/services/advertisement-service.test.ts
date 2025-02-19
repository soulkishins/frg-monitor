import { AdvertisementService } from '../../services/advertisement-service';
import { MLScraper } from '../../services/ml-scraper';
import { MLParser } from '../../services/ml-parser';
import { S3Uploader } from '../../services/s3-uploader';
import { AdvertisementManager } from '../../aws/rds';
import { describe, it, jest, expect, beforeEach } from '@jest/globals';

describe('AdvertisementService', () => {
    let service: AdvertisementService;
    let mockScraper: jest.Mocked<MLScraper>;
    let mockParser: jest.Mocked<MLParser>;
    let mockUploader: jest.Mocked<S3Uploader>;
    let mockAdManager: jest.Mocked<AdvertisementManager>;

    beforeEach(() => {
        mockScraper = {
            searchAdvertisements: jest.fn(),
            readAdvertisements: jest.fn(),
            nextPage: jest.fn()
        } as any;

        mockParser = {
            extractAdvertisementDetails: jest.fn()
        } as any;

        mockUploader = {
            uploadImage: jest.fn()
        } as any;

        mockAdManager = {
            createAdvertisement: jest.fn(),
            addProduct: jest.fn(),
            addHistory: jest.fn(),
            getAdvertisementByPlataform: jest.fn(),
            updateAdvertisement: jest.fn()
        } as any;

        service = new AdvertisementService(
            mockScraper,
            mockParser,
            mockUploader,
            mockAdManager
        );
    });

    describe('searchAndSaveAdvertisements', () => {
        it('deve processar e salvar anúncios corretamente', async () => {
            const mockParams = {
                keyword: 'teste',
                idBrand: 'brand1',
                brandProducts: []
            };

            mockScraper.searchAdvertisements.mockResolvedValueOnce({
                advertisements: [{
                    title: 'Produto Teste',
                    price: 'R$ 100',
                    link: 'http://test.com'
                }],
                pages: []
            });

            mockScraper.readAdvertisements.mockResolvedValueOnce([{
                id_advertisement: '',
                id_brand: '',
                st_plataform: 'MERCADOLIVRE',
                st_plataform_id: 'MLB123',
                st_url: 'http://test.com',
                st_title: 'Produto Teste',
                st_status: 'NEW'
            }]);

            mockScraper.nextPage.mockResolvedValueOnce({
                advertisements: [],
                pages: []
            });

            await service.searchAndSaveAdvertisements(mockParams);

            expect(mockScraper.searchAdvertisements).toHaveBeenCalledWith('teste');
            expect(mockScraper.readAdvertisements).toHaveBeenCalled();
            expect(mockAdManager.getAdvertisementByPlataform).toHaveBeenCalled();
        });
    });
});