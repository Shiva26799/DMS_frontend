import React, { createContext, useContext, useState, ReactNode } from "react";
import { Dealer, mockDealers } from "../data/mockData";

interface DealerContextType {
  dealers: Dealer[];
  addDealer: (dealer: Dealer) => void;
  getDealer: (id: string) => Dealer | undefined;
}

const DealerContext = createContext<DealerContextType | undefined>(undefined);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [dealers, setDealers] = useState<Dealer[]>(mockDealers);

  const addDealer = (dealer: Dealer) => {
    setDealers((prev) => [dealer, ...prev]);
  };

  const getDealer = (id: string) => {
    return dealers.find((d) => d._id === id);
  };

  return (
    <DealerContext.Provider value={{ dealers, addDealer, getDealer }}>
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
