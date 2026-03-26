import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiClient.get("products");
      return response.data;
    },
  });
};

export const useWarehouses = () => {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await apiClient.get("warehouses");
      return response.data;
    },
  });
};

export const useProductDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get(`products/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
      const response = await apiClient.put(`products/${id}`, data, { headers });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", data._id] });
      toast.success("Product updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update product");
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete product");
    },
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiClient.post("products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add product");
    },
  });
};

export const useBulkAddProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (products: any[]) => {
      const response = await apiClient.post("products/bulk", products);
      return response.data;
    },
    onSuccess: (data) => {
      const { added, skipped } = data;
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Import Successful: ${added} added. ${skipped > 0 ? skipped + " duplicates skipped." : ""}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to bulk import products");
    },
  });
};
