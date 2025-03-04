import { S3 } from "@aws-sdk/client-s3";
import { UploadError } from "../errors";
import { AWSConfig } from "../base/types";

export class S3Uploader {
    private s3: S3;
    private bucketName: string;

    constructor(config: AWSConfig) {
        this.s3 = new S3({
            region: config.region
        });
        this.bucketName = config.bucketName;
    }

    async uploadFile(prefix: string, key: string, body: Buffer): Promise<void> {
        const params = {
            Bucket: this.bucketName,
            Key: `${prefix}/${key}`,
            Body: body
        };

        try {
            await this.s3.putObject(params);
        } catch (error) {
            throw new UploadError('Falha ao fazer upload do arquivo', error as Error);
        }
    }
} 