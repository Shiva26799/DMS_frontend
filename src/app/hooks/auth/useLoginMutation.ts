import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../api/client";

export const useLoginMutation = () => {
    return useMutation({
        mutationFn: async (credentials: any) => {
            const response = await apiClient.post("auth/login", credentials);
            return response.data;
        },
    });
};
