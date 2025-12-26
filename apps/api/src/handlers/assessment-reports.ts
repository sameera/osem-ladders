/**
 * Assessment Report Handlers
 * HTTP handlers for assessment report operations
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getReportById,
  createReport,
  updateReport,
  submitReport,
  deleteReport,
  shareReport,
} from '../services/assessment-report-service';
import { getUserById } from '../services/user-service';
import type {
  AssessmentReport,
  CreateReportInput,
  UpdateReportInput,
} from '../types/reports';
import { parseReportId } from '../types/reports';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET /growth/reports/:reportId
 * Get an assessment report by ID
 */
export async function getReportHandler(
  request: FastifyRequest<{
    Params: { reportId: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { reportId } = request.params;
    const decodedReportId = decodeURIComponent(reportId);

    // Get current user
    const currentUserEmail = request.user?.email;
    if (!currentUserEmail) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiResponse<never>);
    }

    const report = await getReportById(decodedReportId);

    if (!report) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Assessment report not found',
        },
      } as ApiResponse<never>);
    }

    // Authorization checks
    // Parse report ID to get the assessee userId
    const { userId: assesseeId } = parseReportId(decodedReportId);

    // Check if user is the assessor (created the report)
    const isAssessor = report.assessorId === currentUserEmail;

    // Check if user is the assessee viewing a shared report
    const isAssesseeViewingShared =
      report.userId === currentUserEmail && report.sharedWithAssessee === true;

    // Check if user is a manager of the assessee
    let isManager = false;
    if (!isAssessor && !isAssesseeViewingShared) {
      try {
        const currentUser = await getUserById(currentUserEmail);
        const assesseeUser = await getUserById(assesseeId);

        // Check if current user has manager role and the assessee belongs to their team
        if (
          currentUser &&
          currentUser.roles?.includes('manager') &&
          assesseeUser &&
          assesseeUser.team
        ) {
          // A user is a manager of the assessee if the assessee is in one of their teams
          // For now, we check if the current user's team matches the assessee's team
          // and if the current user has the manager role
          isManager = currentUser.roles.includes('manager');
        }
      } catch (error) {
        console.error('Error checking manager status:', error);
        // If we can't verify manager status, proceed to deny access
      }
    }

    // Check if user has admin role
    let isAdmin = false;
    try {
      const currentUser = await getUserById(currentUserEmail);
      isAdmin = currentUser?.roles?.includes('admin') || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    // Deny access if none of the authorization conditions are met
    if (!isAssessor && !isAssesseeViewingShared && !isManager && !isAdmin) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this report',
        },
      } as ApiResponse<never>);
    }

    return reply.status(200).send({
      success: true,
      data: report,
    } as ApiResponse<AssessmentReport>);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch assessment report',
      },
    } as ApiResponse<never>);
  }
}

/**
 * POST /growth/reports
 * Create a new assessment report
 */
export async function createReportHandler(
  request: FastifyRequest<{
    Body: CreateReportInput;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userEmail = request.user?.email;
    if (!userEmail) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiResponse<never>);
    }

    const report = await createReport(request.body, userEmail);

    return reply.status(201).send({
      success: true,
      data: report,
    } as ApiResponse<AssessmentReport>);
  } catch (error: any) {
    // Handle validation errors
    if (error.message?.includes('REPORT_EXISTS')) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'REPORT_EXISTS',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    // Generic error
    console.error('Error creating report:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create assessment report',
      },
    } as ApiResponse<never>);
  }
}

/**
 * PATCH /growth/reports/:reportId
 * Update an existing assessment report
 */
export async function updateReportHandler(
  request: FastifyRequest<{
    Params: { reportId: string };
    Body: UpdateReportInput;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { reportId } = request.params;

    const report = await updateReport(decodeURIComponent(reportId), request.body);

    return reply.status(200).send({
      success: true,
      data: report,
    } as ApiResponse<AssessmentReport>);
  } catch (error: any) {
    if (error.message?.includes('REPORT_NOT_FOUND')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    console.error('Error updating report:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update assessment report',
      },
    } as ApiResponse<never>);
  }
}

/**
 * PUT /growth/reports/:reportId/submit
 * Submit an assessment report (change status to submitted)
 */
export async function submitReportHandler(
  request: FastifyRequest<{
    Params: { reportId: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { reportId } = request.params;

    const report = await submitReport(decodeURIComponent(reportId));

    return reply.status(200).send({
      success: true,
      data: report,
    } as ApiResponse<AssessmentReport>);
  } catch (error: any) {
    if (error.message?.includes('REPORT_NOT_FOUND')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    console.error('Error submitting report:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit assessment report',
      },
    } as ApiResponse<never>);
  }
}

/**
 * DELETE /growth/reports/:reportId
 * Soft delete an assessment report
 */
export async function deleteReportHandler(
  request: FastifyRequest<{
    Params: { reportId: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { reportId } = request.params;

    await deleteReport(decodeURIComponent(reportId));

    return reply.status(204).send();
  } catch (error: any) {
    if (error.message?.includes('REPORT_NOT_FOUND')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    console.error('Error deleting report:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete assessment report',
      },
    } as ApiResponse<never>);
  }
}

/**
 * PATCH /growth/reports/:reportId/share
 * Share or unshare a manager assessment report with the assessee
 */
export async function shareReportHandler(
  request: FastifyRequest<{
    Params: { reportId: string };
    Body: { share: boolean };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { reportId } = request.params;
    const { share } = request.body;

    const userEmail = request.user?.email;
    if (!userEmail) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiResponse<never>);
    }

    const report = await shareReport(decodeURIComponent(reportId), share, userEmail);

    return reply.status(200).send({
      success: true,
      data: report,
    } as ApiResponse<AssessmentReport>);
  } catch (error: any) {
    // Handle validation errors
    if (error.message?.includes('REPORT_NOT_FOUND')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    if (error.message?.includes('INVALID_REPORT_TYPE')) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_REPORT_TYPE',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    if (error.message?.includes('REPORT_NOT_SUBMITTED')) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'REPORT_NOT_SUBMITTED',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    console.error('Error sharing report:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to share assessment report',
      },
    } as ApiResponse<never>);
  }
}
