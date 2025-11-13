/**
 * AWS Lambda handler for Cognito Post-Signup trigger
 * Provisions user records in DynamoDB Users table
 */

import { CognitoPostConfirmationTriggerEvent } from './types';
import { upsertUser } from './services/userService';
import { logger } from './utils/logger';

/**
 * Lambda handler for Cognito Post Confirmation trigger
 * Called after a user confirms their account via Cognito
 *
 * @param event - Cognito Post Confirmation event
 * @returns The same event object (required by Cognito)
 */
export async function handler(
  event: CognitoPostConfirmationTriggerEvent
): Promise<CognitoPostConfirmationTriggerEvent> {
  logger.info('Post Confirmation triggered', {
    triggerSource: event.triggerSource,
    userId: event.userName,
    operation: 'handler',
  });

  try {
    // Extract and validate required attributes from Cognito event
    const { sub, email, name } = event.request.userAttributes;

    // Validation: Email is required (used as userId)
    if (!email) {
      const error = new Error('Missing required user attribute: email');
      logger.error('Validation failed', { operation: 'handler' }, error);
      throw error;
    }

    // Validation: Cognito sub is required
    if (!sub) {
      const error = new Error('Missing required user attribute: sub');
      logger.error('Validation failed', { userId: email, operation: 'handler' }, error);
      throw error;
    }

    // Extract display name with fallback to email prefix
    const displayName = extractDisplayName(email, name);

    // Provision or update user in DynamoDB
    const result = await upsertUser({
      email,
      cognitoSub: sub,
      name: displayName,
    });

    logger.info('User provisioning completed', {
      userId: result.userId,
      isNewUser: result.isNewUser,
      rolesCount: result.roles.length,
      operation: 'handler',
    });

    // Return the original event (required by Cognito)
    return event;
  } catch (error) {
    // Log error with context
    logger.error(
      'Post Confirmation handler failed',
      {
        userName: event.userName,
        triggerSource: event.triggerSource,
        operation: 'handler',
      },
      error as Error
    );

    // Re-throw error to Cognito for automatic retry
    // This will fail the user authentication until the error is resolved
    throw error;
  }
}

/**
 * Extract display name from Cognito attributes
 * Falls back to email prefix if name is not provided
 *
 * @param email - User email address
 * @param name - Display name from Microsoft 365 (optional)
 * @returns Display name or email prefix
 */
function extractDisplayName(email: string, name?: string): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  // Fallback: Use email prefix (part before @)
  const emailPrefix = email.split('@')[0];
  return emailPrefix || 'User';
}
