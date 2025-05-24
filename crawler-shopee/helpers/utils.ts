import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const COOKIES_PATH = './cookies.json';

export async function autoScroll(page: Page, limit: number = 100000) {
    return await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300; // Pixels por scroll
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight || totalHeight >= limit) {
                    clearInterval(timer);
                    resolve(void 0);
                }
            }, 200); // tempo entre scrolls (ms)
        });
    });
}

export async function newPage(browser: Browser, main: boolean = false): Promise<Page | null> {
    let page: Page | null = null;
    try {
        const pages = await browser!.pages();
        if (main && pages.length > 0) {
            page = pages[0];
        } else {
            page = await browser!.newPage();
        }

        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', {
            brands: [
                { brand: 'Chromium', version: '136' },
                { brand: 'Google Chrome', version: '136' },
                { brand: 'Not-A.Brand', version: '99' }
            ],
            fullVersion: '136.0.7103.114',
            platform: 'Windows',
            platformVersion: '10.0.0',
            architecture: 'x64',
            model: '',
            mobile: false
        });

        // Carrega cookies se existirem
        if (existsSync(COOKIES_PATH)) {
            const cookies = JSON.parse(readFileSync(COOKIES_PATH, { encoding: 'utf8' }));
            await page.setCookie(...cookies);
            console.log('[+] Cookies carregados');
        }

        return page;
    } catch (error) {
        console.log('[-] Erro ao criar nova página');
        console.log(error);
        return null;
    }
}

export async function newBrowser(): Promise<Browser | null> {
    try {
        puppeteer.use(StealthPlugin());
        const browser = await puppeteer.launch({
            headless: false, // Set to true for production
            defaultViewport: { width: 0, height: 0 },
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: 'C:\\wks\\frg-monitor\\crawler-shopee\\persistent-profile',
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars'
            ],
        });
        console.log('[✓] Browser iniciado com sucesso');
        return browser;
    } catch (error) {
        console.log('[-] Erro ao iniciar browser');
        console.log(error);
        return null;
    }
}

// Função para aguardar um tempo aleatório entre min e max milissegundos
export async function sleep(min = 1500, max = 4000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Função para aguardar um tempo fixo em milissegundos
export async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function saveCookies(page: Page) {
    console.log('[✓] Salvando cookies atualizados...');
    const newCookies = await page.cookies();
    writeFileSync(COOKIES_PATH, JSON.stringify(newCookies, null, 2), { encoding: 'utf8' });
}