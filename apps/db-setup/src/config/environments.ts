/**
 * Environment configuration definitions
 *
 * Defines the supported environments and their AWS configurations.
 */

/**
 * Supported environment names
 */
export enum Environment {
  DEV = 'dev',
  STAGING = 'staging',
  PROD = 'prod',
  LOCAL = 'local',
}

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
  name: string; // Environment name used in table names (e.g., 'dev', 'staging', 'prod')
  description: string; // Human-readable description
  region?: string; // AWS region (optional, defaults to AWS_REGION env var)
  endpoint?: string; // Custom endpoint (for DynamoDB Local)
  requireConfirmation?: boolean; // Require explicit confirmation for destructive operations
}

/**
 * Configuration for each environment
 */
export const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  [Environment.DEV]: {
    name: 'dev',
    description: 'Development environment',
    requireConfirmation: false,
  },
  [Environment.STAGING]: {
    name: 'staging',
    description: 'Staging environment',
    requireConfirmation: true,
  },
  [Environment.PROD]: {
    name: 'prod',
    description: 'Production environment',
    requireConfirmation: true,
  },
  [Environment.LOCAL]: {
    name: 'local',
    description: 'Local DynamoDB (for development/testing)',
    endpoint: 'http://localhost:8000',
    requireConfirmation: false,
  },
};

/**
 * Get environment configuration by name
 *
 * @param envName - Environment name string
 * @returns Environment configuration
 * @throws Error if environment name is invalid
 */
export function getEnvironmentConfig(envName: string): EnvironmentConfig {
  const env = envName.toLowerCase() as Environment;

  if (!(env in ENVIRONMENT_CONFIGS)) {
    const validEnvs = Object.keys(ENVIRONMENT_CONFIGS).join(', ');
    throw new Error(
      `Invalid environment: ${envName}. Valid environments: ${validEnvs}`
    );
  }

  return ENVIRONMENT_CONFIGS[env];
}

/**
 * Check if an environment name is valid
 *
 * @param envName - Environment name to check
 * @returns true if valid, false otherwise
 */
export function isValidEnvironment(envName: string): boolean {
  const env = envName.toLowerCase();
  return env in ENVIRONMENT_CONFIGS;
}

/**
 * Get list of all valid environment names
 *
 * @returns Array of environment names
 */
export function getValidEnvironments(): string[] {
  return Object.values(Environment);
}

/**
 * Default environment (used when --env flag is not provided)
 */
export const DEFAULT_ENVIRONMENT = Environment.DEV;
