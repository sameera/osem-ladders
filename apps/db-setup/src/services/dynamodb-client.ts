/**
 * DynamoDB client initialization service
 *
 * Provides configured AWS SDK v3 clients for DynamoDB operations.
 * Uses modular imports for minimal bundle size.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Configuration options for DynamoDB client
 */
export interface DynamoDBClientConfig {
  region?: string; // AWS region (defaults to AWS_REGION env var)
  endpoint?: string; // Custom endpoint (e.g., for DynamoDB Local)
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Initialize and return a DynamoDB client
 *
 * @param config - Optional configuration for the client
 * @returns Configured DynamoDBClient instance
 */
export function createDynamoDBClient(
  config?: DynamoDBClientConfig
): DynamoDBClient {
  const clientConfig: {
    region?: string;
    endpoint?: string;
    credentials?: { accessKeyId: string; secretAccessKey: string };
  } = {
    region: config?.region || process.env.AWS_REGION || 'us-east-1',
  };

  // Add custom endpoint if provided (for DynamoDB Local)
  if (config?.endpoint) {
    clientConfig.endpoint = config.endpoint;
  }

  // Add explicit credentials if provided (for testing)
  if (config?.credentials) {
    clientConfig.credentials = config.credentials;
  }

  return new DynamoDBClient(clientConfig);
}

/**
 * Initialize and return a DynamoDB Document Client
 *
 * The Document Client provides a higher-level API that automatically
 * marshalls/unmarshalls JavaScript types to DynamoDB AttributeValues.
 *
 * @param config - Optional configuration for the client
 * @returns Configured DynamoDBDocumentClient instance
 */
export function createDocumentClient(
  config?: DynamoDBClientConfig
): DynamoDBDocumentClient {
  const client = createDynamoDBClient(config);

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      // Convert empty strings to null (DynamoDB doesn't support empty strings)
      convertEmptyValues: false,
      // Remove undefined values from objects
      removeUndefinedValues: true,
      // Convert JS class instances to maps
      convertClassInstanceToMap: false,
    },
    unmarshallOptions: {
      // Return numbers as JavaScript numbers (not strings)
      wrapNumbers: false,
    },
  });
}
