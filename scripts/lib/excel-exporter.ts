/**
 * Excel generation with formatting using ExcelJS
 */

import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ScrapingResult, ExcelExportOptions } from './types';

const DEFAULT_OPTIONS: ExcelExportOptions = {
  sheetName: 'Funding Rounds',
  includeMetadata: true,
  freezeHeader: true,
  autoFilter: true,
  formatDates: true,
  convertUrlsToLinks: true,
};

/**
 * Export scraping result to Excel file
 */
export async function exportToExcel(
  result: ScrapingResult,
  outputPath: string,
  options: Partial<ExcelExportOptions> = {}
): Promise<string> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  console.log('📝 Exporting to Excel...');

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Funding Rounds Scraper';
  workbook.created = new Date();

  // Create sheet name with date
  const dateStr = result.scrapedAt.toISOString().split('T')[0];
  const sheetName = `${finalOptions.sheetName} - ${dateStr}`;

  const worksheet = workbook.addWorksheet(sheetName);

  // Add metadata row if enabled
  let startRow = 1;
  if (finalOptions.includeMetadata) {
    worksheet.mergeCells('A1:C1');
    const metadataCell = worksheet.getCell('A1');
    metadataCell.value = `Scraped on: ${result.scrapedAt.toLocaleString()} | Source: ${result.sourceUrl} | Total Records: ${result.totalRecords}`;
    metadataCell.font = { italic: true, size: 10 };
    metadataCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F3F3' },
    };
    startRow = 3;
    worksheet.getRow(2).height = 5; // Add spacing
  }

  // Add headers
  const headerRow = worksheet.getRow(startRow);
  result.columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  // Add data rows
  result.data.forEach((record, rowIndex) => {
    const row = worksheet.getRow(startRow + rowIndex + 1);

    result.columns.forEach((column, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const value = record[column];

      // Set value based on type
      if (value instanceof Date) {
        cell.value = value;
        if (finalOptions.formatDates) {
          cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
        }
      } else if (typeof value === 'number') {
        cell.value = value;
        cell.alignment = { horizontal: 'right' };

        // Format as currency if column name suggests it
        if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('price')) {
          cell.numFmt = '$#,##0.00';
        } else if (column.toLowerCase().includes('percent')) {
          cell.numFmt = '0.00%';
        } else {
          cell.numFmt = '#,##0.00';
        }
      } else if (typeof value === 'string') {
        // Check if it's a URL
        if (
          finalOptions.convertUrlsToLinks &&
          (value.startsWith('http://') || value.startsWith('https://'))
        ) {
          cell.value = {
            text: value,
            hyperlink: value,
          };
          cell.font = { color: { argb: 'FF0000FF' }, underline: true };
        } else {
          cell.value = value;
        }

        // Try to parse as date
        if (finalOptions.formatDates && isDateString(value)) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            cell.value = date;
            cell.numFmt = 'yyyy-mm-dd';
          }
        }

        // Try to parse as number
        const num = parseFloat(value.replace(/[$,]/g, ''));
        if (!isNaN(num) && value.match(/^[$]?[\d,]+\.?\d*$/)) {
          cell.value = num;
          cell.alignment = { horizontal: 'right' };
          if (value.startsWith('$')) {
            cell.numFmt = '$#,##0.00';
          }
        }
      } else {
        cell.value = value as any;
      }

      // Zebra striping for better readability
      if (rowIndex % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' },
        };
      }
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach((column, index) => {
    let maxLength = result.columns[index]?.length || 10;

    result.data.forEach((record) => {
      const value = record[result.columns[index]];
      const length = value?.toString().length || 0;
      if (length > maxLength) {
        maxLength = length;
      }
    });

    column.width = Math.min(maxLength + 2, 50); // Max width of 50
  });

  // Freeze header row
  if (finalOptions.freezeHeader) {
    worksheet.views = [{ state: 'frozen', ySplit: startRow }];
  }

  // Add auto filter
  if (finalOptions.autoFilter) {
    worksheet.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: startRow, column: result.columns.length },
    };
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  await workbook.xlsx.writeFile(outputPath);

  console.log(`💾 Saved to: ${outputPath}`);

  return outputPath;
}

/**
 * Generate default output path
 */
export function generateOutputPath(baseDir?: string): string {
  const downloadsDir = baseDir || path.join(os.homedir(), 'Downloads');

  // Ensure Downloads directory exists
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .split('.')[0];

  const filename = `funding-rounds-${timestamp}.xlsx`;
  return path.join(downloadsDir, filename);
}

/**
 * Check if a string looks like a date
 */
function isDateString(str: string): boolean {
  if (typeof str !== 'string') return false;

  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO: 2024-01-01
    /^\d{1,2}\/\d{1,2}\/\d{4}/, // US: 1/1/2024
    /^\d{1,2}-\d{1,2}-\d{4}/, // US: 1-1-2024
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/, // Month names
  ];

  return datePatterns.some((pattern) => pattern.test(str));
}

/**
 * Get file size in human-readable format
 */
export function getFileSize(filepath: string): string {
  const stats = fs.statSync(filepath);
  const bytes = stats.size;

  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
