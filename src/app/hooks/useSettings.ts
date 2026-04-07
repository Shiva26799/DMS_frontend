import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

// Company Info
export const useCompanyInfo = () => {
    return useQuery({
        queryKey: ["companyInfo"],
        queryFn: async () => {
            const res = await apiClient.get("settings/company");
            return res.data;
        },
    });
};

export const useUpdateCompanyInfo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.put("settings/company", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyInfo"] });
            toast.success("Company information saved successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to save company information");
        },
    });
};

export const useUpdateCompanyLogo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await apiClient.put("settings/company/logo", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyInfo"] });
            toast.success("Logo uploaded successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to upload logo");
        },
    });
};

// Users
export const useUsers = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["users", user?.id],
        queryFn: async () => {
            const res = await apiClient.get("settings/users");
            return res.data;
        },
    });
};

export const useAddUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.post("settings/users", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User added successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to add user");
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiClient.put(`settings/users/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update user");
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`settings/users/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete user");
        },
    });
};

// Settings Warehouses
export const useSettingsWarehouses = () => {
    return useQuery({
        queryKey: ["settingsWarehouses"],
        queryFn: async () => {
            const res = await apiClient.get("settings/warehouses");
            return res.data;
        },
    });
};

export const useAddWarehouse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.post("settings/warehouses", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settingsWarehouses"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] }); // also invalidate generic warehouses
            toast.success("Warehouse added successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to add warehouse");
        },
    });
};

export const useUpdateWarehouse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiClient.put(`settings/warehouses/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settingsWarehouses"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            toast.success("Warehouse updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update warehouse");
        },
    });
};

export const useDeleteWarehouse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`settings/warehouses/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settingsWarehouses"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            toast.success("Warehouse deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete warehouse");
        },
    });
};
