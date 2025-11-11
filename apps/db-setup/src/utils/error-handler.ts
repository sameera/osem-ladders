/**
 * Error handler utility with remediation guidance
 *
 * Provides user-friendly error messages with actionable remediation steps
 * for common AWS and DynamoDB errors.
 */

import * as logger from './logger.js';

/**
 * Error types with specific remediation guidance
 */
export enum ErrorType {
  CREDENTIALS_INVALID = 'CREDENTIALS_INVALID',
  CREDENTIALS_MISSING = 'CREDENTIALS_MISSING',
  REGION_INVALID = 'REGION_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TABLE_ALREADY_EXISTS = 'TABLE_ALREADY_EXISTS',
  TABLE_NOT_FOUND = 'TABLE_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error remediation message for each error type
 */
const REMEDIATION_MESSAGES: Record<ErrorType, string[]> = {
  [ErrorType.CREDENTIALS_INVALID]: [
    'Your AWS credentials are invalid or expired.',
    'Try these steps:',
    '  1. Run `aws configure` to set up credentials',
    '  2. Verify credentials with `aws sts get-caller-identity`',
    '  3. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables',
    '  4. Ensure your IAM user has not been deactivated',
  ],
  [ErrorType.CREDENTIALS_MISSING]: [
    'No AWS credentials found.',
    'Try these steps:',
    '  1. Run `aws configure` to set up credentials',
    '  2. Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables',
    '  3. Or set AWS_PROFILE to use a named profile from ~/.aws/credentials',
  ],
  [ErrorType.REGION_INVALID]: [
    'The specified AWS region is invalid.',
    'Try these steps:',
    '  1. Check the AWS_REGION environment variable',
    '  2. Use --region flag with a valid AWS region (e.g., us-east-1, eu-west-1)',
    '  3. Run `aws ec2 describe-regions` to list available regions',
  ],
  [ErrorType.PERMISSION_DENIED]: [
    'Your AWS credentials lack required permissions.',
    'Required permissions for this operation:',
    '  - dynamodb:CreateTable',
    '  - dynamodb:DescribeTable',
    '  - dynamodb:ListTables',
    '  - dynamodb:DeleteTable (for cleanup operations)',
    'Try these steps:',
    '  1. Contact your AWS administrator to grant DynamoDB permissions',
    '  2. Attach the AmazonDynamoDBFullAccess managed policy (for development)',
    '  3. Review IAM policies attached to your user or role',
  ],
  [ErrorType.TABLE_ALREADY_EXISTS]: [
    'One or more tables already exist.',
    'Try these steps:',
    '  1. Use the verify command to check existing tables',
    '  2. Use --force flag to delete and recreate tables (DESTRUCTIVE)',
    '  3. Choose a different environment name with --env flag',
  ],
  [ErrorType.TABLE_NOT_FOUND]: [
    'One or more tables do not exist.',
    'Try these steps:',
    '  1. Run the create command first to create tables',
    '  2. Verify you are using the correct --env flag',
    '  3. Check the AWS_REGION matches where tables were created',
  ],
  [ErrorType.RATE_LIMITED]: [
    'AWS API rate limit exceeded.',
    'Try these steps:',
    '  1. Wait a few seconds and try again',
    '  2. Reduce the number of concurrent operations',
    '  3. Check AWS Service Health Dashboard for service issues',
  ],
  [ErrorType.NETWORK_ERROR]: [
    'Network connection to AWS failed.',
    'Try these steps:',
    '  1. Check your internet connection',
    '  2. Verify firewall or proxy settings',
    '  3. Check AWS service endpoints are accessible',
    '  4. Try a different AWS region',
  ],
  [ErrorType.UNKNOWN]: [
    'An unexpected error occurred.',
    'Try these steps:',
    '  1. Run with --verbose flag for detailed error information',
    '  2. Check AWS CloudTrail logs for API errors',
    '  3. Contact support if the issue persists',
  ],
};

/**
 * Classify an error based on AWS error codes
 */
export function classifyError(error: unknown): ErrorType {
  if (!(error instanceof Error)) {
    return ErrorType.UNKNOWN;
  }

  const errorMessage = error.message.toLowerCase();
  const errorName = (error as { name?: string }).name?.toLowerCase() || '';

  // AWS SDK error codes
  if (errorMessage.includes('invalid credentials') || errorName.includes('credentialserror')) {
    return ErrorType.CREDENTIALS_INVALID;
  }

  if (errorMessage.includes('missing credentials') || errorMessage.includes('no credentials')) {
    return ErrorType.CREDENTIALS_MISSING;
  }

  if (errorMessage.includes('invalid region') || errorMessage.includes('unknown region')) {
    return ErrorType.REGION_INVALID;
  }

  if (
    errorMessage.includes('accessdenied') ||
    errorMessage.includes('unauthorized') ||
    errorName.includes('accessdeniedexception')
  ) {
    return ErrorType.PERMISSION_DENIED;
  }

  if (
    errorMessage.includes('resourceinuse') ||
    errorMessage.includes('table already exists') ||
    errorName.includes('resourceinuseexception')
  ) {
    return ErrorType.TABLE_ALREADY_EXISTS;
  }

  if (
    errorMessage.includes('resourcenotfound') ||
    errorMessage.includes('table not found') ||
    errorName.includes('resourcenotfoundexception')
  ) {
    return ErrorType.TABLE_NOT_FOUND;
  }

  if (
    errorMessage.includes('throttling') ||
    errorMessage.includes('rate exceeded') ||
    errorName.includes('throttlingexception')
  ) {
    return ErrorType.RATE_LIMITED;
  }

  if (
    errorMessage.includes('network') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('timeout') ||
    errorName.includes('networkerror')
  ) {
    return ErrorType.NETWORK_ERROR;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Handle and log an error with remediation guidance
 *
 * @param error - The error to handle
 * @param context - Optional context about where the error occurred
 */
export function handleError(error: unknown, context?: string): void {
  const errorType = classifyError(error);
  const remediation = REMEDIATION_MESSAGES[errorType];

  logger.blank();
  logger.error(context || 'Operation failed');

  if (error instanceof Error) {
    logger.step(`Error: ${error.message}`);
  }

  logger.blank();

  // Print remediation steps
  remediation.forEach((line) => {
    if (line.startsWith('  ')) {
      logger.step(line.trim());
    } else {
      console.log(line);
    }
  });

  logger.blank();
}

/**
 * Handle and exit process with error code
 *
 * @param error - The error to handle
 * @param context - Optional context about where the error occurred
 * @param exitCode - Exit code (default: 1)
 */
export function handleErrorAndExit(
  error: unknown,
  context?: string,
  exitCode = 1
): never {
  handleError(error, context);
  process.exit(exitCode);
}

/**
 * Wrap an async function with error handling
 *
 * @param fn - Async function to wrap
 * @param context - Context for error messages
 * @returns Wrapped function that handles errors
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleErrorAndExit(error, context);
    }
  };
}
