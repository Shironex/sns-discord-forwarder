import chalk from 'chalk';

export const logger = {
  info: (...args: unknown[]) => {
    console.log(chalk.green('[INFO]'), ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(chalk.yellow('[WARN]'), ...args);
  },
  error: (...args: unknown[]) => {
    console.error(chalk.red('[ERROR]'), ...args);
  },
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG === 'true') {
      console.log(chalk.cyan('[DEBUG]'), ...args);
    }
  },
};
