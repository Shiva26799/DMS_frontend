import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export const useDealers = () => {
  return useQuery({
    queryKey: ["dealers"],
    queryFn: async () => {
      const res = await apiClient.get("/dealers");
      return res.data;
    },
  });
};

export const useDealer = (id: string) => {
    return useQuery({
        queryKey: ["dealer", id],
        queryFn: async () => {
            const res = await apiClient.get(`/dealers/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};

export const useAddDealer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.post("/dealers/onboard", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dealers"] });
            toast.success("Dealer added successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add dealer");
        }
    });
};

export const useApproveDealer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiClient.patch(`/dealers/${id}/approve`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dealers"] });
            toast.success("Dealer approved successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to approve dealer");
        }
    });
};
