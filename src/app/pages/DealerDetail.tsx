import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, Users, CheckCircle, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockWarrantyClaims } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { useDealers } from "../context/DealerContext";
import { useOrders } from "../context/OrderContext";
import { Skeleton } from "../components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export function DealerDetail() {
  const { id } = useParams();
  const { getDealer, approveDealer } = useDealers();
  const { getOrdersByDealer, cancelOrder } = useOrders();
  const { isAdmin } = useAuth();
  const dealer = getDealer(id || "");
  const dealerOrders = getOrdersByDealer(id || "");
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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

  const dealerClaims = mockWarrantyClaims.filter((c) => c.dealer === dealer.name);
  const creditLimit = Number(dealer.creditLimit) || 0;
  const outstandingAmount = Number(dealer.outstandingAmount) || 0;
  const creditUtilization = creditLimit > 0 ? (outstandingAmount / creditLimit) * 100 : 0;
  const totalRevenue = dealerOrders.reduce((sum, order) => sum + (Number((order as any).totalValue) || 0), 0);

  const performanceData = [
    { month: "Sep", orders: 8, revenue: 1.5 },
    { month: "Oct", orders: 10, revenue: 1.9 },
    { month: "Nov", orders: 7, revenue: 1.3 },
    { month: "Dec", orders: 12, revenue: 2.2 },
    { month: "Jan", orders: 9, revenue: 1.7 },
    { month: "Feb", orders: 6, revenue: 1.1 },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">{dealer.name}</h1>
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
          { label: "Total Revenue", value: `₹${(totalRevenue / 10000000).toFixed(1)}Cr`, color: "text-green-600" },
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
          <Tabs defaultValue="info">
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
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Credit Limit</p>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          ₹{creditLimit.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Outstanding Amount</p>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <p className="text-sm font-medium text-orange-600">
                          ₹{outstandingAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {isLoading ? <Skeleton className="h-2 w-full" /> : <Progress value={creditUtilization} className="h-2" />}
                    <p className="text-xs text-gray-500 mt-2">
                      {isLoading ? <Skeleton className="h-3 w-40" /> : `${(creditUtilization || 0).toFixed(1)}% of credit limit utilized`}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Available Credit</p>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <p className="text-sm font-medium text-green-600">
                          ₹{(creditLimit - outstandingAmount).toLocaleString()}
                        </p>
                      )}
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
                        dealerClaims.map((claim) => (
                          <tr key={claim.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <Link
                                to={`/warranty/${claim.id}`}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {claim.claimNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {claim.productName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                              {claim.issueDescription}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={claim.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {claim.submittedDate}
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
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  6-Month Performance Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="orders" fill="#2563eb" name="Orders" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#16a34a" name="Revenue (Cr)" />
                  </BarChart>
                </ResponsiveContainer>
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
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-white transition-colors">
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
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        </Button>
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
              <Button className="w-full justify-start" variant="outline">
                Create Order
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Update Credit Limit
              </Button>
              <Button className="w-full justify-start" variant="outline">
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
    </div>
  );
}
