/**
 * Unit tests for Lambda handler
 * Tests Cognito Post Confirmation trigger handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddbMock } from './setup';
import { handler } from '../index';
import {
  existingUserEvent,
  newUserEvent,
  missingEmailEvent,
  missingSubEvent,
  missingNameEvent,
} from './fixtures/cognito-events';

describe('Lambda handler', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('[US1] Existing User Cognito Sync', () => {
    it('should update cognitoSub for existing user', async () => {
      // Mock successful DynamoDB update for existing user
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          userId: 'jane.doe@company.com',
          email: 'jane.doe@company.com',
          cognitoSub: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
          name: 'Jane Doe',
          roles: new Set(['manager']),
          createdAt: 1700000000000,
          updatedAt: Date.now(),
        },
      });

      const result = await handler(existingUserEvent);

      expect(result).toEqual(existingUserEvent); // Lambda returns event object
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);
    });

    it('should preserve existing name attribute if present', async () => {
      // Mock DynamoDB response with pre-existing name
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          userId: 'jane.doe@company.com',
          email: 'jane.doe@company.com',
          cognitoSub: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
          name: 'Jane Doe (Existing Name)', // Pre-existing name preserved
          roles: new Set(['manager']),
          createdAt: 1700000000000,
          updatedAt: Date.now(),
        },
      });

      const result = await handler(existingUserEvent);

      expect(result).toEqual(existingUserEvent);

      // Verify UpdateExpression uses if_not_exists for name
      const calls = ddbMock.commandCalls(UpdateCommand);
      const updateParams = calls[0].args[0].input;
      expect(updateParams.UpdateExpression).toContain('if_not_exists(#name, :name)');
    });

    it('should be idempotent - repeated signups do not modify existing user', async () => {
      // Mock DynamoDB response - user already has cognitoSub
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          userId: 'jane.doe@company.com',
          email: 'jane.doe@company.com',
          cognitoSub: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
          name: 'Jane Doe',
          roles: new Set(['manager']),
          createdAt: 1700000000000,
          updatedAt: 1700000000000, // updatedAt unchanged (idempotent)
        },
      });

      // First signup
      await handler(existingUserEvent);

      // Second signup (duplicate)
      const result = await handler(existingUserEvent);

      expect(result).toEqual(existingUserEvent);
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(2); // Both calls succeed
    });
  });

  describe('[US2] New User Auto-Provisioning', () => {
    it('should create new user when no existing record found', async () => {
      // Mock DynamoDB response for new user creation
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          userId: 'new.user@company.com',
          email: 'new.user@company.com',
          cognitoSub: 'cccccccc-dddd-eeee-ffff-000000000000',
          name: 'New User',
          roles: new Set(['team_member']),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const result = await handler(newUserEvent);

      expect(result).toEqual(newUserEvent);

      // Verify default team_member role assigned
      const calls = ddbMock.commandCalls(UpdateCommand);
      expect(calls).toHaveLength(1);

      const updateParams = calls[0].args[0].input;
      expect(updateParams.ExpressionAttributeValues?.[':defaultRoles']).toEqual(
        new Set(['team_member'])
      );
    });
  });

  describe('Validation', () => {
    it('should throw error when email attribute is missing', async () => {
      await expect(handler(missingEmailEvent)).rejects.toThrow(
        'Missing required user attribute: email'
      );

      // No DynamoDB call should be made
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(0);
    });

    it('should throw error when sub attribute is missing', async () => {
      await expect(handler(missingSubEvent)).rejects.toThrow(
        'Missing required user attribute: sub'
      );

      // No DynamoDB call should be made
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(0);
    });
  });

  describe('[US3] Profile Data Sync', () => {
    it('should default to email prefix when name is missing', async () => {
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          userId: 'noname@example.com',
          email: 'noname@example.com',
          cognitoSub: 'eeeeeeee-ffff-0000-1111-222222222222',
          name: 'noname', // Email prefix used as fallback
          roles: new Set(['team_member']),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const result = await handler(missingNameEvent);

      expect(result).toEqual(missingNameEvent);

      // Verify name extraction logic
      const calls = ddbMock.commandCalls(UpdateCommand);
      const updateParams = calls[0].args[0].input;
      expect(updateParams.ExpressionAttributeValues?.[':name']).toBe('noname');
    });
  });

  describe('Error Handling', () => {
    it('should propagate DynamoDB errors to Cognito', async () => {
      ddbMock.on(UpdateCommand).rejects(new Error('DynamoDB timeout'));

      await expect(handler(existingUserEvent)).rejects.toThrow('DynamoDB timeout');
    });
  });
});
