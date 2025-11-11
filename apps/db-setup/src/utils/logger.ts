/**
 * Logger utility with colored console output
 *
 * Provides consistent, colorized logging for CLI operations.
 * Uses Chalk for terminal colors.
 */

import chalk from 'chalk';

/**
 * Log an informational message (blue)
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Log a success message (green)
 */
export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Log a warning message (yellow)
 */
export function warn(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Log an error message (red)
 */
export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

/**
 * Log a debug message (gray) - only shown in verbose mode
 */
export function debug(message: string, verbose = false): void {
  if (verbose) {
    console.log(chalk.gray('⚙'), message);
  }
}

/**
 * Log a section header (bold cyan)
 */
export function header(message: string): void {
  console.log('\n' + chalk.cyan.bold(message));
}

/**
 * Log a table name with environment prefix (magenta)
 */
export function tableName(name: string): void {
  console.log(chalk.magenta('  →'), chalk.bold(name));
}

/**
 * Log progress step (dim with arrow)
 */
export function step(message: string): void {
  console.log(chalk.dim('  ›'), message);
}

/**
 * Log a blank line for spacing
 */
export function blank(): void {
  console.log('');
}

/**
 * Log AWS account information (special formatting)
 */
export function awsAccount(account: string, arn: string): void {
  console.log(chalk.dim('  Account:'), chalk.white(account));
  console.log(chalk.dim('  ARN:'), chalk.white(arn));
}

/**
 * Log a JSON object with pretty formatting
 */
export function json(obj: unknown): void {
  console.log(chalk.dim(JSON.stringify(obj, null, 2)));
}

/**
 * Log operation duration
 */
export function duration(label: string, ms: number): void {
  const seconds = (ms / 1000).toFixed(2);
  console.log(chalk.dim(`  ${label}:`), chalk.white(`${seconds}s`));
}
