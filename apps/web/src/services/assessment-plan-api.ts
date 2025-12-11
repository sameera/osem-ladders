/**
 * Assessment Plan API Client
 * API client functions for assessment plan management operations
 */

import type {
    AssessmentPlan,
    CreateAssessmentPlanInput,
    ListPlansQuery,
    ListPlansResponse,
    GetPlanResponse,
    CreatePlanResponse,
} from "@/types/assessments";

export interface UseApiReturn {
    get: <T = any>(url: string, options?: any) => Promise<T>;
    post: <T = any>(url: string, body?: any, options?: any) => Promise<T>;
    put: <T = any>(url: string, body?: any, options?: any) => Promise<T>;
    patch: <T = any>(url: string, body?: any, options?: any) => Promise<T>;
    delete: <T = any>(url: string, options?: any) => Promise<T>;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
}

export function createAssessmentPlanApi(api: UseApiReturn) {
    return {
        /**
         * Fetch all plans for a specific team
         */
        async fetchPlans(
            teamId: string,
            query?: ListPlansQuery
        ): Promise<AssessmentPlan[]> {
            const params = new URLSearchParams();
            if (query?.includeInactive !== undefined) {
                params.append("includeInactive", String(query.includeInactive));
            }

            const queryString = params.toString();
            const url = `/teams/${teamId}/plans${
                queryString ? `?${queryString}` : ""
            }`;

            const response = await api.get<ApiResponse<ListPlansResponse>>(url);
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to fetch plans"
                );
            }
            return response.data.plans;
        },

        /**
         * Fetch a specific plan by team ID and season
         */
        async fetchPlan(
            teamId: string,
            season: string
        ): Promise<AssessmentPlan> {
            const url = `/teams/${teamId}/plan/${encodeURIComponent(season)}`;

            const response = await api.get<ApiResponse<GetPlanResponse>>(url);
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to fetch plan"
                );
            }
            return response.data;
        },

        /**
         * Create or update an assessment plan
         */
        async createOrUpdatePlan(
            teamId: string,
            input: CreateAssessmentPlanInput
        ): Promise<AssessmentPlan> {
            const response = await api.put<ApiResponse<CreatePlanResponse>>(
                `/teams/${teamId}/plans`,
                input
            );
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to create/update plan"
                );
            }
            return response.data;
        },

        /**
         * Toggle the active status of an assessment plan
         */
        async togglePlanStatus(
            teamId: string,
            season: string
        ): Promise<AssessmentPlan> {
            const response = await api.patch<ApiResponse<AssessmentPlan>>(
                `/teams/${teamId}/plan/${encodeURIComponent(season)}/status`
            );
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to toggle plan status"
                );
            }
            return response.data;
        },
    };
}
