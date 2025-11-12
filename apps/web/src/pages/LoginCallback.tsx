import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth as useOidcAuth } from "react-oidc-context";
import { Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const LoginCallback = () => {
    const oidcAuth = useOidcAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Handle different authentication states
        if (oidcAuth.isLoading) {
            // Still processing authentication
            return;
        }

        if (oidcAuth.error) {
            // Authentication error occurred
            console.error("Authentication error:", oidcAuth.error);
            // Redirect to login page after a brief delay
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 3000);
            return;
        }

        if (oidcAuth.isAuthenticated) {
            // Successfully authenticated, redirect to home
            navigate("/", { replace: true });
        }
    }, [oidcAuth.isLoading, oidcAuth.isAuthenticated, oidcAuth.error, navigate]);

    // Show error state if authentication failed
    if (oidcAuth.error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-destructive">
                            Authentication Error
                        </CardTitle>
                        <CardDescription className="text-center">
                            There was a problem signing you in
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            {oidcAuth.error.message || "An unexpected error occurred"}
                        </p>
                        <p className="text-sm text-muted-foreground text-center">
                            Redirecting to login page...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show loading state while processing authentication
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {import.meta.env.VITE_BRANDING_APP_NAME ||
                            "Growth Planner"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        Completing sign in...
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginCallback;
