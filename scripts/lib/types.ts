/**
 * Type definitions for funding rounds scraper
 */

import { Browser, Page } from 'playwright';

/**
 * Scraper configuration options
 */
export interface ScraperConfig {
  headless: boolean;
  timeout: number;
  maxPages: number;
  delayMin: number;
  delayMax: number;
  screenshotOnError: boolean;
}

/**
 * Browser instance with associated page
 */
export interface BrowserInstance {
  browser: Browser;
  page: Page;
}

/**
 * Detected data structure from the page
 */
export interface DataStructure {
  columns: string[];
  rowSelector: string;
  cellSelector: string;
  hasHeaders: boolean;
  paginationType: 'button' | 'infinite-scroll' | 'load-more' | 'none';
  nextButtonSelector?: string;
  loadMoreSelector?: string;
}

/**
 * Single data record (flexible key-value structure)
 */
export interface DataRecord {
  [key: string]: string | number | Date | null;
}

/**
 * Extracted page data
 */
export interface PageData {
  records: DataRecord[];
  pageNumber: number;
  hasMore: boolean;
}

/**
 * Complete scraping result
 */
export interface ScrapingResult {
  data: DataRecord[];
  totalRecords: number;
  totalPages: number;
  columns: string[];
  scrapedAt: Date;
  sourceUrl: string;
}

/**
 * Excel export options
 */
export interface ExcelExportOptions {
  sheetName: string;
  includeMetadata: boolean;
  freezeHeader: boolean;
  autoFilter: boolean;
  formatDates: boolean;
  convertUrlsToLinks: boolean;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (current: number, total: number, message: string) => void;
