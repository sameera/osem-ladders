/**
 * Setup command handler
 *
 * Creates all 6 DynamoDB tables for the OSEM Ladders platform.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import * as logger from '../utils/logger.js';
import { handleError, handleErrorAndExit } from '../utils/error-handler.js';
import { validateCredentials } from '../services/credential-validator.js';
import { createDynamoDBClient } from '../services/dynamodb-client.js';
import { createTables, TableCreationResult } from '../services/table-creator.js';
import { waitForTablesActive } from '../utils/table-waiter.js';
import { getAllTableSchemas } from '../config/table-schemas.js';
import { getEnvironmentConfig } from '../config/environments.js';
import ora from 'ora';

/**
 * Options for setup command
 */
export interface SetupOptions {
  env: string; // Environment name (dev, staging, prod, local)
  region?: string; // AWS region (optional)
  endpoint?: string; // Custom endpoint for DynamoDB Local
  force?: boolean; // Force recreate tables (DESTRUCTIVE)
  skipWait?: boolean; // Skip waiting for tables to become active
  verbose?: boolean; // Enable verbose logging
}

/**
 * Exit codes for setup command
 */
export enum SetupExitCode {
  SUCCESS = 0, // All tables created successfully
  ERROR = 1, // Fatal error (credentials, permissions, network)
  PARTIAL = 2, // Some tables created, some failed
}

/**
 * Execute the setup command
 *
 * Creates all 6 DynamoDB tables for the specified environment.
 * Performs credential validation before attempting table creation.
 *
 * @param options - Setup command options
 * @returns Exit code (0 = success, 1 = error, 2 = partial success)
 */
export async function executeSetup(options: SetupOptions): Promise<number> {
  const startTime = Date.now();

  // Print header
  logger.header('Create DynamoDB Tables');
  logger.blank();

  // Validate and get environment config
  let envConfig;
  try {
    envConfig = getEnvironmentConfig(options.env);
    logger.info(`Environment: ${envConfig.description} (${envConfig.name})`);
    if (options.region) {
      logger.info(`Region: ${options.region}`);
    }
    if (options.endpoint) {
      logger.info(`Endpoint: ${options.endpoint}`);
    }
    logger.blank();
  } catch (error) {
    handleError(error, 'Invalid environment configuration');
    return SetupExitCode.ERROR;
  }

  // Step 1: Validate AWS credentials
  const credentialSpinner = ora('Validating AWS credentials...').start();
  try {
    const identity = await validateCredentials({
      region: options.region || envConfig.region,
    });
    credentialSpinner.succeed('AWS credentials validated');
    logger.awsAccount(identity.account, identity.arn);
    logger.blank();
  } catch (error) {
    credentialSpinner.fail('AWS credential validation failed');
    handleError(error, 'Failed to validate AWS credentials');
    return SetupExitCode.ERROR;
  }

  // Step 2: Initialize DynamoDB client
  const client: DynamoDBClient = createDynamoDBClient({
    region: options.region || envConfig.region,
    endpoint: options.endpoint || envConfig.endpoint,
  });

  // Step 3: Get all table schemas for the environment
  const tableSchemas = getAllTableSchemas(envConfig.name);
  logger.info(`Creating ${tableSchemas.length} DynamoDB tables...`);
  logger.blank();

  // Step 4: Create tables with progress feedback
  const results: TableCreationResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const schema of tableSchemas) {
    const tableName = schema.TableName!;
    const tableSpinner = ora(`Creating table: ${tableName}`).start();

    try {
      const result = await createTables(client, [schema], options.verbose);
      const tableResult = result[0];
      results.push(tableResult);

      if (tableResult.created) {
        tableSpinner.succeed(`Created table: ${tableName}`);
        successCount++;
      } else {
        tableSpinner.info(`Table already exists: ${tableName} (status: ${tableResult.status})`);
        skippedCount++;
      }
    } catch (error) {
      tableSpinner.fail(`Failed to create table: ${tableName}`);
      errorCount++;

      if (options.verbose && error instanceof Error) {
        logger.step(`Error: ${error.message}`);
      }

      // Continue creating other tables even if one fails
      continue;
    }
  }

  logger.blank();

  // Step 5: Wait for tables to become active (unless skipped)
  if (!options.skipWait && successCount > 0) {
    logger.info('Waiting for tables to become active...');
    logger.blank();

    const tablesToWait = results
      .filter((r) => r.created)
      .map((r) => r.tableName);

    try {
      await waitForTablesActive(client, tablesToWait);
      logger.blank();
    } catch (error) {
      logger.blank();
      logger.warn('Some tables did not become active within timeout period');
      if (options.verbose && error instanceof Error) {
        logger.step(`Error: ${error.message}`);
      }
      logger.blank();
    }
  }

  // Step 6: Print summary
  logger.header('Setup Summary');
  logger.blank();
  logger.success(`Tables created: ${successCount}`);
  if (skippedCount > 0) {
    logger.info(`Tables skipped (already exist): ${skippedCount}`);
  }
  if (errorCount > 0) {
    logger.error(`Tables failed: ${errorCount}`);
  }
  logger.blank();

  const duration = Date.now() - startTime;
  logger.duration('Total time', duration);
  logger.blank();

  // Step 7: Determine exit code
  if (errorCount > 0 && successCount === 0) {
    logger.error('Setup failed - no tables were created');
    return SetupExitCode.ERROR;
  } else if (errorCount > 0) {
    logger.warn('Setup completed with errors - some tables were not created');
    return SetupExitCode.PARTIAL;
  } else {
    logger.success('Setup completed successfully');
    return SetupExitCode.SUCCESS;
  }
}

/**
 * Setup command handler wrapper with error handling
 *
 * This is the main entry point called by Commander.
 *
 * @param options - Setup command options
 */
export async function setupCommand(options: SetupOptions): Promise<void> {
  try {
    const exitCode = await executeSetup(options);
    process.exit(exitCode);
  } catch (error) {
    handleErrorAndExit(error, 'Setup command failed');
  }
}
