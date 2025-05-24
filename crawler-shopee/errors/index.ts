// Erros de paginação
export class PaginationError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Pagination Error: ${message}`);
        this.name = 'PaginationError';
    }
}

// Erros de scraping de dados
export class ScrapingError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Scraping Error: ${message}`);
        this.name = 'ScrapingError';
    }
}

// Erros de parsing de dados
export class ParsingError extends Error {
    public readonly html: string;

    constructor(message: string, html:string, public readonly originalError?: Error) {
        super(`Parsing Error: ${message}`);
        this.name = 'ParsingError';
        this.html = html;
    }
}

// Erros de upload de imagens
export class UploadError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Upload Error: ${message}`);
        this.name = 'UploadError';
    }
}

// Erros de serviço
export class ServiceError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Service Error: ${message}`);
        this.name = 'ServiceError';
    }
}

// Erros de conexão com o banco de dados
export class DatabaseConnectionError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Database Connection Error: ${message}`);
        this.name = 'DatabaseConnectionError';
    }
}