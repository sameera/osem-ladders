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
} from '../services/assessment-report-service';
import type {
  AssessmentReport,
  CreateReportInput,
  UpdateReportInput,
} from '../types/reports';

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

    const report = await getReportById(decodeURIComponent(reportId));

    if (!report) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Assessment report not found',
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
