/**
 * DynamoDB table schema definitions
 *
 * Defines the CreateTable input for all 6 tables with their GSIs.
 * Based on data-model.md specification.
 */

import {
  CreateTableCommandInput,
  KeyType,
  AttributeDefinition,
  KeySchemaElement,
  GlobalSecondaryIndex,
  ProjectionType,
  BillingMode,
} from '@aws-sdk/client-dynamodb';

/**
 * Generate table name with environment prefix
 */
export function getTableName(baseTableName: string, environment: string): string {
  return `osem-${environment}-${baseTableName}`;
}

/**
 * Common tags for all tables
 */
function getTableTags(environment: string): Array<{ Key: string; Value: string }> {
  return [
    { Key: 'Environment', Value: environment },
    { Key: 'Application', Value: 'osem-ladders' },
  ];
}

// ============================================================================
// Table 1: Users
// ============================================================================

export function getUsersTableSchema(environment: string): CreateTableCommandInput {
  return {
    TableName: getTableName('Users', environment),
    KeySchema: [
      { AttributeName: 'userId', KeyType: KeyType.HASH },
    ] as KeySchemaElement[],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
    ] as AttributeDefinition[],
    BillingMode: BillingMode.PAY_PER_REQUEST,
    Tags: getTableTags(environment),
  };
}

// ============================================================================
// Table 2: Teams
// ============================================================================

export function getTeamsTableSchema(environment: string): CreateTableCommandInput {
  return {
    TableName: getTableName('Teams', environment),
    KeySchema: [
      { AttributeName: 'teamId', KeyType: KeyType.HASH },
    ] as KeySchemaElement[],
    AttributeDefinitions: [
      { AttributeName: 'teamId', AttributeType: 'S' },
      { AttributeName: 'managerId', AttributeType: 'S' },
    ] as AttributeDefinition[],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'managerId-index',
        KeySchema: [
          { AttributeName: 'managerId', KeyType: KeyType.HASH },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
    ] as GlobalSecondaryIndex[],
    BillingMode: BillingMode.PAY_PER_REQUEST,
    Tags: getTableTags(environment),
  };
}

// ============================================================================
// Table 3: AssessmentPlans
// ============================================================================

export function getAssessmentPlansTableSchema(environment: string): CreateTableCommandInput {
  return {
    TableName: getTableName('AssessmentPlans', environment),
    KeySchema: [
      { AttributeName: 'planId', KeyType: KeyType.HASH },
    ] as KeySchemaElement[],
    AttributeDefinitions: [
      { AttributeName: 'planId', AttributeType: 'S' },
      { AttributeName: 'teamId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ] as AttributeDefinition[],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'teamId-index',
        KeySchema: [
          { AttributeName: 'teamId', KeyType: KeyType.HASH },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: KeyType.HASH },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
    ] as GlobalSecondaryIndex[],
    BillingMode: BillingMode.PAY_PER_REQUEST,
    Tags: getTableTags(environment),
  };
}

// ============================================================================
// Table 4: Assessments
// ============================================================================

export function getAssessmentsTableSchema(environment: string): CreateTableCommandInput {
  return {
    TableName: getTableName('Assessments', environment),
    KeySchema: [
      { AttributeName: 'assessmentId', KeyType: KeyType.HASH },
    ] as KeySchemaElement[],
    AttributeDefinitions: [
      { AttributeName: 'assessmentId', AttributeType: 'S' },
      { AttributeName: 'planId', AttributeType: 'S' },
      { AttributeName: 'teamMemberId', AttributeType: 'S' },
    ] as AttributeDefinition[],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'planId-teamMemberId-index',
        KeySchema: [
          { AttributeName: 'planId', KeyType: KeyType.HASH },
          { AttributeName: 'teamMemberId', KeyType: KeyType.RANGE },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
      {
        IndexName: 'teamMemberId-index',
        KeySchema: [
          { AttributeName: 'teamMemberId', KeyType: KeyType.HASH },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
    ] as GlobalSecondaryIndex[],
    BillingMode: BillingMode.PAY_PER_REQUEST,
    Tags: getTableTags(environment),
  };
}

// ============================================================================
// Table 5: AssessmentReports
// ============================================================================

export function getAssessmentReportsTableSchema(environment: string): CreateTableCommandInput {
  return {
    TableName: getTableName('AssessmentReports', environment),
    KeySchema: [
      { AttributeName: 'reportId', KeyType: KeyType.HASH },
    ] as KeySchemaElement[],
    AttributeDefinitions: [
      { AttributeName: 'reportId', AttributeType: 'S' },
      { AttributeName: 'planId', AttributeType: 'S' },
      { AttributeName: 'teamMemberId', AttributeType: 'S' },
    ] as AttributeDefinition[],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'planId-index',
        KeySchema: [
          { AttributeName: 'planId', KeyType: KeyType.HASH },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
      {
        IndexName: 'teamMemberId-index',
        KeySchema: [
          { AttributeName: 'teamMemberId', KeyType: KeyType.HASH },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
    ] as GlobalSecondaryIndex[],
    BillingMode: BillingMode.PAY_PER_REQUEST,
    Tags: getTableTags(environment),
  };
}

// ============================================================================
// Table 6: ConfigVersions
// ============================================================================

export function getConfigVersionsTableSchema(environment: string): CreateTableCommandInput {
  return {
    TableName: getTableName('ConfigVersions', environment),
    KeySchema: [
      { AttributeName: 'configId', KeyType: KeyType.HASH },
    ] as KeySchemaElement[],
    AttributeDefinitions: [
      { AttributeName: 'configId', AttributeType: 'S' },
      { AttributeName: 'isActive', AttributeType: 'N' },
      { AttributeName: 'createdAt', AttributeType: 'N' },
    ] as AttributeDefinition[],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'isActive-index',
        KeySchema: [
          { AttributeName: 'isActive', KeyType: KeyType.HASH },
          { AttributeName: 'createdAt', KeyType: KeyType.RANGE },
        ] as KeySchemaElement[],
        Projection: { ProjectionType: ProjectionType.ALL },
      },
    ] as GlobalSecondaryIndex[],
    BillingMode: BillingMode.PAY_PER_REQUEST,
    Tags: getTableTags(environment),
  };
}

// ============================================================================
// All Tables
// ============================================================================

/**
 * Get all table schemas for the given environment
 */
export function getAllTableSchemas(environment: string): CreateTableCommandInput[] {
  return [
    getUsersTableSchema(environment),
    getTeamsTableSchema(environment),
    getAssessmentPlansTableSchema(environment),
    getAssessmentsTableSchema(environment),
    getAssessmentReportsTableSchema(environment),
    getConfigVersionsTableSchema(environment),
  ];
}

/**
 * Base table names (without environment prefix)
 */
export const BASE_TABLE_NAMES = [
  'Users',
  'Teams',
  'AssessmentPlans',
  'Assessments',
  'AssessmentReports',
  'ConfigVersions',
] as const;

/**
 * Get all full table names for the given environment
 */
export function getAllTableNames(environment: string): string[] {
  return BASE_TABLE_NAMES.map((name) => getTableName(name, environment));
}
