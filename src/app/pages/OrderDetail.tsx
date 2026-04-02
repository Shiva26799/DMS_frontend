import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Upload, CheckCircle, Clock, Eye, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Order } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { useOrders } from "../context/OrderContext";
import { useDealers } from "../context/DealerContext";
import { useAuth } from "../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

import { Skeleton } from "../components/ui/skeleton";

export function OrderDetail() {
  const { id } = useParams();
  const { 
    getOrder, 
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
    updateOrderStatus,
    cancelOrder
  } = useOrders();
  const { getDealer } = useDealers();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delivery form state
  const [transportName, setTransportName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");

  // Warranty form state
  const [machineSerialNumber, setMachineSerialNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [maintenanceMonths, setMaintenanceMonths] = useState<number>(6);
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [warrantyDocument, setWarrantyDocument] = useState<File | null>(null);

  // Auto-calculate warranty end date
  useEffect(() => {
    if (warrantyStartDate && warrantyMonths) {
      const start = new Date(warrantyStartDate);
      const end = new Date(start.setMonth(start.getMonth() + Number(warrantyMonths)));
      setWarrantyEndDate(end.toISOString().split("T")[0]);
    }
  }, [warrantyStartDate, warrantyMonths]);

  // Pre-fill from order product data if available
  useEffect(() => {
    if (order && order.productId) {
      // In a real app we'd fetch the product details or check the order.products array
      const firstProduct = order.products?.[0];
      // Try to find default warranty from master data if it was a mock product or similar
      // For now, let's just stick with defaults or what's in the order
    }
  }, [order]);
  
  // Document Viewing State
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (id) {
        const foundOrder = await getOrder(id);
        setOrder(foundOrder || null);
      }
      setIsLoading(false);
    };
    fetchOrder();
  }, [id, getOrder]);

  const dealer = order ? getDealer(order.dealerId) : null;

  const handleFileUpload = async (type: "PO" | "Payment" | "LovolInvoice" | "DealerInvoice", file: File) => {
    if (!order || !order.id) return;

    try {
      setIsUploading(true);
      let updatedOrder;
      if (type === "PO") {
        updatedOrder = await uploadPODocument(order.id, file);
      } else if (type === "Payment") {
        updatedOrder = await uploadPaymentDocument(order.id, file);
      } else if (type === "LovolInvoice") {
        updatedOrder = await uploadLovolInvoice(order.id, file);
      } else {
        updatedOrder = await uploadDealerInvoice(order.id, file);
      }
      setOrder(updatedOrder);
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApprove = async () => {
    if (!order || !order.id) return;
    try {
      setIsProcessing(true);
      const updatedOrder = await approveOrder(order.id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to approve payment:", error);
      alert("Failed to verify payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalApprove = async () => {
    if (!order || !order.id) return;
    try {
      setIsProcessing(true);
      const updatedOrder = await finalizeOrderApproval(order.id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to approve order:", error);
      alert("Failed to approve order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDelivery = async () => {
    if (!order || !order.id) return;
    if (!transportName || !trackingId || !estimatedDeliveryDate) {
      alert("Please fill in all delivery details");
      return;
    }
    
    try {
      setIsProcessing(true);
      const updatedOrder = await updateDeliveryStatus(order.id, {
        transportName,
        trackingId,
        estimatedDeliveryDate
      });
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to update delivery:", error);
      alert("Failed to update delivery status. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!order || !order.id) return;
    try {
      setIsProcessing(true);
      const updatedOrder = await markOrderAsReceived(order.id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to confirm receipt:", error);
      alert("Failed to confirm receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstallationComplete = async () => {
    if (!order || !order.id) return;
    try {
      setIsProcessing(true);
      const updatedOrder = await markInstallationComplete(order.id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to complete installation:", error);
      alert("Failed to complete installation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterWarranty = async () => {
    if (!order || !order.id) return;
    if (!machineSerialNumber) {
      alert("Machine Serial Number is required.");
      return;
    }
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append("machineSerialNumber", machineSerialNumber);
      if (engineNumber) formData.append("engineNumber", engineNumber);
      if (warrantyStartDate) formData.append("warrantyStartDate", warrantyStartDate);
      if (warrantyEndDate) formData.append("warrantyEndDate", warrantyEndDate);
      if (warrantyMonths) formData.append("warrantyMonths", String(warrantyMonths));
      if (maintenanceMonths) formData.append("maintenanceMonths", String(maintenanceMonths));
      if (warrantyDocument) formData.append("warrantyDocument", warrantyDocument);

      const updatedOrder = await registerWarranty(order.id, formData);
      setOrder(updatedOrder);
      alert("Warranty successfully registered!");
    } catch (error) {
      console.error("Failed to register warranty:", error);
      alert("Failed to register warranty. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !order.id) return;
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    try {
      setIsProcessing(true);
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
      alert("Order has been cancelled.");
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      alert(error.response?.data?.message || "Failed to cancel order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStageJump = async (stageName: string, progress: number) => {
    if (!order || !order.id) return;
    if (order.currentStage === stageName) return;
    
    if (!window.confirm(`Are you sure you want to jump to stage: ${stageName}?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const updatedOrder = await updateOrderStatus(order.id, stageName, progress);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to jump stage:", error);
      alert("Failed to update stage. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!order || !dealer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
          <Link to="/orders" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const STAGE_NAMES = [
    "PO Upload",
    "Payment Upload",
    "Payment Verification",
    "Order Approval",
    "Invoice Generation",
    "Delivery",
    "Installation",
    "Warranty Registration",
    "Closure"
  ];

  const currentStageIndex = STAGE_NAMES.indexOf(order.currentStage);
  const calculatedProgress = STAGE_NAMES.includes(order.currentStage)
    ? (currentStageIndex / (STAGE_NAMES.length - 1)) * 100
    : 0;

  const orderStages = STAGE_NAMES.map((name, index) => {
    let status = "pending" as "pending" | "completed" | "current";
    if (currentStageIndex > index) {
      status = "completed";
    } else if (currentStageIndex === index) {
      status = name === "Closure" ? "completed" : "current";
    }
    const progress = Math.round((index / (STAGE_NAMES.length - 1)) * 100);
    return { name, status, progress };
  });
  const activities = order.activityLog ? order.activityLog.map((log: any) => ({
    date: log.timestamp ? new Date(log.timestamp).toISOString().split("T")[0] : order.orderDate,
    user: log.performedBy || "System",
    action: log.action + (log.note ? `: ${log.note}` : "")
  })) : [
    { date: order.orderDate, user: "Dealer", action: "Order created and PO uploaded" },
    { date: order.orderDate, user: "Dealer", action: "Payment receipt uploaded" },
    { date: order.orderDate, user: "System", action: "Awaiting payment verification" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 mb-1" />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">
                {order.orderNumber}
              </h1>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Order Date: {order.orderDate}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={order.paymentStatus} />
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Dealer", value: order.dealer },
          { label: "Order Value", value: `₹${Number(order.totalValue).toLocaleString()}` },
          { label: "Payment Status", value: order.paymentStatus, isBadge: true },
          { label: "Delivery Status", value: order.deliveryStatus }
        ].map((card, i) => (
          <Card key={i} className="p-4">
            <p className="text-sm text-gray-600">{card.label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : card.isBadge ? (
              <div className="mt-1">
                <StatusBadge status={card.value} />
              </div>
            ) : (
              <p className="text-lg font-semibold text-gray-900 mt-1">{card.value}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Progress Tracker */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h3 className="text-lg font-semibold text-gray-900">
            Order Progress
          </h3>
          {!isLoading ? (
            <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2 md:mt-0">
              {order.stageProgress}% Complete — {order.currentStage}
            </p>
          ) : (
            <Skeleton className="h-6 w-48 mt-2 md:mt-0 rounded-full" />
          )}
        </div>

        <div className="relative mt-4">
          {/* Connecting line (hidden on mobile, visible on desktop) */}
          {!isLoading && (
            <div className="absolute top-6 left-[5.5%] right-[5.5%] hidden lg:block z-0 h-1 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
                style={{ width: `${calculatedProgress}%` }}
              />
            </div>
          )}

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 relative z-10">
            {isLoading ? (
              Array(9).fill(0).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="bg-white inline-block px-1">
                    <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
                  </div>
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))
            ) : (
              orderStages.map((stage, index) => (
                <div key={index} className="text-center relative">
                  <div className="bg-white inline-block">
                    <div
                      onClick={() => isAdmin && handleStageJump(stage.name, stage.progress)}
                      className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${isAdmin ? 'cursor-pointer hover:scale-110' : ''} ${stage.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : stage.status === "current"
                          ? "bg-blue-100 shadow-md ring-4 ring-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                        }`}
                    >
                      {stage.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : stage.status === "current" ? (
                        <Clock className="w-6 h-6 text-blue-600" />
                      ) : (
                        <span className="text-sm font-medium text-gray-400">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-xs mt-3 ${stage.status === "completed"
                      ? "text-green-600 font-medium"
                      : stage.status === "current"
                        ? "text-blue-600 font-medium"
                        : "text-gray-500"
                      }`}
                  >
                    {stage.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Details
                </h3>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-gray-500 border-b">
                        <tr>
                          <th className="text-left font-medium pb-2">Product</th>
                          <th className="text-right font-medium pb-2">Qty</th>
                          <th className="text-right font-medium pb-2">Unit Price</th>
                          <th className="text-right font-medium pb-2 text-blue-600">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {order.products && order.products.length > 0 ? (
                          order.products.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="py-3">
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.sku}</p>
                              </td>
                              <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                              <td className="py-3 text-right text-gray-600">₹{Number(item.price).toLocaleString()}</td>
                              <td className="py-3 text-right font-semibold text-gray-900">
                                ₹{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="hover:bg-gray-50/50">
                            <td className="py-3">
                              <p className="font-medium text-gray-900">{order.product}</p>
                            </td>
                            <td className="py-3 text-right text-gray-600">{order.quantity}</td>
                            <td className="py-3 text-right text-gray-600">
                              ₹{order.quantity > 0 ? (Number(order.totalValue) / order.quantity).toLocaleString() : "0"}
                            </td>
                            <td className="py-3 text-right font-semibold text-gray-900">
                              ₹{Number(order.totalValue).toLocaleString()}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">
                      Grand Total
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{Number(order.totalValue).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Dealer Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500">Company Name</p>
                    <p className="font-semibold text-gray-900">{dealer.name} <span className="text-xs text-gray-400 font-normal">({dealer.code})</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{dealer.phone || (dealer as any).contact}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-900 text-blue-600">{dealer.email}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1">
                    <p className="text-gray-500">Business Address</p>
                    <p className="font-medium text-gray-900">
                      {dealer.city}, {dealer.region}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  {order.poDocument?.url ? (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex-shrink-0 bg-white border border-green-200 rounded overflow-hidden flex items-center justify-center">
                            {order.poDocument.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                              <img src={order.poDocument.url} alt="PO" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Purchase Order
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded on {new Date(order.poDocument.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: order.poDocument!.url, title: "Purchase Order" })}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                          <a href={order.poDocument.url} download={`PO_${order.orderNumber}`} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </a>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("po-upload")?.click()}>
                            Re-upload
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Purchase Order Missing
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Please upload the signed PO to proceed
                      </p>
                      <Button variant="outline" size="sm" onClick={() => document.getElementById("po-upload")?.click()} disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Upload PO"}
                      </Button>
                    </div>
                  )}

                  {order.paymentDocument?.url ? (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex-shrink-0 bg-white border border-green-200 rounded overflow-hidden flex items-center justify-center">
                            {order.paymentDocument.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                              <img src={order.paymentDocument.url} alt="Payment" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Payment Receipt
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded on {new Date(order.paymentDocument.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: order.paymentDocument!.url, title: "Payment Receipt" })}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                          <a href={order.paymentDocument.url} download={`Payment_${order.orderNumber}`} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </a>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("payment-upload")?.click()}>
                            Re-upload
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Payment Receipt Missing
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Upload payment confirmation receipt
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("payment-upload")?.click()}
                        disabled={isUploading || !order.poDocument}
                      >
                        {isUploading ? "Uploading..." : "Upload Receipt"}
                      </Button>
                    </div>
                  )}

                  {/* Hidden inputs for file upload */}
                  <input
                    type="file"
                    id="po-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload("PO", e.target.files[0]);
                    }}
                  />
                  <input
                    type="file"
                    id="payment-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload("Payment", e.target.files[0]);
                    }}
                  />

                  {/* Lovol Invoice Upload */}
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Official Invoices</h4>
                    <div className="space-y-4">
                      {order.lovolInvoiceDocument?.url ? (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 flex-shrink-0 bg-white border border-green-200 rounded overflow-hidden flex items-center justify-center">
                                {order.lovolInvoiceDocument.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                  <img src={order.lovolInvoiceDocument.url} alt="Lovol Invoice" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-6 h-6 text-green-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Lovol Invoice</p>
                                <p className="text-xs text-gray-500">
                                  Uploaded on {new Date(order.lovolInvoiceDocument.uploadedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: order.lovolInvoiceDocument!.url, title: "Lovol Invoice" })}>
                                <Eye className="w-4 h-4 mr-2" /> View
                              </Button>
                              <a href={order.lovolInvoiceDocument.url} download={`Lovol_Invoice_${order.orderNumber}`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                              </a>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("lovol-invoice-upload")?.click()}>
                                Re-upload
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-900 mb-1">Generate/Upload Lovol Invoice</p>
                          <p className="text-xs text-gray-500 mb-4">Official invoice for the dealer</p>
                          <Button variant="outline" size="sm" onClick={() => document.getElementById("lovol-invoice-upload")?.click()} disabled={isUploading || order.currentStage !== "Invoice Generation"}>
                            {isUploading ? "Uploading..." : "Upload Invoice"}
                          </Button>
                        </div>
                      )}

                      {/* Dealer Invoice Upload */}
                      {order.dealerInvoiceDocument?.url ? (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 flex-shrink-0 bg-white border border-green-200 rounded overflow-hidden flex items-center justify-center">
                                {order.dealerInvoiceDocument.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                  <img src={order.dealerInvoiceDocument.url} alt="Dealer Invoice" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-6 h-6 text-green-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Dealer Customer Invoice</p>
                                <p className="text-xs text-gray-500">
                                  Uploaded on {new Date(order.dealerInvoiceDocument.uploadedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: order.dealerInvoiceDocument!.url, title: "Dealer Customer Invoice" })}>
                                <Eye className="w-4 h-4 mr-2" /> View
                              </Button>
                              <a href={order.dealerInvoiceDocument.url} download={`Dealer_Invoice_${order.orderNumber}`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                              </a>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("dealer-invoice-upload")?.click()}>
                                Re-upload
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-900 mb-1">Upload Customer Invoice</p>
                          <p className="text-xs text-gray-500 mb-4">The invoice you issued to your customer</p>
                          <Button variant="outline" size="sm" onClick={() => document.getElementById("dealer-invoice-upload")?.click()} disabled={isUploading || !order.lovolInvoiceDocument}>
                            {isUploading ? "Uploading..." : "Upload Invoice"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hidden inputs for invoice uploads */}
                  <input
                    type="file"
                    id="lovol-invoice-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload("LovolInvoice", e.target.files[0]);
                    }}
                  />
                  <input
                    type="file"
                    id="dealer-invoice-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload("DealerInvoice", e.target.files[0]);
                    }}
                  />

                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload additional documents
                    </p>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  {activities.map((activity: any, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.date} • by {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Admin Actions
            </h3>
            <div className="space-y-2">
              {order.currentStage === "Payment Verification" && (
                <Button 
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Approve Payment"}
                </Button>
              )}

              {order.currentStage === "Order Approval" && (
                <Button 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleFinalApprove}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Approve Order"}
                </Button>
              )}

              {/* Delivery Actions */}
              {order.currentStage === "Delivery" && order.deliveryStatus !== "Dispatched" && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="text-sm font-medium text-gray-900">Dispatch Details</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Courier / Transport Name"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={transportName}
                      onChange={(e) => setTransportName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Tracking ID"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                    />
                    <input
                      type="date"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full justify-start mt-2"
                    onClick={handleUpdateDelivery}
                    disabled={isProcessing || !transportName || !trackingId || !estimatedDeliveryDate}
                  >
                    Mark as Dispatched
                  </Button>
                </div>
              )}

              {order.deliveryDetails && order.deliveryDetails.transportName && (
                <div className="space-y-2 pt-3 border-t text-sm">
                  <h4 className="font-medium text-gray-900 border-b pb-2 mb-2">Delivery Status</h4>
                  <div className="flex justify-between text-gray-500">
                    <span>Status:</span>
                    <span className="text-blue-600 font-medium">{order.deliveryStatus}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Courier:</span>
                    <span className="text-gray-900">{order.deliveryDetails.transportName}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tracking ID:</span>
                    <span className="text-gray-900">{order.deliveryDetails.trackingId}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Est. Delivery:</span>
                    <span className="text-gray-900">
                      {order.deliveryDetails.estimatedDeliveryDate 
                        ? new Date(order.deliveryDetails.estimatedDeliveryDate).toLocaleDateString() 
                        : "N/A"}
                    </span>
                  </div>
                  
                  {order.deliveryStatus === "Dispatched" && (
                    <Button 
                      className="w-full justify-start mt-4 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleConfirmReceipt}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isProcessing ? "Processing..." : "Confirm Receipt"}
                    </Button>
                  )}
                </div>
              )}
              
              {order.currentStage === "Installation" && (
                <Button 
                  className="w-full justify-start mt-4 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleInstallationComplete}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Installation Done"}
                </Button>
              )}

              {order.currentStage === "Warranty Registration" && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="text-sm font-medium text-gray-900">Warranty Registration</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Machine Serial Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. SN12345678"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={machineSerialNumber}
                        onChange={(e) => setMachineSerialNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Engine Number</label>
                      <input
                        type="text"
                        placeholder="e.g. EN987654"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={engineNumber}
                        onChange={(e) => setEngineNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Warranty Start Date</label>
                      <input
                        type="date"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={warrantyStartDate}
                        onChange={(e) => setWarrantyStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Warranty End Date</label>
                      <input
                        type="date"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={warrantyEndDate}
                        onChange={(e) => setWarrantyEndDate(e.target.value)}
                        readOnly
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Warranty (Months)</label>
                        <input
                          type="number"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={warrantyMonths}
                          onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Maint. (Months)</label>
                        <input
                          type="number"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={maintenanceMonths}
                          onChange={(e) => setMaintenanceMonths(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Signed Warranty Document</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        onChange={(e) => {
                          if (e.target.files) setWarrantyDocument(e.target.files[0]);
                        }}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full justify-start mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleRegisterWarranty}
                    disabled={isProcessing || !machineSerialNumber}
                  >
                    Confirm Registration
                  </Button>
                </div>
              )}

              <Button className="w-full justify-start" variant="outline">
                Request Documents
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Update Status
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Generate Invoice
              </Button>
              <Button 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                variant="outline"
                onClick={handleCancelOrder}
                disabled={isProcessing || order.currentStage === "Cancelled"}
              >
                {isProcessing ? "Processing..." : "Cancel Order"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery</span>
                <span className="text-sm font-medium text-gray-900">
                  {order.deliveryStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-blue-600">
                  {order.stageProgress}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="sm:max-w-2xl w-full max-h-[85vh] h-full flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">{viewingDoc?.title}</h3>
            </div>
            <div className="flex items-center gap-3 pr-10">
              <a href={viewingDoc?.url} download={viewingDoc?.title} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" className="bg-blue-600 hover:bg-blue-700 border-none text-white font-medium">
                  <Download className="w-4 h-4 mr-2" /> Download Document
                </Button>
              </a>
            </div>
          </div>
          <div className="flex-1 bg-gray-800 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            {viewingDoc?.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar">
                  <img 
                  src={viewingDoc.url} 
                  alt="Document Preview" 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col bg-white">
                <iframe 
                  src={`${viewingDoc?.url}#toolbar=0`} 
                  className="w-full flex-1 border-none" 
                  title="PDF Preview"
                />
                <div className="p-2 border-t text-center text-xs text-gray-500 bg-gray-50 flex items-center justify-center gap-2">
                  <FileText className="w-3 h-3" />
                  Standard PDF Viewer. Use the Download button above if preview doesn't load.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
