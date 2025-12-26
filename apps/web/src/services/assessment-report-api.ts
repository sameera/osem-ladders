/**
 * Assessment Report API Service
 * API client for AssessmentReport CRUD operations
 */

import type { UseApiReturn } from "@/hooks/useApi";
import type {
    AssessmentReport,
    CreateReportInput,
    UpdateReportInput,
    GetReportResponse,
    CreateReportResponse,
} from "@/types/reports";
import { isNotFoundError } from "@/services/errors";

export interface AssessmentReportApiClient {
    fetchReport: (reportId: string) => Promise<AssessmentReport | null>;
    createReport: (input: CreateReportInput) => Promise<AssessmentReport>;
    updateReport: (
        reportId: string,
        input: UpdateReportInput
    ) => Promise<AssessmentReport>;
    submitReport: (reportId: string) => Promise<AssessmentReport>;
    shareReport: (reportId: string, share: boolean) => Promise<AssessmentReport>;
}

export function createAssessmentReportApi(
    api: UseApiReturn
): AssessmentReportApiClient {
    return {
        async fetchReport(reportId: string) {
            try {
                const response = await api.get<GetReportResponse>(
                    `/reports/${encodeURIComponent(reportId)}`
                );
                return response.data;
            } catch (error: unknown) {
                // 404 is expected if report doesn't exist yet
                if (isNotFoundError(error)) {
                    return null;
                }
                throw error;
            }
        },

        async createReport(input: CreateReportInput) {
            const response = await api.post<CreateReportResponse>(
                "/reports",
                input
            );
            return response.data;
        },

        async updateReport(reportId: string, input: UpdateReportInput) {
            const response = await api.patch<CreateReportResponse>(
                `/reports/${encodeURIComponent(reportId)}`,
                input
            );
            return response.data;
        },

        async submitReport(reportId: string) {
            const response = await api.put<CreateReportResponse>(
                `/reports/${encodeURIComponent(reportId)}/submit`,
                {}
            );
            return response.data;
        },

        async shareReport(reportId: string, share: boolean) {
            const response = await api.patch<CreateReportResponse>(
                `/reports/${encodeURIComponent(reportId)}/share`,
                { share }
            );
            return response.data;
        },
    };
}
