import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
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
  updateDealer: (id: string, updates: any) => Promise<void>;
}

const DealerContext = createContext<DealerContextType | undefined>(undefined);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user, isDistributor, isDealer } = useAuth();

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
        phone: d.contact || "",
        email: d.email || "",
        contactPerson: d.ownerName || "",
        joinedDate: d.createdAt ? new Date(d.createdAt).toISOString().split("T")[0] : "",
        distributorName: d.metadata?.DistributorName || d.distributorId?.name || "Direct / None",
        performance: d.performanceScore || 0,
        city: d.address || "", // Assuming address contains city for now or fallback
        code: d.code || d._id.substring(d._id.length - 6).toUpperCase(), // Fallback code if not present
        status: d.status || "Pending", // Preserve exact status from backend
      }));
      setAllDealers(mappedDealers);
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [token]);

  // The backend already filters dealers based on roles (Distributor/Dealer).
  // So we can simply use the returned list 'allDealers'.
  const dealers = allDealers;

  const addDealer = async (dealerData: any) => {
    try {
      const res = await apiClient.post("/dealers/onboard", dealerData);
      const d = res.data;
      const newDealer = {
        ...d,
        id: d._id,
        name: d.companyName,
        phone: d.contact || "",
        email: d.email || "",
        contactPerson: d.ownerName || "",
        joinedDate: d.createdAt ? new Date(d.createdAt).toISOString().split("T")[0] : "",
        distributorName: d.metadata?.DistributorName || d.distributorId?.name || "Direct / None",
        performance: d.performanceScore || 0,
        city: d.address || "",
        code: d.code || d._id.substring(d._id.length - 6).toUpperCase(),
        status: d.status || "Pending",
      };
      setAllDealers((prev) => [newDealer, ...prev]);
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
        phone: res.data.contact || "",
        email: res.data.email || "",
        contactPerson: res.data.ownerName || "",
        joinedDate: res.data.createdAt ? new Date(res.data.createdAt).toISOString().split("T")[0] : "",
        distributorName: res.data.metadata?.DistributorName || res.data.distributorId?.name || "Direct / None",
        status: res.data.status || "Approved"
      };
      setAllDealers((prev) => prev.map((d) => (d.id === id ? { ...d, ...mappedDealer } : d)));
    } catch (error) {
      console.error("Failed to approve dealer:", error);
      throw error;
    }
  };

  const updateDealer = async (id: string, updates: any) => {
    try {
      const res = await apiClient.patch(`/dealers/${id}`, updates);
      setAllDealers((prev) => prev.map((d) => (d.id === id ? { ...d, ...res.data, id: res.data._id } : d)));
    } catch (error) {
      console.error("Failed to update dealer:", error);
      throw error;
    }
  };

  return (
    <DealerContext.Provider value={{ dealers, addDealer, getDealer, approveDealer, updateDealer, isLoading, refreshDealers: fetchDealers }}>
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
