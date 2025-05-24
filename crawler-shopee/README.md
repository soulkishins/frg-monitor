# Shopee Ads Crawler

A Node.js application that automates Chrome browser to scrape advertisement data from Shopee's website.

## Features

- Automated browser control using Puppeteer
- Extracts ad title, price, link, and vendor information
- Supports multi-page scraping
- Saves results to JSON files with timestamps
- Built with TypeScript for better type safety

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

1. Build the project:
```bash
npm run build
```

2. Run the crawler:
```bash
npm start
```

By default, the crawler will search for "smartphone" and scrape 2 pages of results. You can modify these parameters in the `main.ts` file.

## Configuration

The main configuration options are in `main.ts`:

- `searchTerm`: The term to search for on Shopee
- `numberOfPages`: Number of pages to scrape
- `headless`: Browser visibility (false for visible browser, true for headless mode)

## Output

The crawler saves results in JSON files with timestamps in the format:
```
shopee-ads-YYYY-MM-DDTHH-mm-ss-sssZ.json
```

Each ad entry contains:
- title
- price
- link
- vendor

## Error Handling

The crawler includes basic error handling for:
- Popup handling
- Network issues
- Page navigation
- Data extraction

## Notes

- The crawler includes delays to respect Shopee's servers and avoid detection
- User agent is set to mimic a regular browser
- The browser runs in visible mode by default for debugging purposes 