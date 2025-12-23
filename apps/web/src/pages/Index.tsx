import { AssessmentContainer } from "@/components/assessment/AssessmentContainer";
import { useApi } from "@/hooks/useApi";
import { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";

/**
 * Main entry point for the career ladder assessment application.
 * Renders the assessment container.
 */
const Index = () => {
    const wasInit = useRef(false);
    const { user, isAuthenticated } = useAuth();
    const { get } = useApi();

    useEffect(() => {
        const getMyDetails = async () => {
            const response = await get("/users/me");
            console.log(response);
            wasInit.current = true;
        };

        if (!wasInit.current && isAuthenticated && user) {
            getMyDetails();
        }
    }, [isAuthenticated, user]);

    return <AssessmentContainer />;
};

export default Index;
