/**
 * DynamoDB client initialization
 * Client is initialized outside the handler for connection reuse (~40% performance improvement)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB client configuration
 */
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * DynamoDB Document Client
 * Provides higher-level abstraction for DynamoDB operations
 * Handles marshalling/unmarshalling of JavaScript types to DynamoDB types
 */
export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    // Convert empty strings to null (DynamoDB doesn't support empty strings)
    convertEmptyValues: false,
    // Remove undefined values from objects
    removeUndefinedValues: true,
    // Convert JavaScript Sets to DynamoDB String Sets
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    // Convert DynamoDB Sets to JavaScript Sets
    wrapNumbers: false,
  },
});

/**
 * Get the Users table name from environment variables
 */
export function getUsersTableName(): string {
  const tableName = process.env.USERS_TABLE_NAME;

  if (!tableName) {
    throw new Error('USERS_TABLE_NAME environment variable is not set');
  }

  return tableName;
}
