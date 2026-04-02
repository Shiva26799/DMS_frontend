import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import axios from "axios";
import { Dealer, Product } from "../data/mockData";

// Using unified WarrantyClaim interface matching the backend
export interface WarrantyClaim {
  _id: string;
  claimNumber: string;
  orderId?: string;
  dealerId: Dealer;
  productId: Product;
  machineSerialNumber: string;
  engineNumber?: string;
  issueDescription: string;
  technicianName?: string;
  inspectionNotes?: string;
  media: Array<{ url: string; type: string; uploadedAt: Date }>;
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
  fetchClaims: () => Promise<void>;
  getClaim: (id: string) => Promise<WarrantyClaim | null>;
  createClaim: (formData: any) => Promise<WarrantyClaim>;
  updateClaimStatus: (id: string, data: { status: string; note?: string; extraData?: any }) => Promise<WarrantyClaim>;
  uploadMedia: (id: string, file: File) => Promise<WarrantyClaim>;
}

const WarrantyContext = createContext<WarrantyContextType | undefined>(undefined);

const API_URL = "http://localhost:5000/api/warranty";

export function WarrantyProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClaims = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL);
      setClaims(response.data);
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const getClaim = async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch claim detail:", error);
      return null;
    }
  };

  const createClaim = async (formData: any) => {
    const response = await axios.post(API_URL, formData);
    const newClaim = response.data;
    setClaims((prev) => [newClaim, ...prev]);
    return newClaim;
  };

  const updateClaimStatus = async (id: string, data: { status: string; note?: string; extraData?: any }) => {
    const response = await axios.patch(`${API_URL}/${id}/status`, data);
    const updatedClaim = response.data;
    setClaims((prev) => prev.map((c) => (c._id === id ? updatedClaim : c)));
    return updatedClaim;
  };

  const uploadMedia = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("media", file);
    const response = await axios.post(`${API_URL}/${id}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    const updatedClaim = response.data;
    setClaims((prev) => prev.map((c) => (c._id === id ? updatedClaim : c)));
    return updatedClaim;
  };

  return (
    <WarrantyContext.Provider value={{ 
      claims, 
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
  if (context === undefined) {
    throw new Error("useWarranty must be used within a WarrantyProvider");
  }
  return context;
}
