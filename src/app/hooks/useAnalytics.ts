import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function useAnalytics() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [overview, salesTrend, regions, dealers, productMix, warranty, inventory, leads] = await Promise.all([
        apiClient.get("/analytics/overview"),
        apiClient.get("/analytics/sales-trend"),
        apiClient.get("/analytics/regions"),
        apiClient.get("/analytics/dealers"),
        apiClient.get("/analytics/product-mix"),
        apiClient.get("/analytics/warranty"),
        apiClient.get("/analytics/inventory-stats"),
        apiClient.get("/analytics/leads")
      ]);

      setData({
        overview: overview.data,
        salesTrend: salesTrend.data,
        regions: regions.data,
        dealers: dealers.data,
        productMix: productMix.data,
        warranty: warranty.data,
        inventory: inventory.data,
        leads: leads.data
      });
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const fetchLeadAnalytics = useCallback(async (range: string) => {
    if (!token) return;
    try {
      const response = await apiClient.get(`/analytics/leads?range=${range}`);
      setData((prev: any) => ({
        ...prev,
        leads: response.data
      }));
    } catch (err: any) {
      console.error("Failed to fetch lead analytics:", err);
    }
  }, [token]);

  return { data, isLoading, error, refetch: fetchAnalytics, fetchLeads: fetchLeadAnalytics };
}
