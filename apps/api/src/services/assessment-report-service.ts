/**
 * Assessment Report Service
 * Handles CRUD operations for assessment reports
 */

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../utils/dynamodb-client';
import type {
  AssessmentReport,
  CreateReportInput,
  UpdateReportInput,
  AssessmentType,
  createReportId,
  parseReportId,
} from '../types/reports';

/**
 * Create report ID from components
 */
function buildReportId(userId: string, assessmentId: string, type: AssessmentType): string {
  return `${userId}|${assessmentId}|${type}`;
}

/**
 * Get an assessment report by ID
 */
export async function getReportById(reportId: string): Promise<AssessmentReport | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.AssessmentReports,
      Key: { id: reportId },
    })
  );

  if (!result.Item) {
    return null;
  }

  // Filter out inactive (soft-deleted) reports
  const report = result.Item as AssessmentReport;
  if (!report.isActive) {
    return null;
  }

  return report;
}

/**
 * Create a new assessment report
 */
export async function createReport(
  input: CreateReportInput,
  createdBy: string
): Promise<AssessmentReport> {
  const reportId = buildReportId(input.userId, input.assessmentId, input.type);
  const now = Date.now();

  // Check if report already exists
  const existing = await getReportById(reportId);
  if (existing) {
    throw new Error('REPORT_EXISTS: Assessment report already exists');
  }

  const report: AssessmentReport = {
    id: reportId,
    type: input.type,
    userId: input.userId,
    assessmentId: input.assessmentId,
    assessorId: input.assessorId,
    responses: input.responses || {},
    status: 'not_started',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableNames.AssessmentReports,
      Item: report,
      ConditionExpression: 'attribute_not_exists(id)', // Prevent overwrites
    })
  );

  return report;
}

/**
 * Update an existing assessment report
 */
export async function updateReport(
  reportId: string,
  input: UpdateReportInput
): Promise<AssessmentReport> {
  const now = Date.now();

  // Build update expression dynamically
  const updateParts: string[] = ['updatedAt = :updatedAt'];
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };

  if (input.responses !== undefined) {
    updateParts.push('responses = :responses');
    expressionAttributeValues[':responses'] = input.responses;
  }

  if (input.status !== undefined) {
    updateParts.push('#status = :status');
    expressionAttributeValues[':status'] = input.status;

    // If status is being set to submitted, set submittedAt
    if (input.status === 'submitted') {
      updateParts.push('submittedAt = :submittedAt');
      expressionAttributeValues[':submittedAt'] = now;
    }
  }

  // Add active condition to expression values
  expressionAttributeValues[':active'] = true;

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableNames.AssessmentReports,
      Key: { id: reportId },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(id) AND isActive = :active',
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!result.Attributes) {
    throw new Error('REPORT_NOT_FOUND: Assessment report not found or inactive');
  }

  return result.Attributes as AssessmentReport;
}

/**
 * Submit an assessment report (sets status to submitted)
 */
export async function submitReport(reportId: string): Promise<AssessmentReport> {
  const now = Date.now();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableNames.AssessmentReports,
      Key: { id: reportId },
      UpdateExpression: 'SET #status = :status, submittedAt = :submittedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'submitted',
        ':submittedAt': now,
        ':updatedAt': now,
        ':active': true,
      },
      ConditionExpression: 'attribute_exists(id) AND isActive = :active',
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!result.Attributes) {
    throw new Error('REPORT_NOT_FOUND: Assessment report not found or inactive');
  }

  return result.Attributes as AssessmentReport;
}

/**
 * Soft delete an assessment report (set isActive to false)
 */
export async function deleteReport(reportId: string): Promise<void> {
  const now = Date.now();

  await docClient.send(
    new UpdateCommand({
      TableName: TableNames.AssessmentReports,
      Key: { id: reportId },
      UpdateExpression: 'SET isActive = :inactive, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':inactive': false,
        ':updatedAt': now,
        ':active': true,
      },
      ConditionExpression: 'attribute_exists(id) AND isActive = :active',
    })
  );
}

/**
 * Share or unshare a manager assessment report with the assessee
 */
export async function shareReport(
  reportId: string,
  share: boolean,
  sharedBy: string
): Promise<AssessmentReport> {
  const now = Date.now();

  // Fetch report to validate
  const report = await getReportById(reportId);
  if (!report) {
    throw new Error('REPORT_NOT_FOUND: Assessment report not found or inactive');
  }

  // Parse reportId to get type
  const { type } = reportId.split('|').length === 3
    ? { type: reportId.split('|')[2] as AssessmentType }
    : { type: 'self' as AssessmentType };

  // Only manager reports can be shared
  if (type !== 'manager') {
    throw new Error('INVALID_REPORT_TYPE: Only manager reports can be shared');
  }

  // Report must be submitted before sharing
  if (report.status !== 'submitted') {
    throw new Error('REPORT_NOT_SUBMITTED: Cannot share unsubmitted report');
  }

  // Build update expression based on share/unshare
  let updateExpression: string;
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
    ':active': true,
  };

  if (share) {
    // Share the report
    updateExpression = 'SET sharedWithAssessee = :shared, sharedAt = :sharedAt, sharedBy = :sharedBy, updatedAt = :updatedAt';
    expressionAttributeValues[':shared'] = true;
    expressionAttributeValues[':sharedAt'] = now;
    expressionAttributeValues[':sharedBy'] = sharedBy;
  } else {
    // Unshare the report (remove sharing fields)
    updateExpression = 'REMOVE sharedWithAssessee, sharedAt, sharedBy SET updatedAt = :updatedAt';
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableNames.AssessmentReports,
      Key: { id: reportId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(id) AND isActive = :active',
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!result.Attributes) {
    throw new Error('REPORT_NOT_FOUND: Assessment report not found or inactive');
  }

  return result.Attributes as AssessmentReport;
}
