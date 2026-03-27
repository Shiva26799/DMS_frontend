import { useQuery } from "@tanstack/react-query";
import { mockCustomers } from "../data/mockData";

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockCustomers;
    },
  });
};
