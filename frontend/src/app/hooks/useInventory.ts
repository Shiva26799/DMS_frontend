import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export const useOwnInventory = ({ search, category, status, page, limit, enabled = true }: { search?: string, category?: string, status?: string, page?: number, limit?: number, enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["inventory", "own", search, category, status, page, limit],
    queryFn: async () => {
      const res = await apiClient.get("/inventory/own", {
        params: { search, category, status, page, limit }
      });
      return res.data;
    },
    enabled: !!enabled,
  });
};

export const useWarehouseInventory = ({ warehouseId, search, category, status, page, limit, enabled = true }: { warehouseId?: string, search?: string, category?: string, status?: string, page?: number, limit?: number, enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["inventory", "warehouse", warehouseId, search, category, status, page, limit],
    queryFn: async () => {
      const res = await apiClient.get("/inventory/warehouse", {
        params: { warehouseId, search, category, status, page, limit }
      });
      return res.data;
    },
    enabled: (!!warehouseId || warehouseId === undefined) && !!enabled,
  });
};

export const useSubordinateDealerInventory = ({ page, limit, ownerType, dealerId, search, category, status, enabled = true }: { page?: number, limit?: number, ownerType?: string, dealerId?: string, search?: string, category?: string, status?: string, enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["inventory", "subordinate", page, limit, ownerType, dealerId, search, category, status],
    queryFn: async () => {
      const res = await apiClient.get("/inventory/subordinate", {
        params: { 
          page, 
          limit, 
          ownerType: ownerType === 'all' ? undefined : ownerType,
          dealerId: dealerId === 'all' ? undefined : dealerId,
          search,
          category,
          status
        }
      });
      return res.data;
    },
    enabled: !!enabled,
  });
};

export const useBulkUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ 
      productId: string; 
      ownerType: string; 
      ownerId: string; 
      quantity: number|string; 
      type: 'add' | 'subtract' | 'set' | 'delete';
      binLocation?: string;
      minStockLevel?: number;
    }>) => {
      const response = await apiClient.post("inventory/bulk-update", items);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      if (data.failed > 0) {
        toast.warning(`Updated ${data.success} items, but ${data.failed} failed.`);
      } else {
        toast.success(`Successfully updated ${data.success} items`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update inventory");
    },
  });
};

export const useUpdateInventoryStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      productId: string; 
      ownerType: string; 
      ownerId: string; 
      quantity: number|string; 
      type: 'add' | 'subtract' | 'set' | 'delete';
      binLocation?: string;
      minStockLevel?: number;
    }) => {
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
