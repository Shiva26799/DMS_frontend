import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export const useCustomers = (page?: number, limit?: number, search?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customers", user?.id, page, limit, search],
    queryFn: async () => {
      const res = await apiClient.get("/customers", {
        params: { page, limit, search }
      });
      return res.data;
    },
  });
};

export const useCustomerDetail = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customers", user?.id, id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/customers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
      toast.success("Customer updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update customer");
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/customers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
      navigate("/customers");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete customer");
    },
  });
};
