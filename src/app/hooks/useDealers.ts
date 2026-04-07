import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

export const useDealers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dealers", user?.id],
    queryFn: async () => {
      const res = await apiClient.get("/dealers");
      return res.data;
    },
  });
};
