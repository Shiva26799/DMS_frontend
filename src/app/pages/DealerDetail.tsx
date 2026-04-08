import { useParams, Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, Users, CheckCircle, FileText, Download, Eye, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockWarrantyClaims } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { useDealers } from "../context/DealerContext";
import { useOrders } from "../context/OrderContext";
import { useWarranty } from "../context/WarrantyContext";
import { Skeleton } from "../components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { ProductCombobox } from "../components/ProductCombobox";

export function DealerDetail() {
  const { id } = useParams();
  const { getDealer, approveDealer } = useDealers();
  const { getOrdersByDealer, cancelOrder } = useOrders();
  const { isAdmin } = useAuth();
  const dealer = getDealer(id || "");
  const dealerOrders = getOrdersByDealer(id || "");
  const { claims } = useWarranty();
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [selectedDoc, setSelectedDoc] = useState<{ name: string, url: string } | null>(null);

  // Credit Limit Update State
  const { updateDealer } = useDealers();
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState(dealer?.creditLimit || "");
  const [isUpdatingCredit, setIsUpdatingCredit] = useState(false);

  // Create Order State
  const { addOrder } = useOrders();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    products: [{ productId: "", quantity: 1, price: "" as any }],
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [activePerformanceMetric, setActivePerformanceMetric] = useState<"revenue" | "orders">("revenue");

  const addProductRow = () => {
    setOrderFormData({
      ...orderFormData,
      products: [...orderFormData.products, { productId: "", quantity: 1, price: "" as any }],
    });
  };

  const removeProductRow = (index: number) => {
    if (orderFormData.products.length <= 1) return;
    const newProducts = [...orderFormData.products];
    newProducts.splice(index, 1);
    setOrderFormData({ ...orderFormData, products: newProducts });
  };

  const updateProductRow = (index: number, field: string, value: any) => {
    const newProducts = [...orderFormData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setOrderFormData({ ...orderFormData, products: newProducts });
  };

  const handleUpdateCredit = async () => {
    if (!dealer) return;
    try {
      setIsUpdatingCredit(true);
      await updateDealer(dealer.id, { creditLimit: Number(newCreditLimit) });
      toast.success("Credit limit updated successfully");
      setIsCreditDialogOpen(false);
    } catch (err) {
      toast.error("Failed to update credit limit");
    } finally {
      setIsUpdatingCredit(false);
    }
  };

  const handleCreateOrder = async () => {
    if (orderFormData.products.some(p => !p.productId)) {
      toast.error("Please select a product for all items.");
      return;
    }

    try {
      setIsCreatingOrder(true);
      await addOrder({
        dealerId: dealer!.id,
        products: orderFormData.products.map(p => ({
          productId: p.productId,
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
        })),
      });
      toast.success("Order created successfully!");
      setOrderFormData({
        products: [{ productId: "", quantity: 1, price: "" as any }],
      });
      setIsOrderDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create order");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  useEffect(() => {
    if (dealer) {
      setIsLoading(false);
      setNewCreditLimit(dealer.creditLimit || "");
    }
  }, [dealer]);

  if (!dealer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Dealer not found</h2>
          <Link to="/dealers" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Dealers
          </Link>
        </div>
      </div>
    );
  }

  const dealerClaims = claims.filter((c: any) =>
    c.dealerId?._id === dealer.id ||
    c.dealerId === dealer.id ||
    c.metadata?.DealerName === dealer.name
  );
  const creditLimit = Number(dealer.creditLimit) || 0;
  const outstandingAmount = Number(dealer.outstandingAmount) || 0;
  const creditUtilization = creditLimit > 0 ? (outstandingAmount / creditLimit) * 100 : 0;
  const totalRevenue = dealerOrders.reduce((sum, order) => sum + (Number((order as any).totalValue) || 0), 0);

  const performanceData = useMemo(() => {
    const months: any[] = [];
    const now = new Date();
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        fullYear: d.getFullYear(),
        monthNum: d.getMonth(),
        orders: 0,
        revenue: 0 
      });
    }

    dealerOrders.forEach((order: any) => {
      if (order.status === "Cancelled") return;
      const orderDate = new Date(order.createdAt);
      const mIdx = months.findIndex(m => 
        m.monthNum === orderDate.getMonth() && m.fullYear === orderDate.getFullYear()
      );
      
      if (mIdx > -1) {
        months[mIdx].orders += 1;
        months[mIdx].revenue += (Number(order.totalValue) || 0);
      }
    });

    const avgRevenue = months.reduce((sum, m) => sum + m.revenue, 0) / months.length;
    const avgOrders = months.reduce((sum, m) => sum + m.orders, 0) / months.length;

    return { data: months, avgRevenue, avgOrders };
  }, [dealerOrders]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dealers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 mb-1" />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{dealer!.name}</h1>
            )}
            {isLoading ? <Skeleton className="h-4 w-32" /> : <p className="text-sm text-gray-600 mt-1">Dealer Code: {dealer.code}</p>}
          </div>
        </div>
        {isLoading ? <Skeleton className="h-6 w-20 rounded-full" /> : <StatusBadge status={dealer.status} />}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: dealer.totalOrders || dealerOrders.length },
          { label: "Total Revenue", value: `₹${Number(totalRevenue || 0).toLocaleString('en-IN')}`, color: "text-green-600" },
          { label: "Credit Utilization", value: `${(creditUtilization || 0).toFixed(0)}%`, color: "text-orange-600" }
        ].map((card, i) => (
          <Card key={i} className="p-4">
            <p className="text-sm text-gray-600">{card.label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-2xl font-bold ${card.color || "text-gray-900"}`}>{card.value}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="info">Basic Information</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="warranty">Warranty Claims</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Phone", value: dealer.phone, icon: Phone },
                    { label: "Email", value: dealer.email, icon: Mail },
                    { label: "Location", value: `${dealer.city}, ${dealer.region}`, icon: MapPin },
                    { label: "Distributor", value: dealer.distributorName || "Direct / None", icon: Users },
                    { label: "Joined Date", value: dealer.joinedDate, icon: Calendar }
                  ].map((info, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <info.icon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{info.label}</p>
                        {isLoading ? <Skeleton className="h-4 w-24" /> : <p className="text-sm font-medium text-gray-900">{info.value}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Financial Information
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-gray-600">Credit Limit</span>
                        <span className="font-bold text-gray-900">₹{Number(creditLimit || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-gray-600">Outstanding Amount</span>
                        <span className="font-bold text-red-600">₹{Number(outstandingAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Available Credit</span>
                        <span className="font-bold text-green-600">₹{Number((creditLimit || 0) - outstandingAmount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Credit Utilization</p>
                      {isLoading ? <Skeleton className="h-4 w-full" /> : <Progress value={creditUtilization} className="h-3" />}
                      <p className="text-xs text-gray-500 text-right">
                        {isLoading ? <Skeleton className="h-3 w-20 ml-auto" /> : `${(creditUtilization || 0).toFixed(1)}% utilized`}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Order Number
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Product
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Value
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                          </tr>
                        ))
                      ) : (
                        dealerOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <Link
                                to={`/orders/${order.id}`}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {order.product}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              ₹{order.totalValue.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={order.paymentStatus} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {order.orderDate}
                            </td>
                            <td className="px-4 py-3">
                              {(order as any).currentStage !== "Cancelled" && (order as any).currentStage !== "Closure" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                                  onClick={async () => {
                                    if (window.confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
                                      try {
                                        await cancelOrder(order.id);
                                        toast.success("Order cancelled");
                                      } catch (err) {
                                        toast.error("Failed to cancel order");
                                      }
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="warranty" className="mt-6">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Claim Number
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Product
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Issue
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                          </tr>
                        ))
                      ) : (
                        dealerClaims.map((claim: any) => (
                          <tr key={claim._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <Link
                                to={`/warranty/${claim._id}`}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {claim.claimNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {claim.productId?.name || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                              {claim.issueDescription}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={claim.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <Card className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {activePerformanceMetric === "revenue" ? "Monthly Revenue Trend" : "Monthly Order Trend"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Last 6 months · {activePerformanceMetric === "revenue" ? "Indian Rupee (₹)" : "Order Count"}
                    </p>
                  </div>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
                    <button
                      onClick={() => setActivePerformanceMetric("revenue")}
                      className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                        activePerformanceMetric === "revenue"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Revenue
                    </button>
                    <button
                      onClick={() => setActivePerformanceMetric("orders")}
                      className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                        activePerformanceMetric === "orders"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Orders
                    </button>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={performanceData.data} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 13}} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 13}} 
                      tickFormatter={(value) => {
                        if (value === 0) return '₹0';
                        if (activePerformanceMetric === "orders") return value;
                        if (value >= 100000) return `₹${(value / 100000).toFixed(activePerformanceMetric === "revenue" ? 1 : 0)}L`;
                        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
                        return `₹${value}`;
                      }}
                      domain={[0, (max: number) => {
                        const buffer = max * 1.2;
                        if (activePerformanceMetric === "orders") return Math.max(Math.ceil(buffer), 5);
                        return Math.max(Math.ceil(buffer), 100000);
                      }]}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value;
                          return (
                            <div className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-xl border border-blue-500 relative -top-8">
                              {activePerformanceMetric === "revenue" 
                                ? `₹${Number(val).toLocaleString('en-IN')}` 
                                : `${val} Orders`}
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={activePerformanceMetric === "revenue" ? "revenue" : "orders"} 
                      stroke="#2563eb" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorMetric)"
                      activeDot={{ r: 8, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <ReferenceLine 
                      y={activePerformanceMetric === "revenue" ? performanceData.avgRevenue : performanceData.avgOrders} 
                      stroke="#94a3b8" 
                      strokeDasharray="5 5"
                      label={{ value: 'Avg', position: 'right', fill: '#94a3b8', fontSize: 10 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-400 italic">
                  Tip — Selecting individual metrics provides a clearer view of performance trends over time.
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="kyc" className="mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">KYC Documents</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Verification documents for {dealer.companyType || "this dealer"}
                    </p>
                  </div>
                  <StatusBadge status={dealer.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dealer.kycDocuments && dealer.kycDocuments.length > 0 ? (
                    dealer.kycDocuments.map((doc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-white transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {doc.name.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
                            onClick={() => setSelectedDoc({ name: doc.name, url: doc.url })}
                            title="Quick View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                            asChild
                            title="Download"
                          >
                            <a href={doc.url} download={doc.name} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No KYC documents found for this dealer.</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {isAdmin && dealer.status === "Pending" && (
                <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Dealer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve {dealer.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <p className="text-sm text-gray-600">
                        Approving this dealer will create a portal user account. Please set a temporary password for their first login.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="password">Login Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter temporary password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsApprovalOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        disabled={!password || isApproving}
                        onClick={async () => {
                          try {
                            setIsApproving(true);
                            await approveDealer(dealer.id, password);
                            toast.success("Dealer approved and user account created!");
                            setIsApprovalOpen(false);
                          } catch (err) {
                            toast.error("Failed to approve dealer");
                          } finally {
                            setIsApproving(false);
                          }
                        }}
                      >
                        {isApproving ? "Approving..." : "Confirm Approval"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start" variant="outline">
                    Create Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Order for {dealer.name}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Products <span className="text-red-500">*</span></Label>
                        <Button type="button" variant="outline" size="sm" onClick={addProductRow} className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {orderFormData.products.map((row, index) => (
                          <div key={index} className="flex gap-2 items-center group">
                            <div className="flex-grow grid grid-cols-12 gap-2 items-center border p-2 rounded-md bg-white shadow-sm">
                              <div className="col-span-6">
                                <ProductCombobox
                                  onSelect={(selected) => {
                                    const product = Array.isArray(selected) ? selected[0] : selected;
                                    updateProductRow(index, "productId", product?.id || "");
                                    if (product?.price) {
                                      updateProductRow(index, "price", product.price);
                                    }
                                  }}
                                  placeholder="Select product..."
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Qty"
                                  value={row.quantity}
                                  onChange={(e) => updateProductRow(index, "quantity", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-4">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                  <Input
                                    type="number"
                                    placeholder="Price"
                                    value={row.price}
                                    onChange={(e) => updateProductRow(index, "price", e.target.value)}
                                    className="h-9 pl-6"
                                  />
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                              onClick={() => removeProductRow(index)}
                              disabled={orderFormData.products.length <= 1}
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-6 border-t pt-4">
                    <div className="flex-1 flex items-center text-sm">
                      <span className="text-gray-500 mr-2">Estimate Total:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₹{orderFormData.products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity) || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      disabled={isCreatingOrder}
                      className="bg-blue-600 hover:bg-blue-700 px-8"
                      onClick={handleCreateOrder}
                    >
                      {isCreatingOrder ? "Creating..." : "Submit Order"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start" variant="outline">
                    Update Credit Limit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Credit Limit</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="creditLimit">New Credit Limit (in ₹)</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        placeholder="Enter new credit limit"
                        value={newCreditLimit}
                        onChange={(e) => setNewCreditLimit(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Current: ₹{Number(dealer.creditLimit || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      disabled={!newCreditLimit || isUpdatingCredit}
                      onClick={handleUpdateCredit}
                    >
                      {isUpdatingCredit ? "Updating..." : "Update Limit"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setActiveTab("kyc")}
              >
                View KYC Documents
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Manage Pricing Rules
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Send Notification
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Person
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {dealer.contactPerson}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-sm font-medium text-gray-900">{dealer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm font-medium text-gray-900">{dealer.email}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="capitalize">
                {selectedDoc?.name.replace(/([A-Z])/g, ' $1').trim() || "Document Preview"}
              </span>
              <div className="flex items-center gap-2 mr-6">
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedDoc?.url} download={selectedDoc?.name} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-gray-100 overflow-hidden relative">
            {selectedDoc?.url.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={`${selectedDoc.url}#toolbar=0`}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={selectedDoc?.url}
                  alt="Document Preview"
                  className="max-w-full max-h-full object-contain shadow-lg"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
