/**
 * Team API Client
 * API client functions for team management operations
 */

import type {
    Team,
    TeamWithDetails,
    CreateTeamRequest,
    AssignManagerRequest,
    ListTeamsQuery,
    ListTeamsResponse,
    ApiResponse,
} from "@/types/teams";

export interface UseApiReturn {
    get: <T = any>(url: string, options?: any) => Promise<T>;
    post: <T = any>(url: string, body?: any, options?: any) => Promise<T>;
    patch: <T = any>(url: string, body?: any, options?: any) => Promise<T>;
    delete: <T = any>(url: string, options?: any) => Promise<T>;
}

export function createTeamApi(api: UseApiReturn) {
    return {
        /**
         * Fetch all teams with optional filters
         */
        async fetchTeams(query?: ListTeamsQuery): Promise<ListTeamsResponse> {
            const params = new URLSearchParams();
            if (query?.search) params.append("search", query.search);
            if (query?.includeArchived !== undefined) {
                params.append("includeArchived", String(query.includeArchived));
            }
            if (query?.managerId) params.append("managerId", query.managerId);

            const queryString = params.toString();
            const url = `/admin/teams${queryString ? `?${queryString}` : ""}`;

            const response = await api.get<ApiResponse<ListTeamsResponse>>(url);
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to fetch teams"
                );
            }
            return response.data;
        },

        /**
         * Fetch a single team by ID
         */
        async fetchTeam(teamId: string): Promise<Team> {
            const response = await api.get<ApiResponse<Team>>(
                `/admin/teams/${teamId}`
            );
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to fetch team"
                );
            }
            return response.data;
        },

        /**
         * Create a new team
         */
        async createTeam(request: CreateTeamRequest): Promise<Team> {
            const response = await api.post<ApiResponse<Team>>(
                "/admin/teams",
                request
            );
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to create team"
                );
            }
            return response.data;
        },

        /**
         * T046: Update team manager (assign or unassign)
         */
        async updateTeamManager(
            teamId: string,
            managerId: string | null
        ): Promise<Team> {
            const response = await api.patch<ApiResponse<Team>>(
                `/admin/teams/${teamId}/manager`,
                { managerId } as AssignManagerRequest
            );
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to update team manager"
                );
            }
            return response.data;
        },

        /**
         * Fetch team members
         */
        async fetchTeamMembers(teamId: string): Promise<any[]> {
            const response = await api.get<ApiResponse<{ members: any[] }>>(
                `/admin/teams/${teamId}/members`
            );
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to fetch team members"
                );
            }
            return response.data.members;
        },
    };
}
