import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LoginCallback from "./pages/LoginCallback";
import NotFound from "./pages/NotFound";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminTeamsPage from "./pages/AdminTeamsPage";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login/callback" element={<LoginCallback />} />
            <Route path="/login" element={<Login />} />
            <Route
                path="/admin/users"
                element={
                    <AdminRoute>
                        <AdminUsersPage />
                    </AdminRoute>
                }
            />
            <Route
                path="/admin/teams"
                element={
                    <AdminRoute>
                        <AdminTeamsPage />
                    </AdminRoute>
                }
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Index />
                    </ProtectedRoute>
                }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};
