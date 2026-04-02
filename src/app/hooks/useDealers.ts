import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export const useDealers = () => {
  return useQuery({
    queryKey: ["dealers"],
    queryFn: async () => {
      const res = await apiClient.get("/dealers");
      return res.data;
    },
  });
};
