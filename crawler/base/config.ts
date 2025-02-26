import { SecretsManager } from '@aws-sdk/client-secrets-manager';

interface DatabaseConfig {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    schema: string;
}

interface AWSConfig {
    region: string;
    bucketName: string;
}

interface AppConfig {
    database: DatabaseConfig;
    aws: AWSConfig;
}

export class ConfigManager {
    private static instance: ConfigManager;
    private config: AppConfig | null = null;
    private secretsManager: SecretsManager;

    private constructor() {
        this.secretsManager = new SecretsManager({
            region: process.env.AWS_REGION || 'sa-east-1'
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
            const dbSecret = await this.fetchSecret(process.env.RDS_SECRET_NAME || 'matrix/db/local');

            this.config = {
                database: {
                    user: dbSecret.username,
                    host: dbSecret.host,
                    database: dbSecret.dbname,
                    password: dbSecret.password,
                    port: parseInt(dbSecret.port || '5432'),
                    schema: dbSecret.schema || 'invoices'
                },
                aws: {
                    region: process.env.AWS_REGION || 'sa-east-1',
                    bucketName: process.env.S3_BUCKET_NAME || 'matrix-notas'
                }
            };

            return this.config;
        } catch (error) {
            console.log('Erro ao carregar configurações:', error);
            throw error;
        }
    }
} 