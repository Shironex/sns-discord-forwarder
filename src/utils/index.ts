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
    logger.error('Error extracting scan timestamps:', err);
    return {};
  }
}

/**
 * Parses an rkhunter log file and extracts fields for Discord embed
 *
 * @param {string} logContent - The content of the rkhunter log file
 * @returns {Array<{name: string, value: string, inline?: boolean}>} An array of field objects for Discord embed
 *
 * @example
 * const fields = parseRkhunterLogFields(logContent);
 * await sendToDiscord('RKHunter Scan Results', { fields });
 */
export function parseRkhunterLogFields(
  logContent: string,
): Array<{ name: string; value: string; inline?: boolean }> {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  // Extract warning and error counts
  const warningLines = logContent
    .split('\n')
    .filter((line) => line.match(/\[\s*Warning\s*\]/i) || line.toLowerCase().includes('warning'));

  const errorLines = logContent.split('\n').filter((line) => line.match(/\[\s*Error\s*\]/i));

  fields.push(
    { name: 'Warnings', value: `${warningLines.length}`, inline: true },
    { name: 'Errors', value: `${errorLines.length}`, inline: true },
  );

  // Extract hostname
  const hostnameMatch = logContent.match(/Rootkit Hunter.*on\s+(.+)/i);
  if (hostnameMatch) {
    fields.push({ name: 'Hostname', value: hostnameMatch[1].trim(), inline: true });
  }

  // Extract OS information
  const osMatch = logContent.match(/Found O\/S name: (.+)/);
  if (osMatch) {
    fields.push({ name: 'OS', value: osMatch[1].trim(), inline: true });
  }

  // Extract detected OS
  const detectedOsMatch = logContent.match(/Detected operating system is\s+'(.+)'/);
  if (detectedOsMatch) {
    fields.push({ name: 'OS Type', value: detectedOsMatch[1].trim(), inline: true });
  }

  // Extract RKHunter version
  const versionMatch = logContent.match(/Rootkit Hunter version\s+([0-9.]+)/i);
  if (versionMatch) {
    fields.push({ name: 'Version', value: versionMatch[1], inline: true });
  }

  // Extract configuration file
  const configFileMatch = logContent.match(/Using configuration file\s+'(.+)'/);
  if (configFileMatch) {
    fields.push({ name: 'Config File', value: configFileMatch[1].trim(), inline: false });
  }

  // Extract email notification
  const emailMatch = logContent.match(/Emailing warnings to\s+'(.+)'\s+using/);
  if (emailMatch) {
    fields.push({ name: 'Email Notifications', value: emailMatch[1].trim(), inline: false });
  }

  // Extract database directory
  const dbDirMatch = logContent.match(/Using\s+'(.+)'\s+as the database directory/);
  if (dbDirMatch) {
    fields.push({ name: 'Database Dir', value: dbDirMatch[1].trim(), inline: false });
  }

  // Extract timestamps
  const { start, end, duration } = extractScanTimestamps(logContent);

  if (start && end && duration) {
    fields.push(
      { name: 'Started At', value: start, inline: false },
      { name: 'Ended At', value: end, inline: false },
      { name: 'Duration', value: duration, inline: true },
    );
  }

  // Extract rootkits
  const rootkitLines = logContent
    .split('\n')
    .filter(
      (line) => line.toLowerCase().includes('rootkit') && line.toLowerCase().includes('possible'),
    );

  if (rootkitLines.length) {
    fields.push({
      name: 'Rootkits',
      value: rootkitLines.slice(0, 5).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  // Extract changed files
  const changedFiles = logContent
    .split('\n')
    .filter((line) => line.includes('File:') && line.toLowerCase().includes('changed'));

  if (changedFiles.length) {
    fields.push({
      name: 'Changed Files',
      value: changedFiles.slice(0, 5).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  // Extract suspicious SUID/SGID
  const suidSgidLines = logContent
    .split('\n')
    .filter((line) => line.includes('[ Warning ]') && /suid|sgid/i.test(line));

  if (suidSgidLines.length) {
    fields.push({
      name: 'Suspicious SUID/SGID',
      value: suidSgidLines.slice(0, 5).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  // Extract hidden files/directories
  const hiddenLines = logContent
    .split('\n')
    .filter((line) => line.includes('[ Warning ]') && /hidden file|hidden directory/i.test(line));

  if (hiddenLines.length) {
    fields.push({
      name: 'Hidden Files/Dirs',
      value: hiddenLines.slice(0, 5).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  // Extract UID 0 entries
  const uidLines = logContent.split('\n').filter((line) => line.includes('UID 0'));

  if (uidLines.length) {
    fields.push({
      name: 'UID 0 entries',
      value: uidLines.slice(0, 5).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  // Extract suspicious network connections or ports
  const networkLines = logContent
    .split('\n')
    .filter(
      (line) =>
        (line.includes('[ Warning ]') || line.includes('[ Error ]')) &&
        /port|connect|listen|network/i.test(line),
    );

  if (networkLines.length) {
    fields.push({
      name: 'Suspicious Network',
      value: networkLines.slice(0, 5).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  // Enabled tests
  const enabledTestsMatch = logContent.match(/Enabled tests are:\s+(.+)/);
  if (enabledTestsMatch) {
    fields.push({ name: 'Enabled Tests', value: enabledTestsMatch[1].trim(), inline: false });
  }

  // Disabled tests (shortened)
  const disabledTestsMatch = logContent.match(/Disabled tests are:\s+(.+)/);
  if (disabledTestsMatch) {
    const disabledTests = disabledTestsMatch[1].trim();
    const shortenedTests = disabledTests.split(/\s+/).slice(0, 10).join(', ');
    fields.push({
      name: 'Disabled Tests',
      value: shortenedTests + (disabledTests.split(/\s+/).length > 10 ? '...' : ''),
      inline: false,
    });
  }

  // Limit fields to 25 needed for Discord embed
  if (fields.length > 25) {
    fields.splice(25);
  }

  return fields;
}
