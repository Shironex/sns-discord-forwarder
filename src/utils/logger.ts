import chalk from 'chalk';

/**
 * Logger utility for consistent console logging with colored output
 * 
 * @namespace logger
 */
export const logger = {
  /**
   * Logs informational messages in green
   * 
   * @param {...unknown} args - Arguments to log
   */
  info: (...args: unknown[]) => {
    console.log(chalk.green('[INFO]'), ...args);
  },
  
  /**
   * Logs warning messages in yellow
   * 
   * @param {...unknown} args - Arguments to log
   */
  warn: (...args: unknown[]) => {
    console.warn(chalk.yellow('[WARN]'), ...args);
  },
  
  /**
   * Logs error messages in red
   * 
   * @param {...unknown} args - Arguments to log
   */
  error: (...args: unknown[]) => {
    console.error(chalk.red('[ERROR]'), ...args);
  },
  
  /**
   * Logs debug messages in cyan when DEBUG environment variable is set to 'true'
   * 
   * @param {...unknown} args - Arguments to log
   */
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG === 'true') {
      console.log(chalk.cyan('[DEBUG]'), ...args);
    }
  },
};
