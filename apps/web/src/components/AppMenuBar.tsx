import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from "@/components/ui/menubar";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { User } from "@/types/users";
import type { ApiResponse } from "@/types/teams";

export function AppMenuBar() {
    const navigate = useNavigate();
    const { isAuthenticated, signOutUser } = useAuth();
    const { get } = useApi();

    // Fetch current user to check admin status
    const { data: currentUser } = useQuery<User>({
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

    const isAdmin = currentUser?.roles.includes("admin") ?? false;
    const isManager = currentUser?.roles.includes("manager") ?? false;

    return (
        <>
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>
                        <Menu className="h-4 w-4" />
                    </MenubarTrigger>
                    <MenubarContent>
                        {isManager && (
                            <>
                                <MenubarSeparator />
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                    Manager
                                </div>
                                <MenubarItem
                                    inset
                                    onClick={() =>
                                        navigate("/manager/my-teams")
                                    }
                                >
                                    My Teams
                                </MenubarItem>
                                <MenubarItem
                                    inset
                                    onClick={() =>
                                        navigate("/manager/assessment-plans")
                                    }
                                >
                                    Assessment Plans
                                </MenubarItem>
                            </>
                        )}
                        {isAdmin && (
                            <>
                                <MenubarSeparator />
                                {isAdmin && (
                                    <>
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            Administrator
                                        </div>
                                        <MenubarItem
                                            inset
                                            onClick={() =>
                                                navigate("/admin/users")
                                            }
                                        >
                                            Users
                                        </MenubarItem>
                                        <MenubarItem
                                            inset
                                            onClick={() =>
                                                navigate("/admin/teams")
                                            }
                                        >
                                            Teams
                                        </MenubarItem>
                                    </>
                                )}
                            </>
                        )}
                        <MenubarSeparator />
                        <MenubarItem onClick={signOutUser}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </>
    );
}
