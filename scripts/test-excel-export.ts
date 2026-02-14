#!/usr/bin/env node
/**
 * Test script to demonstrate Excel export with sample data
 * This simulates the scraper output without requiring Playwright
 */

import { exportToExcel, generateOutputPath, getFileSize } from './lib/excel-exporter';
import { ScrapingResult } from './lib/types';

async function main() {
  console.log('📝 Generating sample funding rounds data...');

  // Create sample data that mimics real funding rounds
  const sampleData = [
    {
      'Project': 'Uniswap',
      'Round': 'Series A',
      'Amount': '$11,000,000',
      'Date': '2020-08-05',
      'Investors': 'Andreessen Horowitz, Paradigm',
      'Stage': 'Growth',
      'Category': 'DeFi',
      'Website URL': 'https://uniswap.org'
    },
    {
      'Project': 'Aave',
      'Round': 'Token Sale',
      'Amount': '$600,000',
      'Date': '2017-11-01',
      'Investors': 'Community',
      'Stage': 'Seed',
      'Category': 'Lending',
      'Website URL': 'https://aave.com'
    },
    {
      'Project': 'Compound',
      'Round': 'Series A',
      'Amount': '$8,200,000',
      'Date': '2018-05-01',
      'Investors': 'Bain Capital Ventures, Andreessen Horowitz',
      'Stage': 'Growth',
      'Category': 'DeFi',
      'Website URL': 'https://compound.finance'
    },
    {
      'Project': 'Curve Finance',
      'Round': 'Seed',
      'Amount': '$2,500,000',
      'Date': '2020-08-01',
      'Investors': 'Framework Ventures',
      'Stage': 'Seed',
      'Category': 'DeFi',
      'Website URL': 'https://curve.fi'
    },
    {
      'Project': 'Maker',
      'Round': 'Series A',
      'Amount': '$12,000,000',
      'Date': '2018-09-01',
      'Investors': 'Andreessen Horowitz',
      'Stage': 'Growth',
      'Category': 'Stablecoins',
      'Website URL': 'https://makerdao.com'
    },
    {
      'Project': 'dYdX',
      'Round': 'Series B',
      'Amount': '$65,000,000',
      'Date': '2021-01-26',
      'Investors': 'Paradigm, Three Arrows Capital',
      'Stage': 'Growth',
      'Category': 'Derivatives',
      'Website URL': 'https://dydx.exchange'
    },
    {
      'Project': 'Synthetix',
      'Round': 'Seed',
      'Amount': '$3,000,000',
      'Date': '2018-03-01',
      'Investors': 'Framework Ventures',
      'Stage': 'Seed',
      'Category': 'Derivatives',
      'Website URL': 'https://synthetix.io'
    },
    {
      'Project': 'Chainlink',
      'Round': 'Token Sale',
      'Amount': '$32,000,000',
      'Date': '2017-09-19',
      'Investors': 'Community',
      'Stage': 'Seed',
      'Category': 'Oracles',
      'Website URL': 'https://chain.link'
    },
    {
      'Project': '1inch',
      'Round': 'Series A',
      'Amount': '$12,000,000',
      'Date': '2020-12-15',
      'Investors': 'Pantera Capital',
      'Stage': 'Growth',
      'Category': 'DEX Aggregator',
      'Website URL': 'https://1inch.io'
    },
    {
      'Project': 'The Graph',
      'Round': 'Seed',
      'Amount': '$2,500,000',
      'Date': '2019-01-01',
      'Investors': 'Multicoin Capital',
      'Stage': 'Seed',
      'Category': 'Infrastructure',
      'Website URL': 'https://thegraph.com'
    },
  ];

  // Create ScrapingResult object
  const result: ScrapingResult = {
    data: sampleData,
    totalRecords: sampleData.length,
    totalPages: 1,
    columns: ['Project', 'Round', 'Amount', 'Date', 'Investors', 'Stage', 'Category', 'Website URL'],
    scrapedAt: new Date(),
    sourceUrl: 'https://funding.decentralised.co/rounds (SAMPLE DATA)',
  };

  console.log(`✅ Generated ${result.totalRecords} sample records`);

  // Generate output path
  const outputPath = generateOutputPath();

  // Export to Excel
  await exportToExcel(result, outputPath);

  console.log('');
  console.log('✨ Done!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Records: ${result.totalRecords} (sample data)`);
  console.log(`   Columns: ${result.columns.length}`);
  console.log(`   File: ${outputPath}`);
  console.log(`   Size: ${getFileSize(outputPath)}`);
  console.log('');
  console.log('⚠️  NOTE: This is sample data for demonstration.');
  console.log('   To scrape real data, run: npm run scrape-funding');
  console.log('   (Requires: npx playwright install chromium)');
  console.log('');
}

main().catch(console.error);
