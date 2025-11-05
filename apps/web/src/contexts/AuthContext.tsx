import React, { createContext, useContext } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";

interface AuthContextType {
    user: any | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOutUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const oidcAuth = useOidcAuth();

    const signIn = async () => {
        try {
            await oidcAuth.signinRedirect();
        } catch (error) {
            console.error("Error signing in:", error);
            throw error;
        }
    };

    const signOutUser = async () => {
        try {
            await oidcAuth.signoutRedirect();
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user: oidcAuth.user?.profile || null,
                loading: oidcAuth.isLoading,
                signIn,
                signOutUser,
                isAuthenticated: oidcAuth.isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
