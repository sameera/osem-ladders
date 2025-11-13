/**
 * Type definitions for Cognito Post-Signup Lambda
 * Based on AWS Cognito Post Confirmation Trigger Event structure
 */

/**
 * Cognito Post Confirmation Trigger Event
 * Received when a user confirms their account
 */
export interface CognitoPostConfirmationTriggerEvent {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  triggerSource: 'PostConfirmation_ConfirmSignUp' | 'PostConfirmation_ConfirmForgotPassword';
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    userAttributes: {
      sub: string;
      email: string;
      email_verified: string;
      'cognito:user_status': string;
      name?: string;
      [key: string]: string | undefined;
    };
    clientMetadata?: Record<string, string>;
  };
  response: Record<string, never>;
}

/**
 * User entity stored in DynamoDB Users table
 * Represents a user in the OSEM platform
 */
export interface User {
  userId: string;           // Email address (partition key)
  email: string;            // Email address (duplicate of userId for clarity)
  cognitoSub: string;       // Cognito sub UUID
  name: string;             // Display name
  roles: Set<string>;       // User roles: 'admin', 'manager', 'team_member'
  createdAt: number;        // Unix timestamp in milliseconds
  updatedAt: number;        // Unix timestamp in milliseconds
}

/**
 * DynamoDB representation of User (with roles as String Set)
 */
export interface UserDynamoDBItem {
  userId: string;
  email: string;
  cognitoSub?: string;      // Optional until first auth
  name: string;
  roles: Set<string>;       // DynamoDB String Set
  createdAt: number;
  updatedAt: number;
}

/**
 * User role types
 */
export type UserRole = 'admin' | 'manager' | 'team_member';

/**
 * Result of user provisioning operation
 */
export interface ProvisioningResult {
  success: boolean;
  userId: string;
  isNewUser: boolean;
  roles: string[];
  error?: string;
}
