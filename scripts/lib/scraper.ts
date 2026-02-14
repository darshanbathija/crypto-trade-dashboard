/**
 * Browser automation with stealth configuration using Playwright
 */

import { chromium, Browser, Page } from 'playwright';
import { BrowserInstance, ScraperConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_CONFIG: ScraperConfig = {
  headless: process.env.SCRAPER_HEADLESS !== 'false',
  timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000'),
  maxPages: parseInt(process.env.SCRAPER_MAX_PAGES || '100'),
  delayMin: parseInt(process.env.SCRAPER_DELAY_MIN || '1000'),
  delayMax: parseInt(process.env.SCRAPER_DELAY_MAX || '3000'),
  screenshotOnError: process.env.SCRAPER_SCREENSHOT_ON_ERROR !== 'false',
};

/**
 * Initialize browser with stealth configuration
 */
export async function initBrowser(config: Partial<ScraperConfig> = {}): Promise<BrowserInstance> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('🌐 Launching browser...');

  const browser = await chromium.launch({
    headless: finalConfig.headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(finalConfig.timeout);

  // Remove webdriver flag
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  console.log('✅ Browser launched successfully');

  return { browser, page };
}

/**
 * Navigate to a URL and wait for network idle
 */
export async function navigateToPage(
  page: Page,
  url: string,
  config: Partial<ScraperConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log(`📍 Navigating to ${url}`);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: finalConfig.timeout,
    });

    // Add random delay to mimic human behavior
    await randomDelay(finalConfig.delayMin, finalConfig.delayMax);

    console.log('✅ Page loaded successfully');
  } catch (error) {
    if (finalConfig.screenshotOnError) {
      await takeScreenshot(page, 'navigation-error');
    }
    throw new Error(`Failed to navigate to ${url}: ${error}`);
  }
}

/**
 * Close browser and cleanup resources
 */
export async function closeBrowser(browserInstance: BrowserInstance): Promise<void> {
  console.log('🔒 Closing browser...');
  await browserInstance.browser.close();
  console.log('✅ Browser closed');
}

/**
 * Take a screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string): Promise<string> {
  const screenshotDir = path.join(process.cwd(), 'screenshots');

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filepath}`);

  return filepath;
}

/**
 * Random delay to mimic human behavior
 */
export async function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️  Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Wait for an element with retry logic
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 30000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch (error) {
    console.log(`⚠️  Element not found: ${selector}`);
    return false;
  }
}

/**
 * Scroll to bottom of page (for infinite scroll)
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await randomDelay(1000, 2000);
}

/**
 * Get page height
 */
export async function getPageHeight(page: Page): Promise<number> {
  return await page.evaluate(() => document.body.scrollHeight);
}
