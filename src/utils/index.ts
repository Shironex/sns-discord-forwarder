import { readFileSync } from 'fs';
import { resolve } from 'path';

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
 * Reads an HTML file from the filesystem with fallbacks for different environments
 *
 * @param {string} filename - The name of the HTML file to read from public directory
 * @returns {string} The contents of the HTML file as a string
 *
 * @throws {Error} Doesn't throw errors, but logs warnings if file isn't found
 *
 * @example
 * const htmlContent = readHtmlFile('health.html');
 */
export function readHtmlFile(filename: string): string {
  // Try production path first
  const prodPath = resolve(process.cwd(), `dist/public/${filename}`);
  try {
    return readFileSync(prodPath, 'utf-8');
  } catch (error) {
    // Fallback for development environment
    const devPath = resolve(process.cwd(), `src/public/${filename}`);
    try {
      return readFileSync(devPath, 'utf-8');
    } catch (error) {
      console.warn(`HTML template ${filename} not found, using fallback.`);
      return `<html><body><h1>${filename}</h1><p>Service is running.</p></body></html>`;
    }
  }
}
