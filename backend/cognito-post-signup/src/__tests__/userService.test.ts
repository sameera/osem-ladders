/**
 * Unit tests for userService
 * Tests DynamoDB operations for user provisioning
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddbMock } from './setup';
import { upsertUser } from '../services/userService';

describe('userService', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('upsertUser', () => {
    it('[US1] should preserve existing roles for pre-created user', async () => {
      // Mock DynamoDB UpdateItem response - existing user with manager role
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

      const result = await upsertUser({
        email: 'jane.doe@company.com',
        cognitoSub: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        name: 'Jane Doe',
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe('jane.doe@company.com');
      expect(result.roles).toEqual(['manager']); // Roles preserved

      // Verify UpdateCommand was called with correct parameters
      const calls = ddbMock.commandCalls(UpdateCommand);
      expect(calls).toHaveLength(1);

      const updateParams = calls[0].args[0].input;
      expect(updateParams.Key).toEqual({ userId: 'jane.doe@company.com' });
      expect(updateParams.UpdateExpression).toContain('cognitoSub = :cognitoSub');
      expect(updateParams.UpdateExpression).toContain('if_not_exists(roles, :defaultRoles)');
    });

    it('[US2] should create new user with team_member role', async () => {
      // Mock DynamoDB UpdateItem response - new user
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

      const result = await upsertUser({
        email: 'new.user@company.com',
        cognitoSub: 'cccccccc-dddd-eeee-ffff-000000000000',
        name: 'New User',
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe('new.user@company.com');
      expect(result.isNewUser).toBe(true);
      expect(result.roles).toEqual(['team_member']); // Default role assigned
    });

    it('should handle DynamoDB errors gracefully', async () => {
      // Mock DynamoDB error
      ddbMock.on(UpdateCommand).rejects(new Error('DynamoDB connection timeout'));

      await expect(
        upsertUser({
          email: 'test@example.com',
          cognitoSub: 'test-sub',
          name: 'Test User',
        })
      ).rejects.toThrow('DynamoDB connection timeout');
    });
  });
});
