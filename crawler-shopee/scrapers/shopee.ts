import { Browser, Page } from "puppeteer";
import { BaseScraper } from "./base";
import { saveCookies, delay } from "../helpers/utils";

export class ShopeeScraper implements BaseScraper {
    constructor(
        private browser: Browser,
        private mainPage: Page
    ) { }

    public async openHomePage(page: Page): Promise<boolean> {
        await page.goto('https://shopee.com.br', { waitUntil: 'networkidle2' });

        try {
            delay(1000);

            console.log("Check if user is logged in");
            if (await this.checkIfLoggedIn(page)) {
                console.log("User is logged in");
                return true;
            }

            console.log("Check if user is not logged in");
            if (await this.checkIfNotLoggedIn(page)) {
                const enterLink = await page.$('.shopee-top .navbar__links a.navbar__link--tappable:last-child');
                if (!enterLink) {
                    return false;
                }
                await enterLink.click();
                console.log("User is not logged in, clicking on enter link");
                delay(1500);
            }

            console.log("Check if user is on login page");
            if (await this.checkIfLoginPage(page)) {
                console.log("User is on login page, trying to login");
                if (!(await this.login(page))) {
                    return false;
                }
                delay(1500);
                await saveCookies(page);
            }

            return await this.checkIfLoggedIn(page);
        } catch (e) {
            console.log('Failed to open home page', e);
            return false;
        }
    }

    private async checkIfLoggedIn(page: Page): Promise<boolean> {
        const username = await page.evaluate(() => {
            return document.querySelector('div[class=navbar__username]')?.textContent;
        });
        return username !== null;
    }

    private async checkIfNotLoggedIn(page: Page): Promise<boolean> {
        const link = await page.evaluate(() => {
            return document.querySelector('.shopee-top .navbar__links a.navbar__link--tappable:last-child')?.textContent;
        });
        return link === 'Entre';
    }

    private async checkIfLoginPage(page: Page): Promise<boolean> {
        return await page.$('input[name="loginKey"]') !== null;
    }

    private async login(page: Page): Promise<boolean> {
        try {
            await page.type('input[name="loginKey"]', '11999069589');
            await page.type('input[name="password"]', '*gA6f!M,MByT?hV');
            await page.click('form > button');
            return true;
        } catch (e) {
            console.log('Login failed', e);
            return false;
        }
    }

    public async search(page: Page, searchTerm: string): Promise<boolean> {
        // shopee-search-item-result__item
        const input = await page.$('input[class=shopee-searchbar-input__input]');
        if (!input) {
            await delay(1000);
            return false;
        }

        await input.type(searchTerm, { delay: 100 });
        await input.press('Enter');
        return true;
    }

    public async listAds(page: Page): Promise<any[]> {
        const ads: any[] = [];
        const results = await page.$$('li.shopee-search-item-result__item');
        if (results == null || results.length == 0) {
            return ads;
        }
        console.log(`Found ${results.length} results`);

        let adsCount = 0;
        for (const result of results) {
            try {
                const title = await result.$eval('div.line-clamp-2', el => el.textContent);
                const price = await result.$eval('span.text-base\\/5', el => el.textContent);
                const link = await result.$eval('a', el => el.href);
                const ad = { st_plataform: 'SHOPEE', st_plataform_id: this.geShopeeLId(link!), st_url: link!, st_title: title!, db_price: this.getPrice(price!) };
                ads.push(ad);
                adsCount++;
                if (adsCount % 8 == 0) {
                    // rolar a página
                    await page.evaluate(() => {
                        window.scrollBy(0, 1000);
                    });
                    await delay(300);
                }
            } catch (e) {
                console.log('Error parsing result', e);
            }
        }

        return ads;
    }

    public async nextPage(page: Page): Promise<boolean> {
        console.log('Searching for pagination button');
        const nextButton = await page.$$('nav.shopee-page-controller > a');
        if (nextButton == null || nextButton.length == 0) {
            console.log('[-] No pagination button found');
            return false;
        }

        let clickNext = false;
        for (const button of nextButton) {
            if (clickNext) {
                console.log('[✓ Clicking next button');
                await button.click();
                await delay(1000);
                // rolar a página
                await page.evaluate(() => {
                    window.scrollTo(0, 0);
                });
                await delay(200);
                clickNext = false;
                return true;
            }

            if (await button.evaluate(el => el.classList.contains('shopee-button-solid'))) {
                console.log('[✓] Actual page button found');
                clickNext = true;
                continue;
            }
        }

        // Chegou na última página
        if (clickNext) {
            console.log('[-] In the last page');
        }
        return false;
    }

    public async getAdDetails(page: Page, ad: any): Promise<boolean> {
        try {
            const descriptionHTML = await page.$$('div.product-detail section.I_DV_3 p.QN2lPu');
            let description = '';
            for (const p of descriptionHTML) {
                const text = await p.evaluate(el => el.textContent);
                if (text && text.trim() != '') {
                    description += text + '\n';
                }
            }
            ad.st_description = description;

            // wait for photos
            await page.waitForSelector('div.product-detail section.I_DV_3 img', { timeout: 3000 });

            const imageUrls = await page.$$eval('img.uXN1L5.lazyload.raRnQV', imgs =>
                imgs.map(img => img.src)
            );

            ad.st_photos = imageUrls.join(',');

            // wait for vendor
            const vendor = await page.$eval('section.page-product__shop div.fV3TIn', el => el.textContent);
            if (vendor) {
                ad.st_vendor = vendor;
            }
        } catch (e) {
            console.log('[-] Error getting ad details', e);
            return false;
        }
        return true;
    }

    public async hasCaptcha(page: Page) {
        const captcha = await page.$('div[class="shopee-captcha-container"]');
        return captcha !== null;
    }

    public canWaitCaptcha(): boolean {
        return false;
    }

    private getPrice(price: string): number {
        return Number(price.replace('R$', '').replace('.', '').replace(',', '.'));
    }

    private geShopeeLId(url: string): string {
        //https://shopee.com.br/Kit-Haskell-Murumuru-Shampoo-500ml-Condicionador-500ml-e-M%C3%A1scara-Manteiga-Nutritiva-500gr-i.826683144.23791139088?sp_atk=2d018089-1b0f-46a7-8dd5-71532e0debce&xptdk=2d018089-1b0f-46a7-8dd5-71532e0debce
        return url.match(/i\.(\d+)\.(\d+)/)?.[0].replace('i.', 'S') || '';
    }

}