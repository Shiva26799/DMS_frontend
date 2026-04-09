import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export const useOwnInventory = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["inventory", "own", page, limit],
    queryFn: async () => {
      const response = await apiClient.get(`inventory/own?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useWarehouseInventory = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["inventory", "warehouse", page, limit],
    queryFn: async () => {
      const response = await apiClient.get(`inventory/warehouse?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useSubordinateInventory = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["inventory", "subordinates", page, limit],
    queryFn: async () => {
      const response = await apiClient.get(`inventory/subordinates?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useUpdateInventoryStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { productId: string; ownerType: string; ownerId: string; quantity: number|string; type: 'add' | 'subtract' | 'set' }) => {
      const response = await apiClient.post("inventory/update", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update inventory");
    },
  });
};

export const useVisibleWarehouses = () => {
  return useQuery({
    queryKey: ["inventory", "visible-warehouses"],
    queryFn: async () => {
      const response = await apiClient.get("inventory/warehouses");
      return response.data;
    },
  });
};
