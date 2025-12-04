import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB client configuration
 */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * DynamoDB Document Client with marshalling/unmarshalling
 */
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  },
  unmarshallOptions: {
    wrapNumbers: false
  }
});

/**
 * Get app name from environment or use default
 */
const APP_NAME = process.env.APP_NAME || 'osem';

/**
 * Get environment from environment or use default
 */
const ENV = process.env.ENV || 'dev';

/**
 * Generate table name with app and environment prefix
 */
function getTableName(baseName: string): string {
  return `${APP_NAME}-${ENV}-${baseName}`;
}

/**
 * Table names with app-env prefix
 */
export const TableNames = {
  Users: getTableName('Users'),
  Teams: getTableName('Teams'),
  AssessmentPlans: getTableName('AssessmentPlans'),
  AssessmentReports: getTableName('AssessmentReports')
} as const;
