import React, { createContext, useContext, useState, ReactNode } from "react";
import { WarrantyClaim, mockWarrantyClaims } from "../data/mockData";

interface WarrantyContextType {
  claims: WarrantyClaim[];
  addClaim: (claim: WarrantyClaim) => void;
}

const WarrantyContext = createContext<WarrantyContextType | undefined>(undefined);

export function WarrantyProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<WarrantyClaim[]>(mockWarrantyClaims);

  const addClaim = (claim: WarrantyClaim) => {
    setClaims((prev) => [claim, ...prev]);
  };

  return (
    <WarrantyContext.Provider value={{ claims, addClaim }}>
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
