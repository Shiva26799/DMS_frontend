import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";

export const useProfileQuery = (token: string | null) => {
    return useQuery({
        queryKey: ["session"],
        queryFn: async () => {
            if (!token) return null;
            const response = await apiClient.get("auth/profile");
            return response.data;
        },
        enabled: !!token,
        retry: false,
        // Match the Senior Pattern: Fetch exactly once and keep it in cache
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
};
