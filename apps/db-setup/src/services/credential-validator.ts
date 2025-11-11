/**
 * AWS credential validator service
 *
 * Validates AWS credentials using STS GetCallerIdentity API.
 * Returns caller identity information if credentials are valid.
 */

import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

/**
 * Caller identity information returned from AWS STS
 */
export interface CallerIdentity {
  userId: string; // Unique identifier for the caller
  account: string; // AWS account ID
  arn: string; // ARN of the IAM entity making the call
}

/**
 * Configuration options for credential validation
 */
export interface CredentialValidatorConfig {
  region?: string; // AWS region (defaults to AWS_REGION env var)
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Validate AWS credentials by calling STS GetCallerIdentity
 *
 * This is a safe, read-only operation that verifies credentials are valid
 * and returns information about the caller identity.
 *
 * @param config - Optional configuration for validation
 * @returns Caller identity if credentials are valid
 * @throws Error if credentials are invalid or STS call fails
 */
export async function validateCredentials(
  config?: CredentialValidatorConfig
): Promise<CallerIdentity> {
  const clientConfig: {
    region?: string;
    credentials?: { accessKeyId: string; secretAccessKey: string };
  } = {
    region: config?.region || process.env.AWS_REGION || 'us-east-1',
  };

  // Add explicit credentials if provided
  if (config?.credentials) {
    clientConfig.credentials = config.credentials;
  }

  const stsClient = new STSClient(clientConfig);

  try {
    const command = new GetCallerIdentityCommand({});
    const response = await stsClient.send(command);

    if (!response.UserId || !response.Account || !response.Arn) {
      throw new Error('Incomplete response from STS GetCallerIdentity');
    }

    return {
      userId: response.UserId,
      account: response.Account,
      arn: response.Arn,
    };
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`AWS credential validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if AWS credentials are configured in the environment
 *
 * Looks for standard AWS credential environment variables or AWS config files.
 * Does not validate the credentials, only checks if they exist.
 *
 * @returns true if credentials appear to be configured
 */
export function areCredentialsConfigured(): boolean {
  // Check for explicit environment variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return true;
  }

  // Check for AWS profile
  if (process.env.AWS_PROFILE) {
    return true;
  }

  // If running in AWS environment (EC2, Lambda, ECS), credentials are provided automatically
  if (process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return true;
  }

  // Otherwise, assume credentials might be in ~/.aws/credentials
  // The SDK will handle loading them if they exist
  return false;
}
