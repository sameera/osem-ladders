/**
 * Table waiter utility for DynamoDB table status polling
 *
 * Wraps AWS SDK waiters for table creation/deletion with progress feedback.
 */

import { DynamoDBClient, waitUntilTableExists, waitUntilTableNotExists } from '@aws-sdk/client-dynamodb';
import ora, { Ora } from 'ora';

// Waiter result types from AWS SDK
interface WaiterResult {
  state: WaiterState;
  reason?: unknown;
}

enum WaiterState {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  TIMEOUT = 'TIMEOUT',
  RETRY = 'RETRY',
  ABORTED = 'ABORTED',
}

/**
 * Wait configuration options
 */
export interface WaitConfig {
  maxWaitTime?: number; // Maximum wait time in seconds (default: 300 = 5 minutes)
  minDelay?: number; // Minimum delay between checks in seconds (default: 2)
  maxDelay?: number; // Maximum delay between checks in seconds (default: 10)
  showSpinner?: boolean; // Show ora spinner (default: true)
}

/**
 * Wait for a DynamoDB table to become active
 *
 * Uses AWS SDK waiter to poll table status until it reaches ACTIVE state.
 *
 * @param client - DynamoDB client
 * @param tableName - Name of the table to wait for
 * @param config - Wait configuration options
 * @throws Error if table creation fails or timeout is reached
 */
export async function waitForTableActive(
  client: DynamoDBClient,
  tableName: string,
  config?: WaitConfig
): Promise<void> {
  const maxWaitTime = config?.maxWaitTime || 300; // 5 minutes default
  const minDelay = config?.minDelay || 2;
  const maxDelay = config?.maxDelay || 10;
  const showSpinner = config?.showSpinner !== false;

  let spinner: Ora | null = null;

  if (showSpinner) {
    spinner = ora(`Waiting for table ${tableName} to become active...`).start();
  }

  try {
    const result: WaiterResult = await waitUntilTableExists(
      {
        client,
        maxWaitTime,
        minDelay,
        maxDelay,
      },
      { TableName: tableName }
    );

    if (result.state === WaiterState.SUCCESS) {
      if (spinner) {
        spinner.succeed(`Table ${tableName} is now active`);
      }
    } else if (result.state === WaiterState.TIMEOUT) {
      if (spinner) {
        spinner.fail(`Timeout waiting for table ${tableName}`);
      }
      throw new Error(
        `Timeout waiting for table ${tableName} to become active after ${maxWaitTime}s`
      );
    } else {
      if (spinner) {
        spinner.fail(`Failed to wait for table ${tableName}`);
      }
      throw new Error(`Failed to wait for table ${tableName}: ${result.state}`);
    }
  } catch (error) {
    if (spinner) {
      spinner.fail(`Error waiting for table ${tableName}`);
    }
    throw error;
  }
}

/**
 * Wait for a DynamoDB table to be deleted
 *
 * Uses AWS SDK waiter to poll table status until it no longer exists.
 *
 * @param client - DynamoDB client
 * @param tableName - Name of the table to wait for deletion
 * @param config - Wait configuration options
 * @throws Error if table deletion fails or timeout is reached
 */
export async function waitForTableDeleted(
  client: DynamoDBClient,
  tableName: string,
  config?: WaitConfig
): Promise<void> {
  const maxWaitTime = config?.maxWaitTime || 300; // 5 minutes default
  const minDelay = config?.minDelay || 2;
  const maxDelay = config?.maxDelay || 10;
  const showSpinner = config?.showSpinner !== false;

  let spinner: Ora | null = null;

  if (showSpinner) {
    spinner = ora(`Waiting for table ${tableName} to be deleted...`).start();
  }

  try {
    const result: WaiterResult = await waitUntilTableNotExists(
      {
        client,
        maxWaitTime,
        minDelay,
        maxDelay,
      },
      { TableName: tableName }
    );

    if (result.state === WaiterState.SUCCESS) {
      if (spinner) {
        spinner.succeed(`Table ${tableName} has been deleted`);
      }
    } else if (result.state === WaiterState.TIMEOUT) {
      if (spinner) {
        spinner.fail(`Timeout waiting for table ${tableName} deletion`);
      }
      throw new Error(
        `Timeout waiting for table ${tableName} to be deleted after ${maxWaitTime}s`
      );
    } else {
      if (spinner) {
        spinner.fail(`Failed to wait for table ${tableName} deletion`);
      }
      throw new Error(`Failed to wait for table ${tableName} deletion: ${result.state}`);
    }
  } catch (error) {
    if (spinner) {
      spinner.fail(`Error waiting for table ${tableName} deletion`);
    }
    throw error;
  }
}

/**
 * Wait for multiple tables to become active concurrently
 *
 * @param client - DynamoDB client
 * @param tableNames - Array of table names to wait for
 * @param config - Wait configuration options
 * @throws Error if any table creation fails
 */
export async function waitForTablesActive(
  client: DynamoDBClient,
  tableNames: string[],
  config?: WaitConfig
): Promise<void> {
  await Promise.all(
    tableNames.map((tableName) => waitForTableActive(client, tableName, config))
  );
}

/**
 * Wait for multiple tables to be deleted concurrently
 *
 * @param client - DynamoDB client
 * @param tableNames - Array of table names to wait for deletion
 * @param config - Wait configuration options
 * @throws Error if any table deletion fails
 */
export async function waitForTablesDeleted(
  client: DynamoDBClient,
  tableNames: string[],
  config?: WaitConfig
): Promise<void> {
  await Promise.all(
    tableNames.map((tableName) => waitForTableDeleted(client, tableName, config))
  );
}
