/**
 * Vitest test setup
 * Configures AWS SDK mocks and environment variables for testing
 */

import { beforeAll, afterEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Mock DynamoDB Document Client
 * This will be used across all tests
 */
export const ddbMock = mockClient(DynamoDBDocumentClient);

/**
 * Setup test environment
 */
beforeAll(() => {
  // Set required environment variables
  process.env.USERS_TABLE_NAME = 'osem-test-Users';
  process.env.AWS_REGION = 'us-east-1';
});

/**
 * Reset mocks after each test
 */
afterEach(() => {
  ddbMock.reset();
});
