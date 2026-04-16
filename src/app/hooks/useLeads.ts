import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export const useLeads = (page?: number, limit?: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["leads", user?.id, page, limit],
    queryFn: async () => {
      const res = await apiClient.get("/leads", {
        params: { page, limit }
      });
      // Unified format: { leads: Lead[], pagination: any }
      if (Array.isArray(res.data)) {
        return { leads: res.data, pagination: null };
      }
      return res.data;
    },
  });
};

export const useLeadDetail = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["leads", user?.id, id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/leads/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useAddLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post("/leads", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add lead");
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/leads/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.id] });
      toast.success("Lead updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update lead");
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, lossReason, lossNotes }: { id: string; status: string; lossReason?: string; lossNotes?: string }) => {
      const res = await apiClient.put(`/leads/${id}/status`, { status, lossReason, lossNotes });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.id] });
      toast.success(`Status updated to ${variables.status}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });
};

export const useAssignLeadDealer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dealerId, type }: { id: string; dealerId: string; type: string }) => {
      const res = await apiClient.put(`/leads/${id}/assign`, { dealerId, type });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.id] });
      toast.success("Lead assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to assign dealer");
    },
  });
};

export const useConvertLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/leads/${id}/convert`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead converted to customer!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to convert lead");
    },
  });
};

export const useAddLeadFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date, note }: { id: string; date: string; note: string }) => {
      const res = await apiClient.post(`/leads/${id}/followup`, { date, note });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.id] });
      toast.success("Follow-up scheduled");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to schedule follow-up");
    },
  });
};

export const useMarkFollowUpCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, followUpId }: { id: string; followUpId: string }) => {
      const res = await apiClient.patch(`/leads/${id}/followup/${followUpId}/complete`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.id] });
      toast.success("Follow-up marked as completed");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update follow-up");
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, dealerId, warehouseId, orderSource, products, buyerType, customerName }: { leadId?: string, dealerId?: string, warehouseId?: string, orderSource?: string, products?: any[], buyerType?: string, customerName?: string }) => {
      const res = await apiClient.post("/orders", { leadId, dealerId, warehouseId, orderSource, products, buyerType, customerName });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create order");
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/leads/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted successfully");
      navigate("/leads");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete lead");
    },
  });
};

/**
 * Search leads/customers by name for typeahead
 */
export const useSearchLeads = (query: string) => {
  return useQuery({
    queryKey: ["leads", "search", query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      const res = await apiClient.get("/leads/search", { params: { q: query } });
      return res.data;
    },
    enabled: query.length >= 1,
    staleTime: 30000,
  });
};
