/**
 * Mock Cognito Post Confirmation event fixtures for testing
 */

import { CognitoPostConfirmationTriggerEvent } from '../../types';

/**
 * Base Cognito Post Confirmation event with all required fields
 */
export const baseCognitoEvent: CognitoPostConfirmationTriggerEvent = {
  version: '1',
  region: 'us-east-1',
  userPoolId: 'us-east-1_test',
  userName: 'testuser@example.com',
  triggerSource: 'PostConfirmation_ConfirmSignUp',
  callerContext: {
    awsSdkVersion: '3',
    clientId: 'test-client-id',
  },
  request: {
    userAttributes: {
      sub: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      email: 'testuser@example.com',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
      name: 'Test User',
    },
  },
  response: {},
};

/**
 * Event for existing user (pre-created with manager role)
 */
export const existingUserEvent: CognitoPostConfirmationTriggerEvent = {
  ...baseCognitoEvent,
  userName: 'jane.doe@company.com',
  request: {
    userAttributes: {
      sub: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      email: 'jane.doe@company.com',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
      name: 'Jane Doe',
    },
  },
};

/**
 * Event for new user (not pre-created)
 */
export const newUserEvent: CognitoPostConfirmationTriggerEvent = {
  ...baseCognitoEvent,
  userName: 'new.user@company.com',
  request: {
    userAttributes: {
      sub: 'cccccccc-dddd-eeee-ffff-000000000000',
      email: 'new.user@company.com',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
      name: 'New User',
    },
  },
};

/**
 * Event with missing email attribute (should fail validation)
 */
export const missingEmailEvent: CognitoPostConfirmationTriggerEvent = {
  ...baseCognitoEvent,
  request: {
    userAttributes: {
      sub: 'dddddddd-eeee-ffff-0000-111111111111',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
      name: 'Test User',
    } as CognitoPostConfirmationTriggerEvent['request']['userAttributes'],
  },
};

/**
 * Event with missing sub attribute (should fail validation)
 */
export const missingSubEvent: CognitoPostConfirmationTriggerEvent = {
  ...baseCognitoEvent,
  request: {
    userAttributes: {
      email: 'testuser@example.com',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
      name: 'Test User',
    } as CognitoPostConfirmationTriggerEvent['request']['userAttributes'],
  },
};

/**
 * Event with missing name attribute (should use email prefix as fallback)
 */
export const missingNameEvent: CognitoPostConfirmationTriggerEvent = {
  ...baseCognitoEvent,
  userName: 'noname@example.com',
  request: {
    userAttributes: {
      sub: 'eeeeeeee-ffff-0000-1111-222222222222',
      email: 'noname@example.com',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
    },
  },
};
