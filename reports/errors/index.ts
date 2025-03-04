export class UploadError extends Error {
    constructor(message: string, public readonly originalError: Error) {
        super(`Upload Error: ${message}`);
        this.name = 'UploadError';
    }
}
