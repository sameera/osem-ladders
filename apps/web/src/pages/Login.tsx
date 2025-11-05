import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Login = () => {
    const { signIn, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If already authenticated, redirect to home
        if (isAuthenticated && !loading) {
            navigate("/");
        }
    }, [isAuthenticated, loading, navigate]);

    const handleSignIn = async () => {
        try {
            await signIn();
        } catch (error) {
            console.error("Sign in error:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {import.meta.env.VITE_BRANDING_APP_NAME ||
                            "Growth Planner"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        Sign in with your Microsoft 365 account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleSignIn} className="w-full" size="lg">
                        <svg
                            className="mr-2 h-5 w-5"
                            viewBox="0 0 23 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M11 11H0V0h11v11z" fill="#f25022" />
                            <path d="M23 11H12V0h11v11z" fill="#7fba00" />
                            <path d="M11 23H0V12h11v11z" fill="#00a4ef" />
                            <path d="M23 23H12V12h11v11z" fill="#ffb900" />
                        </svg>
                        Sign in with Microsoft
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
