/**
 * Team API Client
 * API client functions for team management operations
 */

import type {
    Team,
    TeamWithDetails,
    CreateTeamRequest,
    UpdateTeamRequest,
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
         * Fetch a single team by ID (admin endpoint)
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
         * Fetch a single team by ID (non-admin endpoint)
         * Accessible by team members, managers, or admins
         */
        async fetchTeamAsMember(teamId: string): Promise<Team> {
            const response = await api.get<ApiResponse<Team>>(
                `/teams/${teamId}`
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
         * Update team details (name only in Phase 1)
         */
        async updateTeam(
            teamId: string,
            request: UpdateTeamRequest
        ): Promise<Team> {
            const response = await api.patch<ApiResponse<Team>>(
                `/admin/teams/${teamId}`,
                request
            );
            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to update team"
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

        /**
         * Add members to team
         */
        async addTeamMembers(
            teamId: string,
            userIds: string[]
        ): Promise<void> {
            const response = await api.post<ApiResponse<void>>(
                `/admin/teams/${teamId}/members`,
                { userIds }
            );
            if (!response.success) {
                throw new Error(
                    response.error?.message || "Failed to add team members"
                );
            }
        },

        /**
         * Remove member from team
         */
        async removeTeamMember(
            teamId: string,
            userId: string
        ): Promise<void> {
            const response = await api.delete<ApiResponse<void>>(
                `/admin/teams/${teamId}/members/${encodeURIComponent(userId)}`
            );
            if (!response.success) {
                throw new Error(
                    response.error?.message || "Failed to remove team member"
                );
            }
        },
    };
}
