/**
 * User Metadata React Query Hook
 * Hook for fetching user metadata (non-admin route)
 */

import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type { UserMeta } from "@/types/users";

interface GetUserMetaResponse {
    user: UserMeta;
}

/**
 * Hook for fetching user metadata by userId
 * Uses authenticated non-admin route /users/:userId
 *
 * @param userId - User ID (email) to fetch
 * @returns React Query result with user metadata
 */
export function useUserMeta(userId?: string) {
    const { get } = useApi();

    return useQuery({
        queryKey: ["userMeta", userId],
        queryFn: async () => {
            if (!userId) throw new Error("User ID is required");

            const response = await get<{ data: GetUserMetaResponse }>(
                `/users/${encodeURIComponent(userId)}`
            );

            if (!response.data?.user) {
                throw new Error("User data not found in response");
            }

            return response.data.user;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
}
