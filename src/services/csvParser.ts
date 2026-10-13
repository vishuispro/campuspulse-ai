/**
 * CampusPulse - High-Performance CSV Parsing Service
 * Powered by PapaParse for streaming and in-memory parsing
 * with header normalization and malformed row tolerance.
 */

import Papa from 'papaparse';

export interface ParseResult<T> {
  data: T[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
  rowCount: number;
}

/**
 * Parses a raw CSV string into strongly typed objects.
 * Normalizes headers (trims whitespace, converts to lowercase snake_case).
 */
export function parseCsvString<T = Record<string, unknown>>(csvContent: string): ParseResult<T> {
  // Strip optional synthetic disclaimer banners or comments starting with '#'
  const lines = csvContent.split('\n');
  const cleanedContent = lines
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');

  const parsed = Papa.parse<T>(cleanedContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
    transformHeader: (header: string) =>
      header.trim().toLowerCase().replace(/[\s-]+/g, '_'),
  });

  return {
    data: parsed.data,
    errors: parsed.errors,
    meta: parsed.meta,
    rowCount: parsed.data.length,
  };
}

/**
 * Parses a browser File object (for drag-and-drop CSV uploads).
 */
export function parseCsvFile<T = Record<string, unknown>>(file: File): Promise<ParseResult<T>> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: (header: string) =>
        header.trim().toLowerCase().replace(/[\s-]+/g, '_'),
      complete: (results) => {
        resolve({
          data: results.data,
          errors: results.errors,
          meta: results.meta,
          rowCount: results.data.length,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
