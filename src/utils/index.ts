import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { logger } from './logger';

/**
 * Formats uptime in seconds to a human-readable string
 *
 * @param {number} seconds - The number of seconds to format
 * @returns {string} A formatted string representation of the uptime (e.g. "2 days, 3 hours, 45 min")
 *
 * @example
 * formatUptime(3665) // Returns "1 hour, 1 min"
 * formatUptime(172800) // Returns "2 days, 0 min"
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  let str = '';
  if (days > 0) str += `${days} day${days > 1 ? 's' : ''}, `;
  if (hours > 0) str += `${hours} hour${hours > 1 ? 's' : ''}, `;
  str += `${minutes} min`;
  return str;
}

/**
 * Reads an HTML file from the filesystem with environment-specific paths
 *
 * @param {string} filename - The name of the HTML file to read from public directory
 * @returns {string} The contents of the HTML file as a string
 *
 * @example
 * const htmlContent = readHtmlFile('health.html');
 */
export function readHtmlFile(filename: string): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const basePath = process.cwd();

  // Determine path based on environment
  const primaryPath = isDev
    ? resolve(basePath, `src/public/${filename}`)
    : resolve(basePath, `dist/public/${filename}`);

  // Fallback path if primary doesn't exist
  const fallbackPath = resolve(basePath, `src/public/${filename}`);

  // Check if file exists before trying to read it
  if (existsSync(primaryPath)) {
    try {
      return readFileSync(primaryPath, 'utf-8');
    } catch (error) {
      logger.warn(`Error reading ${filename} from ${primaryPath}:`, error);
    }
  } else {
    logger.warn(`File ${filename} not found at ${primaryPath}, trying fallback`);
  }

  // Try fallback path if different from primary
  if (fallbackPath !== primaryPath && existsSync(fallbackPath)) {
    try {
      return readFileSync(fallbackPath, 'utf-8');
    } catch (error) {
      logger.warn(`Error reading ${filename} from fallback path:`, error);
    }
  }

  // Last resort - return a simple HTML page
  logger.warn(`Could not find ${filename}, using default template`);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SNS Discord Forwarder - ${filename}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .status { padding: 20px; background: #f4f4f4; border-left: 4px solid #5cb85c; }
  </style>
</head>
<body>
  <h1>SNS Discord Forwarder</h1>
  <div class="status">
    <h2>Service is running</h2>
    <p>The requested file "${filename}" could not be found.</p>
  </div>
</body>
</html>`;
}

/**
 * Extracts timestamps from a log string
 *
 * @param {string} log - The log string to extract timestamps from
 * @returns {Object} An object containing the start, end, and duration of the scan
 *
 * @example
 * const timestamps = extractScanTimestamps('Start date is 2023-01-01 12:00:00 UTC, End date is 2023-01-01 12:01:00 UTC');
 * console.log(timestamps); // { start: '2023-01-01 12:00:00 UTC', end: '2023-01-01 12:01:00 UTC', duration: '1 min' }
 */
export function extractScanTimestamps(log: string): {
  start?: string;
  end?: string;
  duration?: string;
} {
  const startMatch = log.match(/Start date is (.+)/);
  const endMatch = log.match(/End date is (.+)/);

  if (!startMatch || !endMatch) return {};

  try {
    const format = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
      hour12: true,
    });

    const start = new Date(startMatch[1] + ' UTC');
    const end = new Date(endMatch[1] + ' UTC');
    const durationSec = Math.round((end.getTime() - start.getTime()) / 1000);
    const durationFormatted =
      durationSec < 60
        ? `${durationSec} sec`
        : `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;

    return {
      start: start.toUTCString(),
      end: end.toUTCString(),
      duration: durationFormatted,
    };
  } catch (err) {
    return {};
  }
}
