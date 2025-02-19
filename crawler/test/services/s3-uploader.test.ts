import { S3Uploader } from '../../services/s3-uploader';
import { S3 } from '@aws-sdk/client-s3';
import axios from 'axios';
import { describe, it, jest, expect, beforeEach } from '@jest/globals';

jest.mock('@aws-sdk/client-s3');
jest.mock('axios');

describe('S3Uploader', () => {
    let uploader: S3Uploader;
    let mockS3: jest.Mocked<S3>;

    beforeEach(() => {
        mockS3 = {
            putObject: jest.fn()
        } as any;

        (S3 as jest.Mock).mockImplementation(() => mockS3);

        uploader = new S3Uploader({
            region: 'us-east-1',
            bucketName: 'test-bucket'
        });
    });

    describe('uploadImage', () => {
        it('deve fazer upload de imagem corretamente', async () => {
            const mockImageBuffer = Buffer.from('test-image');
            const mockedAxios = axios as jest.Mocked<typeof axios>;
            mockedAxios.get.mockResolvedValueOnce({
                data: mockImageBuffer,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any
            });

            mockS3.putObject.mockResolvedValueOnce({} as never);

            const result = await uploader.uploadImage({
                imageUrl: 'http://test.com/image.jpg',
                photoId: 'photo123',
                platform: 'MERCADOLIVRE'
            });

            expect(result).toBe('photo123.jpg');
            expect(mockS3.putObject).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'anuncios/MERCADOLIVRE/photo123.jpg',
                Body: mockImageBuffer,
                ContentType: 'image/jpg'
            });
        });
    });
}); 