import { S3 } from "@aws-sdk/client-s3";
import axios from "axios";
import { UploadError } from "../errors";
import { AWSConfig } from "../base/config";

export class S3Uploader {
    private s3: S3;
    private bucketName: string;

    constructor(config: AWSConfig) {
        this.s3 = new S3({
            region: config.region
        });
        this.bucketName = config.bucketName;
    }

    public async uploadImage(params: {
        imageUrl: string;
        photoId: string;
        advertisementId: string;
        platform: string;
    }): Promise<string> {
        try {
            const response = await axios.get(params.imageUrl, { responseType: 'arraybuffer' });
            const extension = params.imageUrl.split('.').pop();
            const key = `anuncios/${params.platform}/${params.advertisementId}/${params.photoId}.${extension}`;

            await this.s3.putObject({
                Bucket: this.bucketName,
                Key: key,
                Body: response.data,
                ContentType: `image/${extension}`
            });

            return `${params.photoId}.${extension}`;
        } catch (error) {
            throw new UploadError('Falha ao fazer upload da imagem', error as Error);
        }
    }
} 