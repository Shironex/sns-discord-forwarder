/**
 * Utility Functions Module
 *
 * This module contains various utility functions used throughout the application:
 * - Time formatting for uptime display
 * - HTML file reading with environment-specific paths
 * - Timestamp extraction from log files
 * - RKHunter log parsing for Discord embeds
 */

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
/**
 * Converts seconds into a human-readable time format (e.g., "2 days, 3 hours, 45 min")
 *
 * Used primarily for displaying application uptime in the health check endpoint.
 * The function progressively breaks down time from largest to smallest unit.
 *
 * @param seconds - Total number of seconds to format
 * @returns Formatted string showing days, hours, and minutes
 */
export function formatUptime(seconds: number): string {
  // Calculate time components by successively dividing and taking remainders
  const days = Math.floor(seconds / 86400); // 86400 seconds = 1 day
  const hours = Math.floor((seconds % 86400) / 3600); // 3600 seconds = 1 hour
  const minutes = Math.floor((seconds % 3600) / 60); // 60 seconds = 1 minute

  // Build the result string progressively
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
/**
 * Reads HTML files with intelligent path resolution for different environments
 *
 * This function handles the complexity of finding static files in both development
 * and production environments. It tries multiple fallback strategies before
 * providing a default template.
 *
 * Path resolution strategy:
 * 1. Try environment-specific path (src/ for dev, dist/ for prod)
 * 2. Try fallback path (src/ as fallback)
 * 3. Return default HTML template if all else fails
 *
 * @param filename - Name of the HTML file to read (e.g., 'health.html')
 * @returns Complete HTML content as string
 */
export function readHtmlFile(filename: string): string {
  // Determine if we're in development mode
  const isDev = process.env.NODE_ENV !== 'production';
  const basePath = process.cwd();

  // Path resolution: different directories for dev vs production builds
  // Dev: source files in src/public/, Prod: built files in dist/public/
  const primaryPath = isDev
    ? resolve(basePath, `src/public/${filename}`)
    : resolve(basePath, `dist/public/${filename}`);

  // Always try source path as fallback (works for both environments)
  const fallbackPath = resolve(basePath, `src/public/${filename}`);

  // Strategy 1: Try the primary environment-specific path
  if (existsSync(primaryPath)) {
    try {
      return readFileSync(primaryPath, 'utf-8');
    } catch (error) {
      logger.warn(`Error reading ${filename} from ${primaryPath}:`, error);
    }
  } else {
    logger.warn(`File ${filename} not found at ${primaryPath}, trying fallback`);
  }

  // Strategy 2: Try fallback path if different from primary
  if (fallbackPath !== primaryPath && existsSync(fallbackPath)) {
    try {
      return readFileSync(fallbackPath, 'utf-8');
    } catch (error) {
      logger.warn(`Error reading ${filename} from fallback path:`, error);
    }
  }

  // Strategy 3: Last resort - return a default HTML template
  logger.warn(`Could not find ${filename}, using default template`);
  // Return a minimal HTML fallback template with basic styling
  // This ensures the health endpoint always returns valid HTML even if files are missing
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
/**
 * Extracts and formats scan timing information from RKHunter log content
 *
 * This function parses log timestamps and calculates scan duration, which is
 * useful for performance monitoring and scan analytics.
 *
 * @param log - Raw RKHunter log content as string
 * @returns Object containing start time, end time, and formatted duration
 */
export function extractScanTimestamps(log: string): {
  start?: string;
  end?: string;
  duration?: string;
} {
  // Extract start and end timestamps using regex patterns
  const startMatch = log.match(/Start date is (.+)/);
  const endMatch = log.match(/End date is (.+)/);

  // Return empty object if timestamps not found
  if (!startMatch || !endMatch) return {};

  try {
    // Parse timestamps and assume UTC timezone (common in server logs)
    const start = new Date(startMatch[1] + ' UTC');
    const end = new Date(endMatch[1] + ' UTC');

    // Calculate duration in seconds
    const durationSec = Math.round((end.getTime() - start.getTime()) / 1000);

    // Format duration as either seconds or minutes + seconds
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
/**
 * Comprehensive RKHunter log parser for Discord embed fields
 *
 * This function analyzes RKHunter security scan logs and extracts key information
 * into structured fields suitable for Discord embeds. It identifies warnings,
 * errors, system information, and security findings.
 *
 * The parser looks for various patterns in the log file including:
 * - Warning and error counts
 * - System information (hostname, OS, version)
 * - Security findings (rootkits, suspicious files, permissions)
 * - Scan metadata (timestamps, configuration)
 *
 * @param logContent - Complete RKHunter log file content
 * @returns Array of Discord embed fields with security scan data
 */
export function parseRkhunterLogFields(
  logContent: string,
): Array<{ name: string; value: string; inline?: boolean }> {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  // Section 1: Basic scan statistics - warnings and errors
  // These provide the overall health status of the security scan
  const warningLines = logContent
    .split('\n')
    .filter((line) => line.match(/\[\s*Warning\s*\]/i) || line.toLowerCase().includes('warning'));

  const errorLines = logContent.split('\n').filter((line) => line.match(/\[\s*Error\s*\]/i));

  // Add warning and error counts as the first fields (most important metrics)
  fields.push(
    { name: 'Warnings', value: `${warningLines.length}`, inline: true },
    { name: 'Errors', value: `${errorLines.length}`, inline: true },
  );

  // Section 2: System identification information
  // Extract hostname from scan header
  const hostnameMatch = logContent.match(/Rootkit Hunter.*on\s+(.+)/i);
  if (hostnameMatch) {
    fields.push({ name: 'Hostname', value: hostnameMatch[1].trim(), inline: true });
  }

  // Extract operating system information
  const osMatch = logContent.match(/Found O\/S name: (.+)/);
  if (osMatch) {
    fields.push({ name: 'OS', value: osMatch[1].trim(), inline: true });
  }

  // Extract detected OS type (more specific than general OS name)
  const detectedOsMatch = logContent.match(/Detected operating system is\s+'(.+)'/);
  if (detectedOsMatch) {
    fields.push({ name: 'OS Type', value: detectedOsMatch[1].trim(), inline: true });
  }

  // Extract RKHunter scanner version for compatibility tracking
  const versionMatch = logContent.match(/Rootkit Hunter version\s+([0-9.]+)/i);
  if (versionMatch) {
    fields.push({ name: 'Version', value: versionMatch[1], inline: true });
  }

  // Section 3: Configuration and scan metadata
  // Extract configuration file path for troubleshooting
  const configFileMatch = logContent.match(/Using configuration file\s+'(.+)'/);
  if (configFileMatch) {
    fields.push({ name: 'Config File', value: configFileMatch[1].trim(), inline: false });
  }

  // Extract email notification settings (if configured)
  const emailMatch = logContent.match(/Emailing warnings to\s+'(.+)'\s+using/);
  if (emailMatch) {
    fields.push({ name: 'Email Notifications', value: emailMatch[1].trim(), inline: false });
  }

  // Extract database directory path (where RKHunter stores its data)
  const dbDirMatch = logContent.match(/Using\s+'(.+)'\s+as the database directory/);
  if (dbDirMatch) {
    fields.push({ name: 'Database Dir', value: dbDirMatch[1].trim(), inline: false });
  }

  // Section 4: Scan timing information
  // Extract and format scan start time, end time, and duration
  const { start, end, duration } = extractScanTimestamps(logContent);

  if (start && end && duration) {
    fields.push(
      { name: 'Started At', value: start, inline: false },
      { name: 'Ended At', value: end, inline: false },
      { name: 'Duration', value: duration, inline: true },
    );
  }

  // Section 5: Critical security findings
  // Extract potential rootkit detections (most serious alerts)
  const rootkitLines = logContent
    .split('\n')
    .filter(
      (line) => line.toLowerCase().includes('rootkit') && line.toLowerCase().includes('possible'),
    );

  if (rootkitLines.length) {
    fields.push({
      name: 'Rootkits',
      value: rootkitLines.slice(0, 5).join('\n').slice(0, 1024), // Limit to 5 lines and 1024 chars
      inline: false,
    });
  }

  // Extract files that have been changed since last scan (potential compromise indicator)
  const changedFiles = logContent
    .split('\n')
    .filter((line) => line.includes('File:') && line.toLowerCase().includes('changed'));

  if (changedFiles.length) {
    fields.push({
      name: 'Changed Files',
      value: changedFiles.slice(0, 5).join('\n').slice(0, 1024), // Limit for Discord embed
      inline: false,
    });
  }

  // Extract suspicious SUID/SGID files (security risk - elevated privileges)
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

  // Extract hidden files and directories (potential malware hiding spots)
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

  // Extract files owned by root (UID 0) - important for privilege escalation detection
  const uidLines = logContent.split('\n').filter((line) => line.includes('UID 0'));

  if (uidLines.length) {
    fields.push({
      name: 'UID 0 entries',
      value: uidLines.slice(0, 5).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  // Extract suspicious network connections or ports (potential backdoors)
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

  // Section 6: Scan configuration details
  // Extract which security tests were enabled during the scan
  const enabledTestsMatch = logContent.match(/Enabled tests are:\s+(.+)/);
  if (enabledTestsMatch) {
    fields.push({ name: 'Enabled Tests', value: enabledTestsMatch[1].trim(), inline: false });
  }

  // Extract which tests were disabled (shortened for brevity)
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

  // Discord embed limitation: maximum 25 fields
  // Truncate if we have too many fields to prevent Discord API errors
  if (fields.length > 25) {
    fields.splice(25);
  }

  return fields;
}
