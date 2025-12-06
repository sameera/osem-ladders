import React, { useRef } from "react";
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
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import type { User } from "@/types/users";
import type { ApiResponse } from "@/types/teams";

interface AppMenuBarProps {
    onNewAssessment?: () => void;
    onOpenAssessment?: (data: any) => void;
}

export function AppMenuBar({
    onNewAssessment,
    onOpenAssessment,
}: AppMenuBarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
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

    const handleOpenClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    onOpenAssessment(data);
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Invalid JSON file format");
                }
            };
            reader.readAsText(file);
        } else {
            alert("Please select a valid JSON file");
        }
        // Reset the input value so the same file can be selected again
        event.target.value = "";
    };

    return (
        <>
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>
                        <Menu className="h-4 w-4" />
                    </MenubarTrigger>
                    <MenubarContent>
                        {onNewAssessment && onOpenAssessment && (
                            <>
                                <MenubarItem onClick={onNewAssessment}>
                                    New assessment...
                                </MenubarItem>
                                <MenubarItem onClick={handleOpenClick}>
                                    Open assessment...
                                </MenubarItem>
                            </>
                        )}
                        {isManager && (
                            <>
                                <MenubarSeparator />
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                    Manager
                                </div>
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
                                {onNewAssessment && onOpenAssessment && (
                                    <MenubarSeparator />
                                )}
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
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
            {onOpenAssessment && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
            )}
        </>
    );
}
