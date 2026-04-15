import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";
import { Dealer } from "../data/mockData";
import { apiClient } from "../api/client";
import { useAuth } from "./AuthContext";

interface DealerContextType {
  dealers: Dealer[];
  addDealer: (dealer: any) => Promise<void>;
  getDealer: (id: string) => Dealer | undefined;
  approveDealer: (id: string, password: string) => Promise<void>;
  isLoading: boolean;
  pagination: any;
  refreshDealers: (page?: number, limit?: number) => Promise<void>;
  updateDealer: (id: string, updates: any) => Promise<void>;
}

const DealerContext = createContext<DealerContextType | undefined>(undefined);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user, isDistributor, isDealer } = useAuth();

  const fetchDealers = useCallback(async (page = 1, limit = 10) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await apiClient.get("/dealers", {
        params: { page, limit }
      });
      
      const dealersData = Array.isArray(res.data) ? res.data : (res.data.dealers || res.data.data || []);
      const paginationData = Array.isArray(res.data) ? null : res.data.pagination;
      
      // Map _id to id for frontend compatibility with existing components
      const mappedDealers = Array.isArray(dealersData) ? dealersData.map((d: any) => ({
        ...d,
        id: d._id,
        name: d.companyName,
        phone: d.contact || "",
        email: d.email || "",
        contactPerson: d.ownerName || "",
        joinedDate: d.createdAt ? new Date(d.createdAt).toISOString().split("T")[0] : "",
        distributorName: d.distributorId?.name || "Direct / None",
        performance: d.performanceScore || 0,
        city: d.address || "",
        code: d.code || d._id.substring(d._id.length - 6).toUpperCase(),
        status: d.status || "Pending",
      })) : [];
      setAllDealers(mappedDealers);
      setPagination(paginationData);
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDealers();
  }, [token]);

  // The backend already filters dealers based on roles (Distributor/Dealer).
  // So we can simply use the returned list 'allDealers'.
  const dealers = allDealers;

  const addDealer = useCallback(async (dealerData: any) => {
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
        distributorName: d.distributorId?.name || "Direct / None",
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
  }, []);

  const getDealer = useCallback((id: string) => {
    return dealers.find((d) => d.id === id);
  }, [dealers]);

  const approveDealer = useCallback(async (id: string, password: string) => {
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
        distributorName: res.data.distributorId?.name || "Direct / None",
        status: res.data.status || "Approved"
      };
      setAllDealers((prev) => prev.map((d) => (d.id === id ? { ...d, ...mappedDealer } : d)));
    } catch (error) {
      console.error("Failed to approve dealer:", error);
      throw error;
    }
  }, []);

  const updateDealer = useCallback(async (id: string, updates: any) => {
    try {
      const res = await apiClient.patch(`/dealers/${id}`, updates);
      setAllDealers((prev) => prev.map((d) => (d.id === id ? { ...d, ...res.data, id: res.data._id } : d)));
    } catch (error) {
      console.error("Failed to update dealer:", error);
      throw error;
    }
  }, []);

  const contextValue = useMemo(() => ({
    dealers,
    pagination,
    addDealer,
    getDealer,
    approveDealer,
    updateDealer,
    isLoading,
    refreshDealers: fetchDealers
  }), [dealers, pagination, addDealer, getDealer, approveDealer, updateDealer, isLoading, fetchDealers]);

  return (
    <DealerContext.Provider value={contextValue}>
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
