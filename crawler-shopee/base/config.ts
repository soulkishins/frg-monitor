import { SecretsManager } from '@aws-sdk/client-secrets-manager';

export interface DatabaseConfig {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    schema: string;
}

export interface AWSConfig {
    region: string;
    bucketName: string;
    queueUrl: string;
}

export interface AppConfig {
    database: DatabaseConfig;
    aws: AWSConfig;
}

export class ConfigManager {
    private static instance: ConfigManager;
    private config: AppConfig | null = null;
    private secretsManager: SecretsManager;

    private constructor() {
        this.secretsManager = new SecretsManager({
            region: process.env.APP_REGION
        });
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    private async fetchSecret(secretName: string): Promise<any> {
        try {
            const data = await this.secretsManager.getSecretValue({ SecretId: secretName });
            if (data.SecretString) {
                return JSON.parse(data.SecretString);
            }
            throw new Error('Secret não encontrado');
        } catch (error) {
            console.log(`Erro ao buscar secret ${secretName}:`, error);
            throw error;
        }
    }

    public async loadConfig(): Promise<AppConfig> {
        if (this.config) {
            return this.config;
        }

        try {
            const dbSecretName = process.env.RDS_SECRET_NAME;
            if (!dbSecretName) {
                throw new Error('RDS_SECRET_NAME não encontrado');
            }
            const dbSecret = await this.fetchSecret(dbSecretName);

            this.config = {
                database: {
                    user: dbSecret.username,
                    host: dbSecret.host,
                    database: dbSecret.dbname,
                    password: dbSecret.password,
                    port: parseInt(dbSecret.port || '5432'),
                    schema: dbSecret.schema || process.env.DB_SCHEMA
                },
                aws: {
                    region: process.env.APP_REGION as string,
                    bucketName: process.env.S3_BUCKET_NAME as string,
                    queueUrl: process.env.SQS_QUEUE_URL as string
                }
            };

            return this.config;
        } catch (error) {
            console.log('Erro ao carregar configurações:', error);
            throw error;
        }
    }
} 