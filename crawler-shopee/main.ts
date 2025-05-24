import { Browser, Page } from 'puppeteer';
import { ConfigManager } from './base/config';
import { AdvertisementManager } from './aws/rds';
import { SQSService } from './aws/sqs';
import { AdvertisementService } from './advertisement-service';
import { newBrowser, delay, saveCookies, newPage, autoScroll } from './helpers/utils';

interface ShopeeAd {
  st_plataform: string;
  st_plataform_id: string;
  st_url: string;
  st_title?: string;
  st_description?: string;
  st_photos?: string;
  db_price?: number;
  st_vendor?: string;
  st_details?: string;
}

const SHOPEE_URL = 'https://shopee.com.br';
let browser: Browser | null = null;

async function scrapeShopeeAds(searchTerm: string, numberOfPages: number = 1): Promise<ShopeeAd[]> {
  const ads: (ShopeeAd | null)[] = [];
  const adsDetails: ShopeeAd[] = [];

  const page: Page | null = await newPage(browser!);
  try {
    if (!page) {
      throw new Error('Page not found');
    }

    await page.goto(SHOPEE_URL, { waitUntil: 'networkidle2' });

    while (true) {
      try {
        console.log('Checking if login is complete...');
        if (await page.$('input[name="loginKey"]')) {
          try {
            await page.type('input[name="loginKey"]', '11999069589');
            await page.type('input[name="password"]', '*gA6f!M,MByT?hV');
            await page.click('form > button');
          } catch (e) {
            console.log('Login failed');
          }
        }
  
        // try {
        //   const captcha = await page.evaluate(() => {
        //     return document.getElementById('captchaMask');
        //   });
        //   if (captcha) {
        //     console.log('Exit by ReCaptcha');
        //     return [];
        //   }
        // } catch (e) {
        //   console.log('Exit by ReCaptcha');
        //   return [];
        // }
        
        console.log('Waiting for Login Complete');
        const username = await page.evaluate(() => {
          return document.querySelector('div[class=navbar__username]')?.textContent;
        });
  
        if (username) {
          console.log('Shopee Login successful');
          await saveCookies(page);
          break;
        }
  
        await delay(1000);
      } catch (e) {
        console.log('Erro ao validar parametros de login', e);
      }
    }

    while (browser!.connected) {
      console.log('Starting to scrape...');

      // shopee-search-item-result__item
      const input = await page.$('input[class=shopee-searchbar-input__input]');
      if (!input) {
        await delay(1000);
        continue;
      }

      await input.type(searchTerm, { delay: 100 });
      await input.press('Enter');

      let pageNumber = 1;
      while (true && pageNumber <= numberOfPages) {
        // Wait appears results
        try {
          const results = await page.$$('li.shopee-search-item-result__item');
          if (results == null || results.length == 0) {
            await delay(1000);
            continue;
          }
          console.log(`Found ${results.length} results`);

          let adsCount = 0;
          for (const result of results) {
            try {
              const title = await result.$eval('div.line-clamp-2', el => el.textContent);
              const price = await result.$eval('span.text-base\\/5', el => el.textContent);
              const link = await result.$eval('a', el => el.href);
              const ad: ShopeeAd = { st_plataform: 'SHOPEE', st_plataform_id: geShopeeLId(link!), st_url: link!, st_title: title!, db_price: getPrice(price!) };
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

          // shopee-page-controller
          console.log('Searching for pagination button');
          const nextButton = await page.$$('nav.shopee-page-controller > a');
          if (nextButton == null || nextButton.length == 0) {
            console.log('No pagination button found');
            break;
          }

          let clickNext = false;
          for (const button of nextButton) {
            if (clickNext) {
              console.log('Clicking next button');
              await button.click();
              await delay(1000);
              // rolar a página
              await page.evaluate(() => {
                window.scrollTo(0, 0);
              });
              await delay(200);
              pageNumber++;
              clickNext = false;
              break;
            }

            if (await button.evaluate(el => el.classList.contains('shopee-button-solid'))) {
              console.log('Actual page button found');
              clickNext = true;
              continue;
            }
          }

          // Chegou na última página
          if (clickNext) {
            console.log('No more pages');
            break;
          }
        } catch (e) {
          console.log('Erro ao buscar resultados', e);
        }
      }

      // Get Ads Details
      let adViewed = Math.floor(Math.random() * (ads.length + 1));
      while (adViewed > 0) {
        adViewed--;
        let pos = Math.floor(Math.random() * ads.length);
        while (ads[pos] == null) {
          pos = Math.floor(Math.random() * ads.length);
        }
        const ad = ads[pos];
        ads[pos] = null;
        adsDetails.push(await getAdvertisementDetails(browser!, ad!.st_url, ad!));
      }

      for (const ad of ads) {
        if (ad) {
          adsDetails.push(await getAdvertisementDetails(browser!, ad.st_url, ad));
        }
      }

      return adsDetails;
    }

    console.log('Browser disconnected');
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    if (page) {
      await saveCookies(page);
    }
  }

  return adsDetails;
}

function getPrice(price: string): number {
  return Number(price.replace('R$', '').replace('.', '').replace(',', '.'));
}

function geShopeeLId(url: string): string {
  //https://shopee.com.br/Kit-Haskell-Murumuru-Shampoo-500ml-Condicionador-500ml-e-M%C3%A1scara-Manteiga-Nutritiva-500gr-i.826683144.23791139088?sp_atk=2d018089-1b0f-46a7-8dd5-71532e0debce&xptdk=2d018089-1b0f-46a7-8dd5-71532e0debce
  return url.match(/i\.(\d+)\.(\d+)/)?.[0].replace('i.', 'S') || '';
}

async function getAdvertisementDetails(browser: Browser, link: string, ad: ShopeeAd): Promise<ShopeeAd> {
  const page: Page | null = await newPage(browser!);

  try {
    if (!page) {
      throw new Error('Page not found');
    }

    await page.goto(link, { waitUntil: 'networkidle2' });
    await autoScroll(page);
    await delay(500);

    // wait for product details
    await page.waitForSelector('div.product-detail', { timeout: 3000 });

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
  }
  finally {
    if (page) {
      await page.close();
    }
  }

  return ad;
}

// Example usage
const main = async () => {
  try {
    console.log('Carregando configurações...');
    // Carregar configurações do Secrets Manager
    const configManager = ConfigManager.getInstance();
    const config = await configManager.loadConfig();
    console.log('Configurações carregadas com sucesso.');

    console.log('Iniciando serviços...');
    // Inicializar serviços com as configurações
    const sqsService = new SQSService(config.aws.region, config.aws.queueUrl);
    const adManager = new AdvertisementManager(config.database);
    const advertisementService = new AdvertisementService(adManager, sqsService);
    console.log('Serviços iniciados com sucesso.');

    if (!browser) {
      browser = await newBrowser();
    }

    const searchTerm = 'Paris Elysees Perfume Style Caviar'; // Example search term
    const numberOfPages = 2; // Number of pages to scrape
    const ads = await scrapeShopeeAds(searchTerm, numberOfPages);
    console.log(`Successfully scraped ${ads.length} ads`);

    await advertisementService.saveAdvertisements({
      "scheduler_id": "00000000-0000-0000-0000-000000000001",
      "cron": "MANUAL",
      "platform": "SHOPEE",
      "datetime": new Date().toISOString(),
      "keyword_id": "ff54ecda-8d0a-4d74-bc09-f7a11fc38266",
      "keyword": "Paris Elysees Perfume Style Caviar",
      "brand_id": "06c11762-d384-4264-8051-1957b8a421ac",
      "products": [
          {
              "id_product": "969892b9-4813-46d1-9028-c00e98dd7892",
              "st_varity_seq": "12",
              "st_varity_name": "Paris Elysees Perfume Style Caviar",
          }
      ]
  }, ads.map(ad => ({
      ...ad,
      id_brand: "06c11762-d384-4264-8051-1957b8a421ac",
      st_status: 'NEW'
    })));

  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    if (browser) {
      console.log('Closing browser');
      await browser!.close();
    }
  }
};

process.env.AWS_PROFILE = 'frg';
process.env.APP_REGION = 'sa-east-1';
process.env.DB_SCHEMA = 'pricemonitor';
process.env.RDS_SECRET_NAME = 'local/db/pricemonitor';
process.env.S3_BUCKET_NAME = 'frg-price-monitor-data';
process.env.SQS_QUEUE_URL = 'https://sqs.sa-east-1.amazonaws.com/147997132513/price-monitor-crawler-ai';
process.env.TZ = 'America/Sao_Paulo';

main();
