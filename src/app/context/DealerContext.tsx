import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Dealer } from "../data/mockData";
import { apiClient } from "../api/client";
import { useAuth } from "./AuthContext";

interface DealerContextType {
  dealers: Dealer[];
  addDealer: (dealer: any) => Promise<void>;
  getDealer: (id: string) => Dealer | undefined;
  approveDealer: (id: string, password: string) => Promise<void>;
  isLoading: boolean;
  refreshDealers: () => Promise<void>;
}

const DealerContext = createContext<DealerContextType | undefined>(undefined);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchDealers = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await apiClient.get("/dealers");
      // Map _id to id for frontend compatibility with existing components
      const mappedDealers = res.data.map((d: any) => ({
        ...d,
        id: d._id,
        name: d.companyName,
        performance: d.performanceScore || 0,
        city: d.address || "", // Assuming address contains city for now or fallback
        code: d.code || d._id.substring(d._id.length - 6).toUpperCase(), // Fallback code if not present
        status: d.status || "Pending", // Preserve exact status from backend
      }));
      setDealers(mappedDealers);
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [token]);

  const addDealer = async (dealerData: any) => {
    try {
      const res = await apiClient.post("/dealers/onboard", dealerData);
      const d = res.data;
      const newDealer = {
        ...d,
        id: d._id,
        name: d.companyName,
        performance: d.performanceScore || 0,
        city: d.address || "",
        code: d.code || d._id.substring(d._id.length - 6).toUpperCase(),
        status: d.status || "Pending",
      };
      setDealers((prev) => [newDealer, ...prev]);
    } catch (error) {
      console.error("Failed to add dealer:", error);
      throw error;
    }
  };

  const getDealer = (id: string) => {
    return dealers.find((d) => d.id === id);
  };

  const approveDealer = async (id: string, password: string) => {
    try {
      const res = await apiClient.put(`/dealers/${id}/approve`, { password });
      const mappedDealer = {
        ...res.data,
        id: res.data._id,
        name: res.data.companyName,
        status: res.data.status || "Approved"
      };
      setDealers((prev) => prev.map((d) => (d.id === id ? { ...d, ...mappedDealer } : d)));
    } catch (error) {
      console.error("Failed to approve dealer:", error);
      throw error;
    }
  };

  return (
    <DealerContext.Provider value={{ dealers, addDealer, getDealer, approveDealer, isLoading, refreshDealers: fetchDealers }}>
      {children}
    </DealerContext.Provider>
  );
}

export function useDealers() {
  const context = useContext(DealerContext);
  if (context === undefined) {
    throw new Error("useDealers must be used within a DealerProvider");
  }
  return context;
}
