export interface AWSConfig {
    region: string;
    bucketName: string;
}

export interface DatabaseConfig {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    schema: string;
}

export interface ExportMessage {
    key: string;
    ids: string[];
    user: string;
}
