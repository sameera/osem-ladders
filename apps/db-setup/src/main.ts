#!/usr/bin/env node

/**
 * DynamoDB Setup CLI
 *
 * CLI tool for creating, verifying, and managing DynamoDB tables
 * for the OSEM Ladders organizational assessment platform.
 */

import { Command } from 'commander';
import * as logger from './utils/logger.js';
import { DEFAULT_ENVIRONMENT, getValidEnvironments } from './config/environments.js';
import { setupCommand } from './commands/setup.js';

const program = new Command();

// ============================================================================
// CLI Configuration
// ============================================================================

program
  .name('db-setup')
  .description('DynamoDB table setup and management CLI for OSEM Ladders')
  .version('1.0.0');

// ============================================================================
// Global Options
// ============================================================================

program
  .option(
    '-e, --env <environment>',
    `Environment (${getValidEnvironments().join(', ')})`,
    DEFAULT_ENVIRONMENT
  )
  .option('-r, --region <region>', 'AWS region (overrides AWS_REGION env var)')
  .option('--endpoint <url>', 'Custom DynamoDB endpoint (for DynamoDB Local)')
  .option('-v, --verbose', 'Enable verbose logging', false);

// ============================================================================
// Command: create
// ============================================================================

program
  .command('create')
  .description('Create all DynamoDB tables for the specified environment')
  .option('--force', 'Delete existing tables and recreate (DESTRUCTIVE)', false)
  .option('--skip-wait', 'Skip waiting for tables to become active', false)
  .action(async (options) => {
    const globalOpts = program.opts();
    await setupCommand({
      env: globalOpts.env,
      region: globalOpts.region,
      endpoint: globalOpts.endpoint,
      verbose: globalOpts.verbose,
      force: options.force,
      skipWait: options.skipWait,
    });
  });

// ============================================================================
// Command: verify
// ============================================================================

program
  .command('verify')
  .description('Verify that all tables exist and have correct schemas')
  .option('--fix', 'Attempt to fix schema mismatches (create missing tables)', false)
  .action(async (options) => {
    logger.header('Verify DynamoDB Tables');
    logger.warn('Command not yet implemented');
    logger.info(`Environment: ${program.opts().env}`);
    logger.info(`Fix: ${options.fix}`);
    // Implementation will be added in Phase 3
  });

// ============================================================================
// Command: delete
// ============================================================================

program
  .command('delete')
  .description('Delete all DynamoDB tables for the specified environment')
  .option('--yes', 'Skip confirmation prompt', false)
  .action(async (options) => {
    logger.header('Delete DynamoDB Tables');
    logger.warn('Command not yet implemented');
    logger.info(`Environment: ${program.opts().env}`);
    logger.info(`Skip confirmation: ${options.yes}`);
    // Implementation will be added in Phase 3
  });

// ============================================================================
// Command: list
// ============================================================================

program
  .command('list')
  .description('List all DynamoDB tables for the specified environment')
  .option('--details', 'Show detailed table information', false)
  .action(async (options) => {
    logger.header('List DynamoDB Tables');
    logger.warn('Command not yet implemented');
    logger.info(`Environment: ${program.opts().env}`);
    logger.info(`Show details: ${options.details}`);
    // Implementation will be added in Phase 3
  });

// ============================================================================
// Error Handling
// ============================================================================

program.configureOutput({
  writeErr: (str) => {
    // Suppress default error output, we'll handle it ourselves
    if (!str.includes('error: unknown command')) {
      process.stderr.write(str);
    }
  },
});

program.exitOverride((err) => {
  if (err.code === 'commander.unknownCommand') {
    logger.blank();
    logger.error(`Unknown command: ${err.message.split("'")[1]}`);
    logger.info('Run "db-setup --help" to see available commands');
    logger.blank();
    process.exit(1);
  }
  // Allow help to exit normally
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  throw err;
});

// ============================================================================
// Parse and Execute
// ============================================================================

// Show help if no command provided
if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);
