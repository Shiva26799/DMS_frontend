import { useParams, Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, TrendingUp, CheckCircle, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockDealers, mockOrders, mockWarrantyClaims } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { useOrders } from "../context/OrderContext";
import { Skeleton } from "../components/ui/skeleton";
import { useDealer, useApproveDealer } from "../hooks/useDealers";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function DealerDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { data: serverDealer, isLoading } = useDealer(id || "");
  
  // Merge server data with mock data as fallback
  const dealer = useMemo(() => {
    if (serverDealer) return serverDealer;
    return mockDealers.find(d => d._id === id);
  }, [serverDealer, id]);

  const { getOrdersByDealer } = useOrders();
  const dealerOrders = useMemo(() => {
    return getOrdersByDealer(dealer?._id || id || "");
  }, [dealer, id, getOrdersByDealer]);

  
  const approveDealerMutation = useApproveDealer();
  
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [initialPassword, setInitialPassword] = useState(""); // Renamed from 'password'
  const [isSubmitting, setIsSubmitting] = useState(false); // Kept for mutation state

  if (!isLoading && !dealer) {
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

  const dealerClaims = mockWarrantyClaims.filter((c) => c.dealer === (dealer?.companyName || ""));
  const creditUtilization = dealer?.creditLimit && dealer?.creditLimit > 0
    ? ((dealer?.outstandingAmount || 0) / dealer?.creditLimit) * 100
    : 0;

  const performanceData = [
    { month: "Sep", orders: 8, revenue: 1.5 },
    { month: "Oct", orders: 10, revenue: 1.9 },
    { month: "Nov", orders: 7, revenue: 1.3 },
    { month: "Dec", orders: 12, revenue: 2.2 },
    { month: "Jan", orders: 9, revenue: 1.7 },
    { month: "Feb", orders: 6, revenue: 1.1 },
  ];

  const handleApprove = async () => {
    if (!initialPassword) {
      toast.error("Password is required");
      return;
    }
    setIsSubmitting(true);
    approveDealerMutation.mutate(
      { id: dealer?._id || "", data: { status: "Approved", password: initialPassword } },
      {
        onSuccess: () => {
          setIsApproveDialogOpen(false);
          setInitialPassword("");
          toast.success("Dealer approved successfully!");
        },
        onError: (error) => {
          toast.error(`Failed to approve dealer: ${error.message}`);
        },
        onSettled: () => setIsSubmitting(false)
      }
    );
  };

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
              <h1 className="text-2xl font-bold text-gray-900">{dealer?.companyName}</h1>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">Owner: {dealer?.ownerName}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && dealer?.status === "Pending" && (
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Dealer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Approve Dealer</DialogTitle>
                  <DialogDescription>
                    Approving this dealer will automatically create a User account for them. Please set an initial password.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Set Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter temporary password"
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      The dealer will use this password for their first login.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsApproveDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Approving..." : "Confirm Approval"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <StatusBadge status={dealer?.status || "Pending"} />
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Profile
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: dealer?.totalOrders !== undefined ? dealer.totalOrders : "-" },
          { 
            label: "Total Revenue", 
            value: dealer?.totalRevenue !== undefined 
              ? `₹${(dealer.totalRevenue / 10000000).toFixed(1)}Cr` 
              : "-", 
            color: "text-green-600" 
          },
          { label: "Performance Score", value: dealer?.performance !== undefined ? `${dealer.performance}%` : "-", icon: TrendingUp },
          { 
            label: "Credit Utilization", 
            value: dealer?.creditLimit && dealer.creditLimit > 0 
              ? `${(((dealer.outstandingAmount || 0) / dealer.creditLimit) * 100).toFixed(0)}%` 
              : "0", 
            color: "text-orange-600" 
          }
        ].map((card, i) => (
          <Card key={i} className="p-4">
            <p className="text-sm text-gray-600">{card.label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                {card.icon && <card.icon className={`w-5 h-5 ${(dealer?.performance || 0) >= 85 ? "text-green-500" : "text-yellow-500"}`} />}
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
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  {[
                    { label: "Owner Name", value: dealer?.ownerName, icon: Calendar },
                    { label: "Phone", value: dealer?.contact || dealer?.phone, icon: Phone },
                    { label: "Email", value: dealer?.email, icon: Mail },
                    { label: "Region", value: dealer?.region, icon: MapPin },
                    { label: "City", value: dealer?.city, icon: MapPin },
                    { label: "Pincode", value: dealer?.pincode, icon: MapPin },
                  ].map((info, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <info.icon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{info.label}</p>
                        {isLoading ? <Skeleton className="h-4 w-24" /> : <p className="text-sm font-medium text-gray-900">{info.value || "N/A"}</p>}
                      </div>
                    </div>
                  ))}
                  <div className="col-span-2 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1 font-medium">Full Address</p>
                    {isLoading ? <Skeleton className="h-10 w-full" /> : <p className="text-sm text-gray-900 whitespace-pre-wrap">{dealer?.address}</p>}
                  </div>
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Financial & Tax Details
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">GSTIN</p>
                    <p className="text-sm font-medium text-gray-900">{dealer?.gstin || "Not Provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">PAN Number</p>
                    <p className="text-sm font-medium text-gray-900">{dealer?.pan || "Not Provided"}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Credit Limit</p>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          {dealer?.creditLimit !== undefined ? `₹${(dealer.creditLimit / 100000).toFixed(1)}L` : "-"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Outstanding Amount</p>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <p className="text-sm font-medium text-orange-600">
                          {dealer?.outstandingAmount !== undefined ? `₹${(dealer.outstandingAmount / 100000).toFixed(1)}L` : "-"}
                        </p>
                      )}
                    </div>
                    {isLoading ? <Skeleton className="h-2 w-full" /> : <Progress value={creditUtilization} className="h-2" />}
                    <p className="text-xs text-gray-500 mt-2">
                      {isLoading ? <Skeleton className="h-3 w-40" /> : `${creditUtilization.toFixed(1)}% of credit limit utilized`}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Available Credit</p>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <p className="text-sm font-medium text-green-600">
                          {dealer?.creditLimit !== undefined && dealer?.outstandingAmount !== undefined
                            ? `₹${((dealer.creditLimit - dealer.outstandingAmount) / 100000).toFixed(1)}L`
                            : "-"}
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
                              ₹{(order.totalValue / 100000).toFixed(1)}L
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={order.paymentStatus} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {order.orderDate}
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
          </Tabs>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {isAdmin && dealer?.status === "Pending" && (
                <Button 
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" 
                  variant="outline"
                  onClick={() => setIsApproveDialogOpen(true)}
                >
                  Confirm Approval & Create User
                </Button>
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
                {isLoading ? <Skeleton className="h-4 w-24" /> : <p className="text-sm font-medium text-gray-900">{dealer?.contactPerson || dealer?.ownerName}</p>}
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                {isLoading ? <Skeleton className="h-4 w-32" /> : <p className="text-sm font-medium text-gray-900">{dealer?.phone || dealer?.contact}</p>}
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                {isLoading ? <Skeleton className="h-4 w-40" /> : <p className="text-sm font-medium text-gray-900">{dealer?.email}</p>}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
