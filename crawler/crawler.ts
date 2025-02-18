import axios from 'axios';
import * as cheerio from 'cheerio';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Function to search Mercado Livre
async function searchMercadoLivre(query: string): Promise<string> {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
  const response = await axios.get(url);
  return response.data;
}

// Function to extract product data from search results
function extractProductData(html: string): any[] {
  const $ = cheerio.load(html);
  const products: any[] = [];

  $('.ui-search-result__wrapper').each((i, elem) => {
    const title = $(elem).find('.poly-component__title').text().trim();
    const price = $(elem).find('.poly-component__price').text().trim();
    const link = $(elem).find('.poly-component__title').attr('href');
    products.push({ title, price, link });
  });

  return products;
}


// Main function to run the crawler
async function main() {
  const searchQuery = 'wella';
  try {
    console.log(`Searching for: ${searchQuery}`);
    const html = await searchMercadoLivre(searchQuery);
    const products = extractProductData(html);

    // Complex message with attributes
    /*await sqsService.sendMessage({
      messageBody: JSON.stringify({ data: 'test', timestamp: Date.now() }),
      messageAttributes: {
          eventType: 'USER_CREATED',
          source: 'API'
      },
      delaySeconds: 5
    });*/

    console.log(`Found ${products.length} products`);
    //await saveToDatabase(db, products);
    console.log('Data saved to database');

    // Print the first 5 products as a sample
    console.log('Sample of extracted products:');
    console.log(products.slice(0, 5));
  } catch (error) {
    console.log('An error occurred:', error);
  } finally {
    //await db.close();
  }
}

main();

