/**
 * OIDC Configuration for AWS Cognito
 *
 * Set up environment variables in .env file:
 * - VITE_COGNITO_REGION
 * - VITE_COGNITO_USER_POOL_ID
 * - VITE_COGNITO_USER_POOL_CLIENT_ID
 * - VITE_COGNITO_DOMAIN
 */

import { AuthProviderProps } from "react-oidc-context";

const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || "";
const region = import.meta.env.VITE_COGNITO_REGION || "";
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || "";
const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || "";

// Construct the OIDC issuer URL from Cognito User Pool
const authority = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

export const oidcConfig: AuthProviderProps = {
    authority,
    client_id: clientId,
    redirect_uri: `${window.location.origin}/login/callback`,
    post_logout_redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid email profile",

    // Use Cognito's hosted UI for authentication
    // This will redirect to the Microsoft identity provider configured in Cognito
    metadata: {
        authorization_endpoint: `https://${cognitoDomain}/oauth2/authorize`,
        token_endpoint: `https://${cognitoDomain}/oauth2/token`,
        end_session_endpoint: `https://${cognitoDomain}/logout`,
        userinfo_endpoint: `https://${cognitoDomain}/oauth2/userInfo`,
        issuer: authority,
    },

    // Automatically sign in silent when tokens expire
    automaticSilentRenew: true,

    // Load user info after authentication
    loadUserInfo: true,

    // Handle authentication callbacks
    onSigninCallback: () => {
        // Remove the code and state from the URL after successful sign-in
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );
    },
};
