#!/usr/bin/env node
/**
 * Scrape funding rounds database to Excel
 * Run with: npm run scrape-funding
 */

import { initBrowser, navigateToPage, closeBrowser, takeScreenshot } from './lib/scraper';
import { discoverDataStructure, extractAllData } from './lib/data-extractor';
import { exportToExcel, generateOutputPath, getFileSize } from './lib/excel-exporter';
import { ScraperConfig } from './lib/types';

const TARGET_URL = 'https://funding.decentralised.co/rounds';

/**
 * Main scraper function
 */
async function main() {
  const startTime = Date.now();

  console.log('🚀 Starting funding database scraper...');
  console.log('');

  let browserInstance;

  try {
    // Parse command-line arguments
    const args = process.argv.slice(2);
    const headless = !args.includes('--headless=false');
    const maxPages = parseInt(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || '100');
    const outputArg = args.find((arg) => arg.startsWith('--output='))?.split('=')[1];

    const config: Partial<ScraperConfig> = {
      headless,
      maxPages,
    };

    // Initialize browser
    browserInstance = await initBrowser(config);
    const { page } = browserInstance;

    // Navigate to target URL
    await navigateToPage(page, TARGET_URL, config);

    // Take initial screenshot for debugging
    await takeScreenshot(page, 'initial-load');

    // Discover data structure
    const structure = await discoverDataStructure(page);

    // Extract all data
    const result = await extractAllData(page, structure, config);

    // Close browser
    await closeBrowser(browserInstance);
    browserInstance = undefined;

    // Generate output path
    const outputPath = outputArg || generateOutputPath();

    // Export to Excel
    await exportToExcel(result, outputPath);

    // Calculate elapsed time
    const elapsedMs = Date.now() - startTime;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
    const elapsedStr =
      elapsedMin > 0 ? `${elapsedMin}m ${elapsedSec}s` : `${elapsedSec}s`;

    // Print summary
    console.log('');
    console.log('✨ Done!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Records: ${result.totalRecords}`);
    console.log(`   Pages: ${result.totalPages}`);
    console.log(`   Columns: ${result.columns.length}`);
    console.log(`   File: ${outputPath}`);
    console.log(`   Size: ${getFileSize(outputPath)}`);
    console.log(`   Time: ${elapsedStr}`);
    console.log('');
    console.log(`💡 Open the file with: libreoffice ${outputPath}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error occurred:');
    console.error(error);
    console.error('');

    // Try to take error screenshot
    if (browserInstance) {
      try {
        await takeScreenshot(browserInstance.page, 'error');
        await closeBrowser(browserInstance);
      } catch (cleanupError) {
        console.error('⚠️  Failed to cleanup browser:', cleanupError);
      }
    }

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️  Interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('⚠️  Terminated');
  process.exit(143);
});

// Run the scraper
main();
