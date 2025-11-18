import type { APIGatewayProxyHandler } from 'aws-lambda';
import { successResponse } from '../utils/lambda-response.js';
import { TableNames } from '../utils/dynamodb-client.js';

/**
 * Health check handler
 * Returns service status and configuration info
 */
export const handler: APIGatewayProxyHandler = async () => {
  const response = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '0.0.0',
    environment: process.env.ENV || 'dev',
    tables: TableNames
  };

  return successResponse(response);
};
