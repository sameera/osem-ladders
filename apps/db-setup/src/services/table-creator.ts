/**
 * Table creator service for DynamoDB
 *
 * Handles table creation with idempotency checks and error handling.
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  CreateTableCommandInput,
} from '@aws-sdk/client-dynamodb';
import * as logger from '../utils/logger.js';

/**
 * Result of table creation operation
 */
export interface TableCreationResult {
  tableName: string;
  created: boolean; // true if created, false if already existed
  status: string; // Table status (CREATING, ACTIVE, etc.)
}

/**
 * Check if a table exists by attempting to describe it
 *
 * @param client - DynamoDB client
 * @param tableName - Name of the table to check
 * @returns true if table exists, false otherwise
 */
export async function tableExists(
  client: DynamoDBClient,
  tableName: string
): Promise<boolean> {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    await client.send(command);
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return false;
    }
    // Re-throw other errors (permissions, network, etc.)
    throw error;
  }
}

/**
 * Get table status by describing it
 *
 * @param client - DynamoDB client
 * @param tableName - Name of the table
 * @returns Table status string (CREATING, ACTIVE, DELETING, UPDATING)
 * @throws Error if table does not exist or describe fails
 */
export async function getTableStatus(
  client: DynamoDBClient,
  tableName: string
): Promise<string> {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await client.send(command);
    return response.Table?.TableStatus || 'UNKNOWN';
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      throw new Error(`Table ${tableName} does not exist`);
    }
    throw error;
  }
}

/**
 * Create a single DynamoDB table with idempotency
 *
 * This function implements idempotency by checking if the table already exists
 * before attempting to create it. If the table exists, it returns successfully
 * without attempting to recreate it.
 *
 * @param client - DynamoDB client
 * @param tableSchema - CreateTable input schema
 * @param verbose - Enable verbose logging
 * @returns TableCreationResult with creation details
 * @throws Error if table creation fails
 */
export async function createTable(
  client: DynamoDBClient,
  tableSchema: CreateTableCommandInput,
  verbose = false
): Promise<TableCreationResult> {
  const tableName = tableSchema.TableName!;

  if (verbose) {
    logger.debug(`Checking if table ${tableName} exists...`, true);
  }

  // Check if table already exists (idempotency)
  const exists = await tableExists(client, tableName);

  if (exists) {
    const status = await getTableStatus(client, tableName);
    if (verbose) {
      logger.debug(`Table ${tableName} already exists with status: ${status}`, true);
    }
    return {
      tableName,
      created: false,
      status,
    };
  }

  // Table doesn't exist, create it
  if (verbose) {
    logger.debug(`Creating table ${tableName}...`, true);
  }

  try {
    const command = new CreateTableCommand(tableSchema);
    const response = await client.send(command);

    return {
      tableName,
      created: true,
      status: response.TableDescription?.TableStatus || 'CREATING',
    };
  } catch (error) {
    // Enhance error message with table name
    if (error instanceof Error) {
      throw new Error(`Failed to create table ${tableName}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create multiple tables sequentially with idempotency
 *
 * Creates tables one at a time to avoid overwhelming the API and to provide
 * clear progress feedback. Each table creation is idempotent.
 *
 * @param client - DynamoDB client
 * @param tableSchemas - Array of CreateTable input schemas
 * @param verbose - Enable verbose logging
 * @returns Array of TableCreationResult for each table
 * @throws Error if any table creation fails
 */
export async function createTables(
  client: DynamoDBClient,
  tableSchemas: CreateTableCommandInput[],
  verbose = false
): Promise<TableCreationResult[]> {
  const results: TableCreationResult[] = [];

  for (const schema of tableSchemas) {
    const result = await createTable(client, schema, verbose);
    results.push(result);
  }

  return results;
}

/**
 * Create multiple tables concurrently with idempotency
 *
 * Creates all tables in parallel for faster execution. Use with caution
 * as this may hit API rate limits for large numbers of tables.
 *
 * @param client - DynamoDB client
 * @param tableSchemas - Array of CreateTable input schemas
 * @param verbose - Enable verbose logging
 * @returns Array of TableCreationResult for each table
 * @throws Error if any table creation fails
 */
export async function createTablesConcurrently(
  client: DynamoDBClient,
  tableSchemas: CreateTableCommandInput[],
  verbose = false
): Promise<TableCreationResult[]> {
  return Promise.all(
    tableSchemas.map((schema) => createTable(client, schema, verbose))
  );
}
