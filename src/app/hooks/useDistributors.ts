import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
 
export const useDistributors = () => {
  return useQuery({
    queryKey: ["distributors"],
    queryFn: async () => {
      const res = await apiClient.get("/settings/users");
      // Map distributors to ensure UI picks up the correct name
      return res.data.filter((user: any) => user.role === "Distributor");
    },
  });
};
