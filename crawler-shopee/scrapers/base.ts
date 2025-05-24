import { Browser, Page } from "puppeteer";
import { delay, newPage } from "../helpers/utils";

export interface BaseScraper {
    openHomePage(page: Page): Promise<boolean>;
    search(page: Page, searchTerm: string): Promise<boolean>;
    listAds(page: Page): Promise<any[]>;
    nextPage(page: Page): Promise<boolean>;
    getAdDetails(page: Page, ad: any): Promise<boolean>;
    hasCaptcha(page: Page): Promise<boolean>;
    canWaitCaptcha(): boolean;
}

export class Scraper {

    constructor(private browser: Browser, private scraper: BaseScraper) {}

    async startScrapper(): Promise<boolean> {
        const page = await newPage(this.browser);
        if (!page) {
            return false;
        }

        if (!await this.openHomePage(page)) {
            console.log('[-] Error opening home page');
            return false;
        }

        if (await this.scraper.hasCaptcha(page)) {
            if (!this.scraper.canWaitCaptcha()) {
                return false;
            }
            return await this.openWaitCaptcha(page);
        }

        if (!await this.search(page, '')) {
            return false;
        }

        return true;
    }

    private async openHomePage(page: Page): Promise<boolean> {
        if (await this.scraper.openHomePage(page)) {
            return true;
        }

        if (!await this.checkCaptcha(page)) {
            return false;
        }

        return await this.scraper.openHomePage(page);
    }

    private async checkCaptcha(page: Page): Promise<boolean> {
        if (await this.scraper.hasCaptcha(page)) {
            if (this.scraper.canWaitCaptcha()) {
                return await this.waitCaptcha(page);
            }
            return await this.openWaitCaptcha(page);
        }
        return false;
    }

    private async waitCaptcha(page: Page, maxTime: number = -1): Promise<boolean> {
        try {
            let times = 0;
            do {
                times++;
                delay(10000)
            } while (
                await this.scraper.hasCaptcha(page)
                && (maxTime == -1 || times < maxTime)
            );
            return !await this.scraper.hasCaptcha(page);
        } catch (e) {
            console.log('[-] Error waiting for captcha');
            return false;
        }
    }

    private async openWaitCaptcha(page: Page): Promise<boolean> {
        const actualURL = page.url();

        await page.goto('https://monitoramento.frgconsultoria.com/tools/captcha-solver', { waitUntil: 'networkidle2' });

        // Wait for the continue button to be visible
        await page.waitForSelector('#continueButton', { visible: true });
        
        // Create a promise that resolves when the custom event is fired
        const continuePromise = new Promise<void>((resolve) => {
            page.evaluate(() => {
                window.addEventListener('captchaContinue', () => {
                    resolve();
                }, { once: true });
            });
        });

        // Wait for the event to be fired
        await continuePromise;

        // Return to the original URL
        await page.goto(actualURL, { waitUntil: 'networkidle2' });
        
        if (!await this.waitCaptcha(page, 6)) {
            return false;
        }

        return true;
    }

    private async search(page: Page, searchTerm: string): Promise<boolean> {
        if (!await this.scraper.search(page, searchTerm)) {
            console.log('[-] Error searching');
            return false;
        }
        return true;
    }

}