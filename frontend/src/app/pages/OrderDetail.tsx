import { useParams, Link } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, FileText, Upload, CheckCircle, Clock, Eye, Download, Trash2, RefreshCw, ClipboardList, Truck, Wrench, ShieldCheck, UserCircle } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import { validateFileSize } from "../utils/file";

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
    cancelOrder,
    uploadAdditionalDocument,
    deleteAdditionalDocument,
    deletePrimaryDocument,
    requestDocument
  } = useOrders();
  const { getDealer } = useDealers();
  const { isAdmin, isSuperAdmin, isDistributor, isDealer, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
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
  const [maintenanceService, setMaintenanceService] = useState<string>("None");
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
  const [isNamingDialogOpen, setIsNamingDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [requestedDocName, setRequestedDocName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [jumpTargetStage, setJumpTargetStage] = useState<string>("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isStageJumpDialogOpen, setIsStageJumpDialogOpen] = useState(false);
  const [pendingStageJump, setPendingStageJump] = useState<{ name: string, progress: number } | null>(null);

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

  const dealerFromContext = order ? getDealer(order.dealerId) : null;

  // Create a display dealer object using context or order metadata/populated data
  const dealer = useMemo(() => {
    if (dealerFromContext) return dealerFromContext;
    if (!order) return null;

    // Fallback: If order.dealerId is populated (an object), use its fields
    if (order.dealerId && typeof order.dealerId === 'object') {
      const d = order.dealerId as any;
      return {
        id: d._id,
        name: d.companyName || d.name || order.dealer || "Unknown Entity",
        code: d.code || "N/A",
        phone: d.phone || d.contact || "N/A",
        email: d.email || "N/A",
        city: d.address || d.city || "N/A",
        region: d.region || d.state || "N/A"
      };
    }

    // Second Fallback: Use order.dealer string and generic labels
    const dId = typeof order.dealerId === 'string' ? order.dealerId : (order.dealerId as any)?._id;
    return {
      id: dId || "",
      name: order.dealer || "Unknown Entity",
      code: "N/A",
      phone: "N/A",
      email: "N/A",
      city: "N/A",
      region: "N/A"
    };
  }, [dealerFromContext, order]);

  const handleFileUpload = async (type: "PO" | "Payment" | "LovolInvoice" | "DealerInvoice", file: File) => {
    if (!order || !order.id) return;

    if (!validateFileSize(file)) return;

    try {
      setUploadingDoc(type);
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
      toast.success("Document Updated Successfully");
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
    } finally {
      setUploadingDoc(null);
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
      toast.error("Failed to verify payment. Please try again.");
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
      toast.error("Failed to approve order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDelivery = async () => {
    if (!order || !order.id) return;
    if (!transportName || !trackingId || !estimatedDeliveryDate) {
      toast.error("Please fill in all delivery details");
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
    } catch (error: any) {
      console.error("Failed to update delivery:", error);
      const errorMsg = error.response?.data?.message || "Failed to update delivery status. Please try again.";
      toast.error(errorMsg);
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
      toast.error("Failed to confirm receipt. Please try again.");
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
      toast.error("Failed to complete installation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterWarranty = async () => {
    if (!order || !order.id) return;
    if (!machineSerialNumber || !engineNumber || !warrantyStartDate || !warrantyMonths || !maintenanceService || maintenanceService === "None") {
      toast.error("All mandatory fields are required.");
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
      if (maintenanceService) formData.append("maintenanceService", maintenanceService);
      if (warrantyDocument) formData.append("warrantyDocument", warrantyDocument);

      const updatedOrder = await registerWarranty(order.id, formData);
      setOrder(updatedOrder);
      toast.success("Warranty successfully registered!");
    } catch (error) {
      console.error("Failed to register warranty:", error);
      toast.error("Failed to register warranty. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !order.id) return;

    try {
      setIsProcessing(true);
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
      toast.success("Order has been cancelled.");
      setIsCancelDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      toast.error(error.response?.data?.message || "Failed to cancel order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Stage jumping feature has been disabled

  const [isReuploading, setIsReuploading] = useState(false);
  const reuploadNameRef = useRef("");

  const handleReupload = (name: string) => {
    reuploadNameRef.current = name;
    setIsReuploading(true);
    document.getElementById("reupload-input")?.click();
  };

  const handleAdditionalUpload = async () => {
    if (!pendingFile || !newDocName || !id) return;

    if (!validateFileSize(pendingFile)) return;

    try {
      setIsProcessing(true);
      const updatedOrder = await uploadAdditionalDocument(id, pendingFile, newDocName);
      setOrder(updatedOrder);
      toast.success("Document Uploaded Successfully");
      setIsNamingDialogOpen(false);
      setNewDocName("");
      setPendingFile(null);
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDoc = async (type: string, name?: string) => {
    if (!id || !window.confirm(`Are you sure you want to delete this document?`)) return;

    try {
      setIsProcessing(true);
      let updatedOrder;
      if (type === "additional" && name) {
        updatedOrder = await deleteAdditionalDocument(id, name);
        toast.success(`"${name}" deleted successfully`);
      } else {
        updatedOrder = await deletePrimaryDocument(id, type);
        toast.success("Document deleted successfully");
      }
      setOrder(updatedOrder);
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestDocument = async () => {
    if (!id || !requestedDocName) return;
    try {
      setIsProcessing(true);
      const updatedOrder = await requestDocument(id, requestedDocName);
      setOrder(updatedOrder);
      toast.success(`Request for "${requestedDocName}" sent`);
      setIsRequestDialogOpen(false);
      setRequestedDocName("");
    } catch (error) {
      toast.error("Failed to send request");
    } finally {
      setIsProcessing(false);
    }
  };

  // The creator or Super Admin can modify docs and perform lifecycle actions
  const canModifyDocs = isSuperAdmin || !isDealer || (isDealer && order.createdBy === user?.id);

  const STAGE_NAMES = useMemo(() => {
    if (order?.orderSource === "Own Stock") {
      return [
        "PO Upload",
        "Payment Upload",
        "Payment Verification",
        "Installation",
        "Warranty Registration",
        "Closure"
      ];
    }
    return [
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
  }, [order?.orderSource]);

  const displayCurrentStage = order?.currentStage || "";

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
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

  const currentStageIndex = STAGE_NAMES.indexOf(displayCurrentStage);
  const calculatedProgress = (currentStageIndex / (STAGE_NAMES.length - 1)) * 100;

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
          { label: "Fulfillment", value: order.orderSource || "Warehouse" },
          { label: "Order Value", value: `₹${Number(order.totalValue).toLocaleString()}` },
          { label: "Payment Status", value: order.paymentStatus, isBadge: true },
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
                      className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${stage.status === "completed"
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
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="execution">Execution History</TabsTrigger>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500 font-medium">Company Name</p>
                    <p className="font-semibold text-gray-900 capitalize">{dealer?.name} <span className="text-xs text-gray-400 font-normal">({dealer?.code})</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 font-medium">Phone</p>
                    <p className="font-medium text-gray-900">{dealer?.phone || (dealer as any)?.contact || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 font-medium">Email Address</p>
                    <p className="font-medium text-gray-900 text-blue-600 break-all">{dealer?.email}</p>
                  </div>
                </div>
              </Card>

              {order.customerName && (
                <Card className="p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-blue-600" />
                    Customer / Lead Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-500 font-medium">Customer Name</p>
                      <p className="font-semibold text-gray-900 capitalize">{order.customerName}</p>
                    </div>
                    {order.leadId && (
                      <div className="space-y-1">
                        <p className="text-gray-500 font-medium">Linked Record</p>
                        <Link
                          to={`/leads/${order.leadId?._id || order.leadId}`}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5"
                        >
                          <FileText className="w-4 h-4" />
                          View Original Lead / Customer
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Purchase Order */}
                  <div className={`border rounded-lg p-4 ${(order as any).documents?.po?.url ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 flex-shrink-0 border rounded-full flex items-center justify-center font-bold text-lg ${(order as any).documents?.po?.url ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          1
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Purchase Order</p>
                          <p className="text-xs text-gray-500">
                            {(order as any).documents?.po?.url
                              ? `Uploaded on ${new Date((order as any).documents.po.uploadedAt).toLocaleString()}`
                              : "Please upload the signed PO to proceed"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(order as any).documents?.po?.url ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: (order as any).documents.po.url, title: "Purchase Order" })} title="View">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <a href={(order as any).documents.po.url} download={`PO_${order.orderNumber}`} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200" title="Download">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                            {canModifyDocs && (
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("po-upload")?.click()} title="Re-upload">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        ) : (
                          canModifyDocs && (
                            <Button variant="outline" size="sm" onClick={() => document.getElementById("po-upload")?.click()} disabled={!!uploadingDoc}>
                              {uploadingDoc === "PO" ? "Uploading..." : "Upload PO"}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Receipt */}
                  <div className={`border rounded-lg p-4 ${(order as any).documents?.payment?.url ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 flex-shrink-0 border rounded-full flex items-center justify-center font-bold text-lg ${(order as any).documents?.payment?.url ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          2
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Payment Receipt</p>
                          <p className="text-xs text-gray-500">
                            {(order as any).documents?.payment?.url
                              ? `Uploaded on ${new Date((order as any).documents.payment.uploadedAt).toLocaleString()}`
                              : "Upload payment confirmation receipt"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(order as any).documents?.payment?.url ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: (order as any).documents.payment.url, title: "Payment Receipt" })} title="View">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <a href={(order as any).documents.payment.url} download={`Payment_${order.orderNumber}`} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200" title="Download">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                            {canModifyDocs && (
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("payment-upload")?.click()} title="Re-upload">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        ) : (
                          canModifyDocs && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById("payment-upload")?.click()}
                              disabled={!!uploadingDoc || !(order as any).documents?.po?.url}
                            >
                              {uploadingDoc === "Payment" ? "Uploading..." : "Upload Receipt"}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

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

                  {/* Official Invoices */}
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">
                      {(order as any).orderSource === "Own Stock" ? "Customer Invoice" : "Official Invoices"}
                    </h4>
                    <div className="space-y-4">
                      {/* Lovol Invoice - Hidden for Own Stock */}
                      {(order as any).orderSource !== "Own Stock" && (
                        <div className={`border rounded-lg p-4 ${(order as any).documents?.lovolInvoice?.url ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 flex-shrink-0 border rounded-full flex items-center justify-center font-bold text-lg ${(order as any).documents?.lovolInvoice?.url ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                3
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Lovol Invoice</p>
                                <p className="text-xs text-gray-500">
                                  {(order as any).documents?.lovolInvoice?.url
                                    ? `Uploaded on ${new Date((order as any).documents.lovolInvoice.uploadedAt).toLocaleString()}`
                                    : "Official invoice for the dealer"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(order as any).documents?.lovolInvoice?.url ? (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: (order as any).documents.lovolInvoice.url, title: "Lovol Invoice" })} title="View">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <a href={(order as any).documents.lovolInvoice.url} download={`Lovol_Invoice_${order.orderNumber}`} target="_blank" rel="noreferrer">
                                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200" title="Download">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  {(isAdmin || ((order as any).orderSource === "Own Stock" && canModifyDocs)) && (
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("lovol-invoice-upload")?.click()} title="Re-upload">
                                      <RefreshCw className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                (isAdmin || ((order as any).orderSource === "Own Stock" && canModifyDocs)) && (
                                  <Button variant="outline" size="sm" onClick={() => document.getElementById("lovol-invoice-upload")?.click()} disabled={!!uploadingDoc || order.currentStage !== "Invoice Generation"}>
                                    {uploadingDoc === "LovolInvoice" ? "Uploading..." : "Upload Invoice"}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dealer Invoice */}
                      <div className={`border rounded-lg p-4 ${(order as any).documents?.dealerInvoice?.url ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex-shrink-0 border rounded-full flex items-center justify-center font-bold text-lg ${(order as any).documents?.dealerInvoice?.url ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                              4
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Dealer Customer Invoice</p>
                              <p className="text-xs text-gray-500">
                                {(order as any).documents?.dealerInvoice?.url
                                  ? `Uploaded on ${new Date((order as any).documents.dealerInvoice.uploadedAt).toLocaleString()}`
                                  : "The invoice you issued to your customer"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(order as any).documents?.dealerInvoice?.url ? (
                              <>
                                <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: (order as any).documents.dealerInvoice.url, title: "Dealer Customer Invoice" })} title="View">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <a href={(order as any).documents.dealerInvoice.url} download={`Dealer_Invoice_${order.orderNumber}`} target="_blank" rel="noreferrer">
                                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200" title="Download">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </a>
                                {canModifyDocs && (
                                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => document.getElementById("dealer-invoice-upload")?.click()} title="Re-upload">
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              canModifyDocs && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById("dealer-invoice-upload")?.click()}
                                  disabled={!!uploadingDoc || ((order as any).orderSource !== "Own Stock" && !(order as any).documents?.lovolInvoice?.url)}
                                >
                                  {uploadingDoc === "DealerInvoice" ? "Uploading..." : "Upload Invoice"}
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
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

                  {/* Additional Documents List */}
                  {(order as any).documents?.additional?.map((doc: any, index: number) => (
                    <div key={index} className={`border rounded-lg p-4 ${doc.url ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 flex-shrink-0 border rounded-full flex items-center justify-center font-bold text-lg ${doc.url ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                            {5 + index}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.url
                                ? `Uploaded on ${new Date(doc.uploadedAt).toLocaleString()}`
                                : "Document requested by Administrator"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {doc.url ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => setViewingDoc({ url: doc.url, title: doc.name })} title="View">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200" title="Download">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </a>
                              {canModifyDocs && (
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => handleReupload(doc.name)} title="Re-upload">
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              )}
                              {isSuperAdmin && (
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteDoc("additional", doc.name)} title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              {canModifyDocs && (
                                <Button variant="outline" size="sm" onClick={() => handleReupload(doc.name)} disabled={isProcessing}>
                                  Upload Document
                                </Button>
                              )}
                              {isSuperAdmin && (
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteDoc("additional", doc.name)} title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {canModifyDocs && (
                    <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => document.getElementById("additional-upload")?.click()}>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Upload additional documents
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Add any other relevant files like invoices or transport docs
                      </p>
                      <Button variant="outline" size="sm">
                        Choose File
                      </Button>
                    </div>
                  )}

                  {/* Hidden inputs moved outside clickable div to prevent bubbling */}
                  <input
                    type="file"
                    id="additional-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        if (validateFileSize(file)) {
                          setPendingFile(file);
                          setIsNamingDialogOpen(true);
                        } else {
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="reupload-input"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      if (e.target.files?.[0] && id) {
                        const file = e.target.files[0];
                        if (!validateFileSize(file)) {
                          e.target.value = "";
                          return;
                        }
                        try {
                          setIsProcessing(true);
                          const currentName = reuploadNameRef.current;
                          const updatedOrder = await uploadAdditionalDocument(id, file, currentName);
                          setOrder(updatedOrder);
                          toast.success("Document Updated Successfully");
                          setIsReuploading(false);
                        } catch (error) {
                          toast.error("Failed to update document");
                        } finally {
                          setIsProcessing(false);
                          setIsReuploading(false);
                          e.target.value = ""; // Clear for future pick
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="execution" className="mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 font-enterprise flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      Execution & Milestone History
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Detailed record of the order fulfillment lifecycle.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dispatch Details - Hidden for Own Stock */}
                  {(order as any).orderSource !== "Own Stock" && (
                    <div className={`border rounded-xl p-5 ${order.deliveryDetails?.transportName ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${order.deliveryDetails?.transportName ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Dispatch Details</h4>
                      </div>
                      {order.deliveryDetails?.transportName ? (
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Transport:</span>
                            <span className="font-medium text-gray-900">{order.deliveryDetails.transportName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tracking ID:</span>
                            <span className="font-medium text-blue-600 select-all">{order.deliveryDetails.trackingId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Est. Arrival:</span>
                            <span className="font-medium text-gray-900">
                              {order.deliveryDetails.estimatedDeliveryDate ? new Date(order.deliveryDetails.estimatedDeliveryDate).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Awaiting dispatch info...</p>
                      )}
                    </div>
                  )}

                  {/* Installation Milestone */}
                  <div className={`border rounded-xl p-5 ${orderStages.findIndex(s => s.name === order.currentStage) > orderStages.findIndex(s => s.name === "Installation") || order.currentStage === "Order Completed" ? 'bg-white border-green-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${orderStages.findIndex(s => s.name === order.currentStage) > orderStages.findIndex(s => s.name === "Installation") || order.currentStage === "Order Completed" ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                        <Wrench className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Installation Status</h4>
                    </div>
                    {(orderStages.findIndex(s => s.name === order.currentStage) > orderStages.findIndex(s => s.name === "Installation") || order.currentStage === "Order Completed") ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm font-medium border border-green-100">
                          <CheckCircle className="w-4 h-4" />
                          Marked as Completed
                        </div>
                        <p className="text-xs text-gray-500 mt-2">The product has been successfully installed and verified by the technician.</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Installation phase pending.</p>
                    )}
                  </div>

                  {/* Warranty Milestone */}
                  <div className={`border rounded-xl p-5 lg:col-span-2 ${order.warrantyDetails?.machineSerialNumber ? 'bg-white border-purple-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${order.warrantyDetails?.machineSerialNumber ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Warranty Registration</h4>
                    </div>
                    {order.warrantyDetails?.machineSerialNumber ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                        <div className="space-y-3">
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Machine SN:</span>
                            <span className="font-bold text-gray-900 select-all">{order.warrantyDetails.machineSerialNumber}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Engine Number:</span>
                            <span className="font-medium text-gray-900">{order.warrantyDetails.engineNumber || "N/A"}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Duration:</span>
                            <span className="font-medium text-gray-900">{order.warrantyDetails.warrantyMonths} Months</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Maintenance:</span>
                            <span className="font-medium text-gray-900">{order.warrantyDetails.maintenanceService || "None"}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Coverage Start:</span>
                            <span className="font-medium text-gray-900">{order.warrantyDetails?.warrantyStartDate ? new Date(order.warrantyDetails.warrantyStartDate).toLocaleDateString() : "N/A"}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Coverage End:</span>
                            <span className="font-bold text-green-700">{order.warrantyDetails?.warrantyEndDate ? new Date(order.warrantyDetails.warrantyEndDate).toLocaleDateString() : "N/A"}</span>
                          </div>
                          {(order as any).documents?.warranty?.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                              onClick={() => setViewingDoc({ url: (order as any).documents.warranty.url, title: "Warranty Certificate" })}
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Signed Document
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Warranty registration details will appear here once submitted.</p>
                    )}
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
          {/* Only show action panel if user has any permission to act */}
          {!isReadOnly && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isSuperAdmin ? "Admin Actions" : "Actions"}
              </h3>
              <div className="space-y-2">
                {/* === SUPER ADMIN, CREATOR, OR DISTRIBUTOR: Approve Payment === */}
                {(isSuperAdmin || canModifyDocs || isDistributor) && order.currentStage === "Payment Verification" && (
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Approve Payment"}
                  </Button>
                )}

                {/* === SUPER ADMIN, CREATOR, OR DISTRIBUTOR: Approve Order === */}
                {(isSuperAdmin || (order.orderSource === "Own Stock" && canModifyDocs) || isDistributor) && order.currentStage === "Order Approval" && (
                  <Button
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleFinalApprove}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Approve Order"}
                  </Button>
                )}

                {/* === SUPER ADMIN OR CREATOR: Delivery Actions - Simplified to Mark as Delivered === */}
                {(order as any).orderSource !== "Own Stock" && (isSuperAdmin || canModifyDocs) && order.currentStage === "Delivery" && order.deliveryStatus !== "Delivered" && (
                  <Button
                    className="w-full justify-start mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleConfirmReceipt}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Mark as Delivered"}
                  </Button>
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

                    {/* CREATOR OR ADMIN: Confirm Receipt */}
                    {canModifyDocs && order.deliveryStatus === "Dispatched" && (
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

                {/* CREATOR OR ADMIN: Installation Complete */}
                {canModifyDocs && order.currentStage === "Installation" && (
                  <Button
                    className="w-full justify-start mt-4 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleInstallationComplete}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Installation Done"}
                  </Button>
                )}

                {/* CREATOR OR ADMIN: Warranty Registration */}
                {canModifyDocs && order.currentStage === "Warranty Registration" && (
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
                          <label className="text-xs text-gray-500 mb-1 block">Maintenance Service</label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={maintenanceService}
                            onChange={(e) => setMaintenanceService(e.target.value)}
                          >
                            <option value="None">Select Service</option>
                            <option value="500h">500 Hours</option>
                            <option value="1000h">1000 Hours</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Signed Warranty Document</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              if (validateFileSize(file)) {
                                setWarrantyDocument(file);
                              } else {
                                e.target.value = "";
                              }
                            }
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

                {/* === SUPER ADMIN ONLY: Request Documents (Hidden after Invoice Generation) === */}
                {isSuperAdmin && currentStageIndex < STAGE_NAMES.indexOf("Invoice Generation") && (
                  <Button className="w-full justify-start" variant="outline" onClick={() => setIsRequestDialogOpen(true)} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Request Documents"}
                  </Button>
                )}

                {/* === SUPER ADMIN ONLY: Update Status REMOVED === */}

                {/* Order Complete or Cancel (Cancel hidden after Delivered/Installation) */}
                {order.currentStage === "Closure" ? (
                  <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 font-semibold text-sm">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Order is Complete
                  </div>
                ) : (
                  canModifyDocs && order.currentStage !== "Cancelled" && currentStageIndex < STAGE_NAMES.indexOf("Installation") && (
                    <Button
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      variant="outline"
                      onClick={() => setIsCancelDialogOpen(true)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Cancel Order"}
                    </Button>
                  )
                )}
              </div>
            </Card>
          )}

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

      {/* Naming Dialog */}
      <Dialog open={isNamingDialogOpen} onOpenChange={setIsNamingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name your document</DialogTitle>
            <DialogDescription>
              Give this document a clear name so it's easy to identify later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="doc-name" className="text-sm font-medium">Document Name</label>
              <input
                id="doc-name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Insurance Copy, Waybill..."
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                autoFocus
              />
            </div>
            {pendingFile && (
              <p className="text-xs text-gray-500 italic">
                Selected file: {pendingFile.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNamingDialogOpen(false);
              setPendingFile(null);
              setNewDocName("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAdditionalUpload}
              disabled={!newDocName || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Document Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Document</DialogTitle>
            <DialogDescription>
              Specify the name of the document you need from the dealer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="req-doc-name" className="text-sm font-medium">Document Name</label>
              <input
                id="req-doc-name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Bank Statement, Identity Proof..."
                value={requestedDocName}
                onChange={(e) => setRequestedDocName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRequestDialogOpen(false);
              setRequestedDocName("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestDocument}
              disabled={!requestedDocName || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Status Change Dialog (Admin Only) */}
      <Dialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              Update Order Status
            </DialogTitle>
            <DialogDescription>
              Select a stage to jump the order to. This will update the progress bar and current status.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Target Stage</label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {orderStages.map((stage, idx) => (
                <button
                  key={idx}
                  onClick={() => setJumpTargetStage(stage.name)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${jumpTargetStage === stage.name
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stage.name}</p>
                    <p className="text-xs text-gray-500">{stage.progress}% progress mark</p>
                  </div>
                  {jumpTargetStage === stage.name && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsStatusChangeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const target = orderStages.find((s) => s.name === jumpTargetStage);
                if (target) {
                  handleStageJump(target.name, target.progress);
                  setIsStatusChangeDialogOpen(false);
                } else {
                  toast.error("Please select a target stage");
                }
              }}
              disabled={!jumpTargetStage || isProcessing}
            >
              {isProcessing ? "Updating..." : "Update Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently cancel the order and update the inventory records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Don't Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                handleCancelOrder();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stage Jump Confirmation */}
      <AlertDialog open={isStageJumpDialogOpen} onOpenChange={setIsStageJumpDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jump to different stage?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to jump the order status to <span className="font-bold text-blue-600">{pendingStageJump?.name}</span>?
              This will bypass the current workflow sequence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                if (pendingStageJump) {
                  handleStageJump(pendingStageJump.name, pendingStageJump.progress);
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Updating..." : "Confirm Jump"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
