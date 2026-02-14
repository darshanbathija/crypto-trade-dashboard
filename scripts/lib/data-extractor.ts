/**
 * Dynamic data discovery and extraction logic
 */

import { Page } from 'playwright';
import { DataStructure, DataRecord, PageData, ScrapingResult, ScraperConfig } from './types';
import {
  randomDelay,
  waitForElement,
  scrollToBottom,
  getPageHeight,
  takeScreenshot,
} from './scraper';

const DEFAULT_CONFIG: ScraperConfig = {
  headless: process.env.SCRAPER_HEADLESS !== 'false',
  timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000'),
  maxPages: parseInt(process.env.SCRAPER_MAX_PAGES || '100'),
  delayMin: parseInt(process.env.SCRAPER_DELAY_MIN || '1000'),
  delayMax: parseInt(process.env.SCRAPER_DELAY_MAX || '3000'),
  screenshotOnError: process.env.SCRAPER_SCREENSHOT_ON_ERROR !== 'false',
};

/**
 * Discover the data structure on the page
 */
export async function discoverDataStructure(page: Page): Promise<DataStructure> {
  console.log('🔍 Analyzing page structure...');

  // Wait for content to load
  await page.waitForLoadState('networkidle');
  await randomDelay(2000, 3000);

  // Try to find table structure
  const structure = await page.evaluate(() => {
    // Strategy 1: Look for HTML table
    const table = document.querySelector('table');
    if (table) {
      const headers = Array.from(table.querySelectorAll('thead th')).map(
        (th) => th.textContent?.trim() || ''
      );
      return {
        type: 'table',
        columns: headers.length > 0 ? headers : ['Column 1', 'Column 2'],
        rowSelector: 'tbody tr',
        cellSelector: 'td',
        hasHeaders: headers.length > 0,
      };
    }

    // Strategy 2: Look for role="table" (ARIA tables)
    const ariaTable = document.querySelector('[role="table"]');
    if (ariaTable) {
      const headerRow = ariaTable.querySelector('[role="row"]');
      const headers = headerRow
        ? Array.from(headerRow.querySelectorAll('[role="columnheader"]')).map(
            (th) => th.textContent?.trim() || ''
          )
        : [];

      return {
        type: 'aria-table',
        columns: headers.length > 0 ? headers : ['Column 1'],
        rowSelector: '[role="row"]:not(:first-child)',
        cellSelector: '[role="cell"]',
        hasHeaders: headers.length > 0,
      };
    }

    // Strategy 3: Look for common data grid patterns
    const gridSelectors = [
      '.data-grid',
      '.table-container',
      '[class*="grid"]',
      '[class*="table"]',
      '[class*="list"]',
    ];

    for (const selector of gridSelectors) {
      const grid = document.querySelector(selector);
      if (grid) {
        // Try to find headers
        const possibleHeaders = grid.querySelectorAll('[class*="header"], [class*="head"]');
        const headers = Array.from(possibleHeaders).map((h) => h.textContent?.trim() || '');

        // Try to find rows
        const rowSelectors = ['[class*="row"]', '[class*="item"]', 'li', 'div'];
        for (const rowSel of rowSelectors) {
          const rows = grid.querySelectorAll(rowSel);
          if (rows.length > 3) {
            return {
              type: 'grid',
              columns: headers.length > 0 ? headers : ['Data'],
              rowSelector: rowSel,
              cellSelector: '[class*="cell"], [class*="col"], div, span',
              hasHeaders: headers.length > 0,
            };
          }
        }
      }
    }

    // Fallback: Look for any repeating structure
    const allDivs = document.querySelectorAll('div');
    const classes = Array.from(allDivs)
      .map((div) => div.className)
      .filter((c) => c && c.length > 0);

    // Find most common class (likely the row class)
    const classCounts = classes.reduce(
      (acc, c) => {
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommonClass = Object.entries(classCounts)
      .filter(([_, count]) => count > 5)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (mostCommonClass) {
      return {
        type: 'generic',
        columns: ['Data'],
        rowSelector: `.${mostCommonClass.split(' ')[0]}`,
        cellSelector: 'div, span, p',
        hasHeaders: false,
      };
    }

    return null;
  });

  if (!structure) {
    throw new Error('Could not detect data structure on page');
  }

  // Detect pagination type
  const paginationType = await detectPaginationType(page);

  const dataStructure: DataStructure = {
    columns: structure.columns,
    rowSelector: structure.rowSelector,
    cellSelector: structure.cellSelector,
    hasHeaders: structure.hasHeaders,
    paginationType: paginationType.type,
    nextButtonSelector: paginationType.nextButtonSelector,
    loadMoreSelector: paginationType.loadMoreSelector,
  };

  console.log(`   ✅ Discovered ${dataStructure.columns.length} columns: ${dataStructure.columns.join(', ')}`);
  console.log(`   ✅ Pagination type: ${dataStructure.paginationType}`);

  return dataStructure;
}

/**
 * Detect pagination type
 */
async function detectPaginationType(page: Page): Promise<{
  type: 'button' | 'infinite-scroll' | 'load-more' | 'none';
  nextButtonSelector?: string;
  loadMoreSelector?: string;
}> {
  const result = await page.evaluate(() => {
    // Look for "Next" button
    const nextButtonSelectors = [
      'button:has-text("Next")',
      'a:has-text("Next")',
      '[aria-label*="next"]',
      '[class*="next"]',
      'button:has-text(">")',
    ];

    for (const selector of nextButtonSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return { type: 'button' as const, nextButtonSelector: selector };
      }
    }

    // Look for "Load More" button
    const loadMoreSelectors = [
      'button:has-text("Load More")',
      'button:has-text("Show More")',
      '[class*="load-more"]',
    ];

    for (const selector of loadMoreSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return { type: 'load-more' as const, loadMoreSelector: selector };
      }
    }

    // Check for infinite scroll indicators
    const hasInfiniteScroll =
      document.querySelector('[class*="infinite"]') ||
      document.querySelector('[data-scroll]') ||
      document.body.scrollHeight > window.innerHeight * 2;

    if (hasInfiniteScroll) {
      return { type: 'infinite-scroll' as const };
    }

    return { type: 'none' as const };
  });

  return result;
}

/**
 * Extract data from current page
 */
export async function extractPageData(
  page: Page,
  structure: DataStructure,
  pageNumber: number = 1
): Promise<PageData> {
  console.log(`   📄 Extracting page ${pageNumber}...`);

  const records = await page.evaluate(
    ({ rowSelector, cellSelector }) => {
      const rows = document.querySelectorAll(rowSelector);
      const data: any[] = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll(cellSelector);
        const record: any = {};

        cells.forEach((cell, index) => {
          const text = cell.textContent?.trim() || '';
          const key = `column_${index}`;
          record[key] = text;

          // Try to extract URLs
          const link = cell.querySelector('a');
          if (link) {
            record[`${key}_url`] = link.href;
          }
        });

        // Only add non-empty records
        if (Object.keys(record).length > 0) {
          data.push(record);
        }
      });

      return data;
    },
    { rowSelector: structure.rowSelector, cellSelector: structure.cellSelector }
  );

  // Map generic column names to actual column names
  const mappedRecords = records.map((record) => {
    const mapped: DataRecord = {};
    Object.keys(record).forEach((key, index) => {
      if (key.startsWith('column_')) {
        const colIndex = parseInt(key.split('_')[1]);
        const colName = structure.columns[colIndex] || `Column ${colIndex + 1}`;
        mapped[colName] = record[key];
      } else if (key.endsWith('_url')) {
        const baseKey = key.replace('_url', '');
        const colIndex = parseInt(baseKey.split('_')[1]);
        const colName = structure.columns[colIndex] || `Column ${colIndex + 1}`;
        mapped[`${colName} URL`] = record[key];
      }
    });
    return mapped;
  });

  console.log(`   ✅ Extracted ${mappedRecords.length} records`);

  return {
    records: mappedRecords,
    pageNumber,
    hasMore: false, // Will be determined by pagination logic
  };
}

/**
 * Handle pagination and extract all data
 */
export async function extractAllData(
  page: Page,
  structure: DataStructure,
  config: Partial<ScraperConfig> = {}
): Promise<ScrapingResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const allRecords: DataRecord[] = [];
  let pageNumber = 1;
  let hasMore = true;

  console.log('📊 Extracting data...');

  // Extract first page
  const firstPage = await extractPageData(page, structure, pageNumber);
  allRecords.push(...firstPage.records);

  // Handle pagination
  if (structure.paginationType === 'button' && structure.nextButtonSelector) {
    while (hasMore && pageNumber < finalConfig.maxPages) {
      pageNumber++;

      // Check if next button exists and is enabled
      const nextButton = await page.$(structure.nextButtonSelector);
      if (!nextButton) {
        hasMore = false;
        break;
      }

      const isDisabled = await nextButton.isDisabled();
      if (isDisabled) {
        hasMore = false;
        break;
      }

      // Click next button
      try {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        await randomDelay(finalConfig.delayMin, finalConfig.delayMax);

        // Extract data from new page
        const pageData = await extractPageData(page, structure, pageNumber);
        if (pageData.records.length === 0) {
          hasMore = false;
          break;
        }

        allRecords.push(...pageData.records);
        console.log(`   📄 Page ${pageNumber} | ${allRecords.length} total records`);
      } catch (error) {
        console.log(`   ⚠️  Pagination ended at page ${pageNumber}`);
        hasMore = false;
      }
    }
  } else if (structure.paginationType === 'infinite-scroll') {
    let previousHeight = await getPageHeight(page);
    let noChangeCount = 0;

    while (hasMore && pageNumber < finalConfig.maxPages && noChangeCount < 3) {
      await scrollToBottom(page);
      await randomDelay(2000, 4000);

      const newHeight = await getPageHeight(page);
      if (newHeight === previousHeight) {
        noChangeCount++;
      } else {
        noChangeCount = 0;
        pageNumber++;

        // Extract new data
        const pageData = await extractPageData(page, structure, pageNumber);
        const newRecords = pageData.records.filter(
          (r) => !allRecords.some((existing) => JSON.stringify(existing) === JSON.stringify(r))
        );

        if (newRecords.length === 0) {
          hasMore = false;
          break;
        }

        allRecords.push(...newRecords);
        console.log(`   📄 Scroll ${pageNumber} | ${allRecords.length} total records`);
        previousHeight = newHeight;
      }
    }
  } else if (structure.paginationType === 'load-more' && structure.loadMoreSelector) {
    while (hasMore && pageNumber < finalConfig.maxPages) {
      const loadMoreButton = await page.$(structure.loadMoreSelector);
      if (!loadMoreButton) {
        hasMore = false;
        break;
      }

      try {
        await loadMoreButton.click();
        await randomDelay(finalConfig.delayMin, finalConfig.delayMax);

        pageNumber++;
        const pageData = await extractPageData(page, structure, pageNumber);
        if (pageData.records.length === 0) {
          hasMore = false;
          break;
        }

        allRecords.push(...pageData.records);
        console.log(`   📄 Page ${pageNumber} | ${allRecords.length} total records`);
      } catch (error) {
        hasMore = false;
      }
    }
  }

  // Deduplicate records
  const uniqueRecords = deduplicateRecords(allRecords);

  console.log(`✅ Scraped ${uniqueRecords.length} unique records from ${pageNumber} pages`);

  return {
    data: uniqueRecords,
    totalRecords: uniqueRecords.length,
    totalPages: pageNumber,
    columns: structure.columns,
    scrapedAt: new Date(),
    sourceUrl: page.url(),
  };
}

/**
 * Remove duplicate records
 */
export function deduplicateRecords(records: DataRecord[]): DataRecord[] {
  const seen = new Set<string>();
  const unique: DataRecord[] = [];

  for (const record of records) {
    const key = JSON.stringify(record);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(record);
    }
  }

  if (records.length !== unique.length) {
    console.log(`   ℹ️  Removed ${records.length - unique.length} duplicate records`);
  }

  return unique;
}
