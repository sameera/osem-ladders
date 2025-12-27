import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider as OidcAuthProvider } from "react-oidc-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { oidcConfig } from "@/config/oidc";
import { queryClient } from "@/config/queryClient";
import { AppRoutes } from "./router";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <OidcAuthProvider {...oidcConfig}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </OidcAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
