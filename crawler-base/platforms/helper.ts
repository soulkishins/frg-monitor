import { S3Uploader } from '../services/s3-uploader';
import { MLScraper, MLParser } from './ml';
import { Scraper } from '../services/scraper';
import { ShopeeScraper, ShopeeParser } from './shopee';
import { AmazonScraper, AmazonParser } from './amazon';
import { MagaluScraper, MagaluParser } from './magalu';

export function getPlatformScraper(platform: string, uploader: S3Uploader): Scraper {
    switch (platform.toLowerCase()) {
        case 'ml':
            return new MLScraper(new MLParser(uploader));
        case 'shopee':
            return new ShopeeScraper(new ShopeeParser(uploader));
        case 'amazon':
            return new AmazonScraper(new AmazonParser(uploader));
        case 'magalu':
            return new MagaluScraper(new MagaluParser(uploader));
        default:
            throw new Error(`Platform ${platform} not supported`);
    }
}