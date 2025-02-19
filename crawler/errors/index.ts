export class UploadError extends Error {
    constructor(message: string, public readonly originalError: Error) {
        super(`Upload Error: ${message}`);
        this.name = 'UploadError';
    }
}

export class ScrapingError extends Error {
    constructor(message: string, public readonly originalError: Error) {
        super(`Scraping Error: ${message}`);
        this.name = 'ScrapingError';
    }
}

export class ParsingError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Parsing Error: ${message}`);
        this.name = 'ParsingError';
    }
}

export class ServiceError extends Error {
    constructor(message: string, public readonly originalError: Error) {
        super(`Service Error: ${message}`);
        this.name = 'ServiceError';
    }
} 