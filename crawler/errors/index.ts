export class UploadError extends Error {
    constructor(message: string, public readonly originalError: Error) {
        super(`Upload Error: ${message}`);
        this.name = 'UploadError';
    }
}

export class ScrapingError extends Error {
    constructor(message: string, public readonly originalError: Error, public readonly type: 'P' | 'A') {
        super(`Scraping Error: ${message}`);
        this.name = 'ScrapingError';
    }
}

export class ParsingError extends Error {
    public readonly html: string;

    constructor(message: string, html:string, public readonly originalError?: Error) {
        super(`Parsing Error: ${message}`);
        this.name = 'ParsingError';
        this.html = html;
    }
}

export class ServiceError extends Error {
    constructor(message: string, public readonly originalError: Error) {
        super(`Service Error: ${message}`);
        this.name = 'ServiceError';
    }
} 