import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { Order } from "../data/mockData";
import { apiClient } from "../api/client";
import { useAuth } from "./AuthContext";
import { useDealers } from "./DealerContext";

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (orderData: any) => Promise<Order>;
  getOrder: (id: string) => Promise<Order | undefined>;
  getOrdersByDealer: (dealerId: string) => Order[];
  uploadPODocument: (orderId: string, file: File) => Promise<Order>;
  uploadPaymentDocument: (orderId: string, file: File) => Promise<Order>;
  approveOrder: (orderId: string) => Promise<Order>;
  finalizeOrderApproval: (orderId: string) => Promise<Order>;
  uploadLovolInvoice: (orderId: string, file: File) => Promise<Order>;
  uploadDealerInvoice: (orderId: string, file: File) => Promise<Order>;
  updateDeliveryStatus: (orderId: string, deliveryData: any) => Promise<Order>;
  markOrderAsReceived: (orderId: string) => Promise<Order>;
  markInstallationComplete: (orderId: string) => Promise<Order>;
  registerWarranty: (orderId: string, formData: FormData) => Promise<Order>;
//   updateOrderStatus: (orderId: string, status: string, progress: number) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<Order>;
  uploadAdditionalDocument: (orderId: string, file: File, name: string) => Promise<Order>;
  deleteAdditionalDocument: (orderId: string, name: string) => Promise<Order>;
  deletePrimaryDocument: (orderId: string, type: string) => Promise<Order>;
  requestDocument: (orderId: string, name: string) => Promise<Order>;
  pagination: any;
  stats: any;
  refreshOrders: (page?: number, limit?: number) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { dealers, getDealer } = useDealers();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalOrders: 0, totalValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const mapOrder = useCallback((o: any): Order => {
    // Determine dealer name
    let dealerName = "Unknown Dealer";
    const dId = o.dealerId?._id || o.dealerId;

    if (o.dealerId && typeof o.dealerId === 'object') {
      dealerName = o.dealerId.companyName || o.dealerId.name || "Unknown Dealer";
      
      // If it's a distributor (stored as User model, indicated by buyerType "User"), 
      // add the suffix as requested.
      if (o.buyerType === "User") {
        dealerName = `${o.dealerId.name || "Distributor"} (Distributor)`;
      }
    } else if (o.dealer) {
      dealerName = o.dealer;
    }

    // Fallback to DealerContext if still unknown but we have an ID
    if (dealerName === "Unknown Dealer" && dId) {
      const foundDealer = getDealer(dId);
      if (foundDealer) {
        dealerName = foundDealer.companyName || foundDealer.name || "Unknown Dealer";
      }
    }

    // Determine primary product name
    let productName = "Unknown Product";
    if (o.products && o.products.length > 0) {
      const firstProduct = o.products[0].productId;
      productName = typeof firstProduct === 'object' ? (firstProduct.name || "Multiple Products") : "Multiple Products";
    } else if (o.productId && typeof o.productId === 'object') {
      productName = o.productId.name || "Unknown Product";
    } else if (o.product) {
      productName = o.product;
    }

    return {
      ...o,
      id: o._id || o.id,
      dealer: dealerName,
      dealerId: o.dealerId,
      product: productName,
      productId: o.products && o.products.length > 0
        ? o.products[0].productId
        : o.productId,
      quantity: o.products && o.products.length > 0
        ? o.products.reduce((acc: number, p: any) => acc + (p.quantity || 0), 0)
        : (o.quantity || 1),
      products: o.products?.map((p: any) => ({
        ...p,
        productId: p.productId?._id || p.productId,
        name: p.productId?.name || "Unknown Product",
        sku: p.productId?.sku || ""
      })) || [],
      orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split("T")[0] : (o.createdAt ? o.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
      paymentStatus: o.paymentStatus || "Pending",
      orderSource: o.orderSource || "Warehouse",
      readOnly: o.readOnly || false,
      createdBy: o.createdBy || null,
      customerName: o.customerName || "",
      leadId: o.leadId || null,
    };
  }, [getDealer]);

  const fetchOrders = useCallback(async (page = 1, limit = 10) => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiClient.get("/orders", {
        params: { page, limit }
      });
      
      const ordersData = Array.isArray(res.data) ? res.data : (res.data.orders || res.data.data || []);
      const paginationData = Array.isArray(res.data) ? null : res.data.pagination;
      const statsData = Array.isArray(res.data) ? { 
        totalOrders: ordersData.length, 
        totalValue: ordersData.reduce((acc: number, o: any) => acc + (Number(o.totalValue) || 0), 0) 
      } : res.data.stats;
      
      const mappedOrders = Array.isArray(ordersData) ? ordersData.map(mapOrder) : [];
      setOrders(mappedOrders);
      setPagination(paginationData);
      setStats(statsData || { totalOrders: mappedOrders.length, totalValue: mappedOrders.reduce((acc: number, o: any) => acc + (Number(o.totalValue) || 0), 0) });
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, mapOrder]);

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Re-map orders when dealers are loaded to fix "Unknown Dealer" race condition
  useEffect(() => {
    if (dealers.length > 0 && orders.length > 0) {
      const anyUnknown = orders.some(o => o.dealer === "Unknown Dealer");
      if (anyUnknown) {
        // We don't need to re-fetch, just re-map the existing raw data if we had it, 
        // but since we only store mapped orders, we might need a re-fetch or a local re-map.
        // For simplicity and correctness, let's just trigger a refresh.
        fetchOrders();
      }
    }
  }, [dealers.length]);

  const addOrder = useCallback(async (orderData: any) => {
    try {
      const res = await apiClient.post("/orders", orderData);
      const newOrder = mapOrder(res.data);
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (error) {
      console.error("Failed to add order:", error);
      throw error;
    }
  }, [mapOrder]);

  const getOrder = useCallback(async (id: string) => {
    // Check if it's a backend ID (usually 24 chars hex) or a mock ID
    if (id.length === 24) {
      try {
        const res = await apiClient.get(`/orders/${id}`);
        return mapOrder(res.data);
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      }
    }

    return orders.find((o) => o.id === id);
  }, [mapOrder, orders]);

  const getOrdersByDealer = useCallback((dealerId: string) => {
    return orders.filter(
      (o) => o.dealerId === dealerId || o.dealer === dealerId
    );
  }, [orders]);

  const uploadPODocument = async (orderId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("poDocument", file);
      const res = await apiClient.patch(`/orders/${orderId}/upload-po`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to upload PO:", error);
      throw error;
    }
  };

  const uploadPaymentDocument = async (orderId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("paymentDocument", file);
      const res = await apiClient.patch(`/orders/${orderId}/upload-payment`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to upload payment document:", error);
      throw error;
    }
  };

  const approveOrder = async (orderId: string) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/approve-payment`);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to approve payment:", error);
      throw error;
    }
  };

  const finalizeOrderApproval = async (orderId: string) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/approve-order`);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to finalize order approval:", error);
      throw error;
    }
  };

  const uploadLovolInvoice = async (orderId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("lovolInvoice", file);
      const res = await apiClient.patch(`/orders/${orderId}/upload-lovol-invoice`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to upload Lovol invoice:", error);
      throw error;
    }
  };

  const uploadDealerInvoice = async (orderId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("dealerInvoice", file);
      const res = await apiClient.patch(`/orders/${orderId}/upload-dealer-invoice`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to upload dealer invoice:", error);
      throw error;
    }
  };

  const updateDeliveryStatus = async (orderId: string, deliveryData: any) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/delivery-status`, deliveryData);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      throw error;
    }
  };

  const markOrderAsReceived = async (orderId: string) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/receive-order`);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to confirm order receipt:", error);
      throw error;
    }
  };

  const markInstallationComplete = async (orderId: string) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/complete-installation`);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to complete installation:", error);
      throw error;
    }
  };

  const registerWarranty = async (orderId: string, formData: FormData) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/register-warranty`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to register warranty:", error);
      throw error;
    }
  };

/*
  const updateOrderStatus = async (orderId: string, status: string, progress: number) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/status`, { status, progress });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to update order status:", error);
      throw error;
    }
  };
*/

  const cancelOrder = async (orderId: string) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/cancel`);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      throw error;
    }
  };

  const uploadAdditionalDocument = async (orderId: string, file: File, name: string) => {
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("name", name);
      const res = await apiClient.post(`/orders/${orderId}/additional-docs`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to upload additional document:", error);
      throw error;
    }
  };

  const deleteAdditionalDocument = async (orderId: string, name: string) => {
    try {
      const res = await apiClient.delete(`/orders/${orderId}/additional-docs/${encodeURIComponent(name)}`);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to delete additional document:", error);
      throw error;
    }
  };

  const deletePrimaryDocument = async (orderId: string, type: string) => {
    try {
      const res = await apiClient.delete(`/orders/${orderId}/primary-docs/${type}`);
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to delete primary document:", error);
      throw error;
    }
  };

  const requestDocument = async (orderId: string, name: string) => {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/request-doc`, { name });
      const updatedOrder = mapOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to request document:", error);
      throw error;
    }
  };

  const contextValue = useMemo(() => ({
    orders,
    pagination,
    isLoading,
    addOrder,
    getOrder,
    getOrdersByDealer,
    uploadPODocument,
    uploadPaymentDocument,
    approveOrder,
    finalizeOrderApproval,
    uploadLovolInvoice,
    uploadDealerInvoice,
    updateDeliveryStatus,
    markOrderAsReceived,
    markInstallationComplete,
    registerWarranty,
    // updateOrderStatus,
    cancelOrder,
    uploadAdditionalDocument,
    deleteAdditionalDocument,
    deletePrimaryDocument,
    requestDocument,
    refreshOrders: fetchOrders,
    stats
  }), [orders, pagination, stats, isLoading, addOrder, getOrder, getOrdersByDealer, fetchOrders, uploadPODocument, uploadPaymentDocument, approveOrder, finalizeOrderApproval, uploadLovolInvoice, uploadDealerInvoice, updateDeliveryStatus, markOrderAsReceived, markInstallationComplete, registerWarranty, cancelOrder, uploadAdditionalDocument, deleteAdditionalDocument, deletePrimaryDocument, requestDocument]);

  return (
    <OrderContext.Provider value={contextValue}>
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
