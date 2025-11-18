import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Team ID validation schema (lowercase alphanumeric + hyphens)
 */
export const teamIdSchema = z
  .string()
  .regex(
    /^[a-z0-9-]+$/,
    'Team ID must be lowercase alphanumeric with hyphens only'
  )
  .min(1)
  .max(255);

/**
 * Name validation schema
 */
export const nameSchema = z.string().min(1).max(255);

/**
 * User role validation
 */
export const userRoleSchema = z.enum(['TeamMember', 'Manager', 'Admin']);

/**
 * Assessment type validation
 */
export const assessmentTypeSchema = z.enum(['self', 'manager']);

/**
 * Assessment status validation
 */
export const assessmentStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'submitted'
]);

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Validate UUID
 */
export function validateUUID(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

/**
 * Validate team ID format
 */
export function validateTeamId(id: string): boolean {
  return teamIdSchema.safeParse(id).success;
}
