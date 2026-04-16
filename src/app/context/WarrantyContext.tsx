import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { apiClient } from "../api/client";
import { useAuth } from "./AuthContext";
import { Dealer, Product } from "../data/mockData";

// Using unified WarrantyClaim interface matching the backend
export interface WarrantyClaim {
  _id: string;
  claimNumber: string;
  orderId?: string;
  buyerType?: string;
  dealerId: Dealer;
  distributorId?: { _id: string; name: string };
  productId: Product;
  machineSerialNumber: string;
  engineNumber?: string;
  issueDescription: string;
  customerName?: string;
  technicianName?: string;
  inspectionNotes?: string;
  evaluationNotes?: string;
  installationNotes?: string;
  hoApproval?: {
    status: string;
    approvedBy?: string;
    approvedAt?: Date;
    notes?: string;
  };
  media: Array<{ url: string; type: string; stage?: string; notes?: string; uploadedAt: Date }>;
  partsRequested: Array<{ partName: string; partNumber: string; quantity: number; status: string }>;
  dispatchDetails?: { transportName: string; trackingId: string; dispatchedAt: Date };
  status: string;
  stageProgress: number;
  activityLog: Array<{ action: string; note: string; performedBy: string; timestamp: Date }>;
  createdAt: string;
  updatedAt: string;
}

interface WarrantyContextType {
  claims: WarrantyClaim[];
  isLoading: boolean;
  pagination: any;
  fetchClaims: (page?: number, limit?: number) => Promise<void>;
  getClaim: (id: string) => Promise<WarrantyClaim | null>;
  createClaim: (formData: any) => Promise<WarrantyClaim>;
  updateClaimStatus: (id: string, data: { status: string; note?: string; extraData?: any }) => Promise<WarrantyClaim>;
  uploadMedia: (id: string, file: File, stage?: string, notes?: string) => Promise<WarrantyClaim>;
}

const WarrantyContext = createContext<WarrantyContextType | undefined>(undefined);

export function WarrantyProvider({ children }: { children: ReactNode }) {
  console.log("WarrantyProvider Rendering, children present:", !!children);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const fetchClaims = useCallback(async (page = 1, limit = 10) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await apiClient.get("/warranty", {
        params: { page, limit }
      });
      const claimsData = Array.isArray(response.data) ? response.data : (response.data.claims || response.data.data || []);
      const paginationData = Array.isArray(response.data) ? null : response.data.pagination;
      
      setClaims(claimsData);
      setPagination(paginationData);
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const getClaim = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/warranty/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch claim detail:", error);
      return null;
    }
  }, []);

  const createClaim = useCallback(async (formData: any) => {
    const response = await apiClient.post("/warranty", formData);
    const newClaim = response.data;
    setClaims((prev) => [newClaim, ...prev]);
    return newClaim;
  }, []);

  const updateClaimStatus = useCallback(async (id: string, data: { status: string; note?: string; extraData?: any }) => {
    const response = await apiClient.patch(`/warranty/${id}/status`, data);
    const updatedClaim = response.data;
    setClaims((prev) => prev.map((c) => (c._id === id ? updatedClaim : c)));
    return updatedClaim;
  }, []);

  const uploadMedia = useCallback(async (id: string, file: File, stage?: string, notes?: string) => {
    const formData = new FormData();
    formData.append("media", file);
    if (stage) formData.append("stage", stage);
    if (notes) formData.append("notes", notes);
    
    const response = await apiClient.post(`/warranty/${id}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    const updatedClaim = response.data;
    setClaims((prev) => prev.map((c) => (c._id === id ? updatedClaim : c)));
    return updatedClaim;
  }, []);

  return (
    <WarrantyContext.Provider value={{
      claims,
      pagination,
      isLoading,
      fetchClaims,
      getClaim,
      createClaim,
      updateClaimStatus,
      uploadMedia
    }}>
      {children}
    </WarrantyContext.Provider>
  );
}

export function useWarranty() {
  const context = useContext(WarrantyContext);
  console.log("useWarranty call, context:", context ? "Defined" : "UNDEFINED");
  if (context === undefined) {
    throw new Error("useWarranty must be used within a WarrantyProvider");
  }
  return context;
}
