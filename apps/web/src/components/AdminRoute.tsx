import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import type { User } from "@/types/users";
import type { ApiResponse } from "@/types/teams";

interface AdminRouteProps {
    children: React.ReactNode;
}

/**
 * AdminRoute Component
 * Protects routes that require admin role
 *
 * Checks:
 * 1. User is authenticated
 * 2. User has 'admin' role in their DynamoDB profile
 * 3. User account is active
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { get } = useApi();

    // Fetch current user profile to check roles
    const {
        data: currentUser,
        isLoading: userLoading,
        error,
    } = useQuery<User>({
        queryKey: ["currentUser"],
        queryFn: async () => {
            const response = await get<ApiResponse<User>>("/users/me");
            if (!response.data) {
                throw new Error("User data not found in response");
            }
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: false,
    });

    if (authLoading || userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (error || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-600">
                        Unable to verify your permissions.
                    </p>
                    <Navigate to="/" replace />
                </div>
            </div>
        );
    }

    // Check if user has admin role
    const isAdmin = currentUser.roles.includes("admin");

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-600">
                        You do not have permission to access this page.
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                        <a href="/" className="text-blue-600 hover:underline">
                            Return to Home
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    // Check if user is active
    if (!currentUser.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">
                        Account Inactive
                    </h1>
                    <p className="text-gray-600">
                        Your account has been deactivated.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminRoute;
