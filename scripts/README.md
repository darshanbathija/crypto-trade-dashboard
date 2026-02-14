# Funding Rounds Database Scraper

This script scrapes the complete funding rounds database from https://funding.decentralised.co/rounds and exports it to an Excel spreadsheet.

## Features

- **Automatic Data Discovery**: Dynamically detects table structure and column headers
- **Smart Pagination**: Handles button-based pagination, infinite scroll, and "Load More" patterns
- **Anti-Bot Bypass**: Stealth browser configuration to bypass 403 protection
- **Excel Export**: Professionally formatted Excel file with:
  - Bold headers with color
  - Auto-fit columns
  - Frozen header row
  - Auto-filters
  - Clickable URL links
  - Proper date and number formatting
  - Zebra striping for readability
- **Progress Tracking**: Real-time console updates during scraping
- **Error Handling**: Retry logic, screenshots on error, graceful degradation
- **Duplicate Detection**: Automatically removes duplicate records

## Installation

### 1. Install Dependencies

The dependencies are already added to `package.json`. If you haven't run npm install yet:

```bash
npm install
```

This installs:
- `playwright` - Browser automation
- `exceljs` - Excel file generation
- `cli-progress` - Progress bars (optional, for future enhancement)

### 2. Install Playwright Browsers

Playwright needs to download the Chromium browser:

```bash
npx playwright install chromium
```

**Note**: If you're in a restricted environment where the download fails, you can:
- Run this in your local environment (not in a sandbox)
- Or use `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` and install system Chrome

## Usage

### Basic Usage

Run the scraper with default settings (headless mode, max 100 pages, save to ~/Downloads):

```bash
npm run scrape-funding
```

### Advanced Options

**Show browser window** (helpful for debugging):
```bash
npm run scrape-funding -- --headless=false
```

**Limit pages** (e.g., first 10 pages only):
```bash
npm run scrape-funding -- --limit=10
```

**Custom output path**:
```bash
npm run scrape-funding -- --output=/path/to/custom/file.xlsx
```

**Combine options**:
```bash
npm run scrape-funding -- --headless=false --limit=5 --output=./test.xlsx
```

## Configuration

You can customize scraper behavior with environment variables. Create a `.env` file:

```bash
SCRAPER_HEADLESS=true              # Run browser in headless mode (default: true)
SCRAPER_TIMEOUT=30000              # Page load timeout in ms (default: 30000)
SCRAPER_MAX_PAGES=100              # Max pages to scrape (default: 100)
SCRAPER_DELAY_MIN=1000             # Min delay between actions in ms (default: 1000)
SCRAPER_DELAY_MAX=3000             # Max delay between actions in ms (default: 3000)
SCRAPER_SCREENSHOT_ON_ERROR=true   # Save screenshots on errors (default: true)
```

## Output

The script generates an Excel file with:

**Filename format**: `funding-rounds-YYYY-MM-DD-HHMMSS.xlsx`

**Default location**: `~/Downloads/`

**Sheet structure**:
- **Row 1**: Metadata (scrape date, source URL, record count)
- **Row 3**: Column headers (bold, colored, frozen)
- **Row 4+**: Data records

**Formatting**:
- Currency values: `$X,XXX.XX`
- Dates: `YYYY-MM-DD` format
- URLs: Clickable hyperlinks
- Alternating row colors for readability

## Expected Output

```
🚀 Starting funding database scraper...

🌐 Launching browser...
✅ Browser launched successfully
📍 Navigating to https://funding.decentralised.co/rounds
✅ Page loaded successfully
🔍 Analyzing page structure...
   ✅ Discovered 8 columns: [Project, Round, Amount, Date, ...]
   ✅ Pagination type: button
📊 Extracting data...
   📄 Extracting page 1...
   ✅ Extracted 50 records
   📄 Page 2 | 100 total records
   📄 Page 3 | 150 total records
   ...
✅ Scraped 987 unique records from 32 pages
📝 Exporting to Excel...
💾 Saved to: /home/user/Downloads/funding-rounds-2026-02-13-143022.xlsx

✨ Done!

📊 Summary:
   Records: 987
   Pages: 32
   Columns: 8
   File: /home/user/Downloads/funding-rounds-2026-02-13-143022.xlsx
   Size: 245.67 KB
   Time: 3m 24s

💡 Open the file with: libreoffice /home/user/Downloads/funding-rounds-2026-02-13-143022.xlsx
```

## Troubleshooting

### 403 Error Persists

If you still get 403 errors from the target website:
1. Try running with `--headless=false` to see what's happening
2. Increase delays: `SCRAPER_DELAY_MIN=2000 SCRAPER_DELAY_MAX=5000`
3. Check if the website has CAPTCHA

### No Data Extracted

1. Check the screenshots in `screenshots/` folder
2. Run with `--headless=false` to watch the browser
3. The website structure may have changed - inspect manually

### Pagination Doesn't Work

1. Check console output for pagination type detected
2. Website might use a different pagination pattern
3. Run with `--limit=1` to test single page extraction first

### Excel File Corrupted

1. Verify ExcelJS version is compatible: `npm list exceljs`
2. Try opening with different software (Excel, LibreOffice, Google Sheets)

### Playwright Browser Not Found

```bash
# Reinstall browsers
npx playwright install chromium

# Or use system Chrome
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome
```

## Architecture

```
scripts/
├── scrape-funding-rounds.ts     # Main entry point
└── lib/
    ├── types.ts                 # TypeScript interfaces
    ├── scraper.ts               # Browser automation (Playwright)
    ├── data-extractor.ts        # Data discovery & extraction
    └── excel-exporter.ts        # Excel generation (ExcelJS)
```

**Flow**:
1. Launch browser with stealth config
2. Navigate to target URL
3. Dynamically discover table structure
4. Extract data from first page
5. Detect pagination type
6. Loop through all pages
7. Deduplicate records
8. Export to formatted Excel
9. Save to ~/Downloads

## Development

To modify the scraper behavior, edit the relevant module:

- **Change browser settings**: `lib/scraper.ts`
- **Modify data extraction logic**: `lib/data-extractor.ts`
- **Customize Excel formatting**: `lib/excel-exporter.ts`
- **Add CLI arguments**: `scrape-funding-rounds.ts`

## Security & Ethics

This scraper is designed for legitimate data research purposes. Please:
- Respect the website's terms of service
- Don't overload their servers (use reasonable delays)
- Cache results instead of re-scraping frequently
- Consider reaching out for an official API if available

## License

Part of the crypto-trade-dashboard project.
