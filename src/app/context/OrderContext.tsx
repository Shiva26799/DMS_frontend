import React, { createContext, useContext, useState, ReactNode } from "react";
import { Order, mockOrders } from "../data/mockData";

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrdersByDealer: (dealerId: string) => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const getOrdersByDealer = (dealerId: string) => {
    return orders.filter((o) => o.dealerId === dealerId);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, getOrdersByDealer }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
