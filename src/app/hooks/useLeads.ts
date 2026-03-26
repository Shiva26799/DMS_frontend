import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export const useLeads = () => {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await apiClient.get("/leads");
      return res.data;
    },
  });
};

export const useLeadDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ["leads", id],
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
    mutationFn: async ({ id, dealerId, dealerName }: { id: string; dealerId: string; dealerName: string }) => {
      const res = await apiClient.put(`/leads/${id}/assign`, { dealerId, dealerName });
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
    mutationFn: async (leadId: string) => {
      const res = await apiClient.post("/orders/from-lead", { leadId });
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
