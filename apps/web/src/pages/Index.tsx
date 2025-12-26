import { Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageLayout } from "@/components/PageLayout";
import { MyTeamsView } from "@/components/manager/MyTeamsView";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * Main entry point - shows different content based on user role:
 * - Managers/Admins: My Teams view
 * - Regular users: Redirect to self-review
 */
const Index = () => {
  const { data: user, isLoading, error } = useCurrentUser();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Unable to Load Profile
          </h1>
          <p className="text-muted-foreground mb-4">
            {error?.message || "Failed to fetch user information."}
          </p>
          <p className="text-sm text-muted-foreground">
            Try refreshing the page. If the problem persists, contact support.
          </p>
        </div>
      </div>
    );
  }

  // Check if user has manager or admin role
  const hasManagerAccess =
    user.roles.includes("admin") || user.roles.includes("manager");

  // Managers see My Teams view
  if (hasManagerAccess) {
    return (
      <PageLayout
        title="My Teams"
        subtitle="View and manage members of teams you lead"
      >
        <div className="max-w-6xl mx-auto">
          <MyTeamsView />
        </div>
      </PageLayout>
    );
  }

  // Regular users redirect to self-review
  return <Navigate to={`/users/${user.userId}/review/self`} replace />;
};

export default Index;
