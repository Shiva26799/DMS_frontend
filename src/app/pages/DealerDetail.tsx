import { useParams, Link } from "react-router";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockDealers, mockOrders, mockWarrantyClaims } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
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
  const dealer = mockDealers.find((d) => d.id === id);

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

  const dealerOrders = mockOrders.filter((o) => o.dealerId === dealer.id);
  const dealerClaims = mockWarrantyClaims.filter((c) => c.dealer === dealer.name);
  const creditUtilization = (dealer.outstandingAmount / dealer.creditLimit) * 100;

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
            <h1 className="text-2xl font-bold text-gray-900">{dealer.name}</h1>
            <p className="text-sm text-gray-600 mt-1">Dealer Code: {dealer.code}</p>
          </div>
        </div>
        <StatusBadge status={dealer.status} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{dealer.totalOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ₹{(dealer.totalRevenue / 10000000).toFixed(1)}Cr
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Performance Score</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className={`w-5 h-5 ${
              dealer.performance >= 85 ? "text-green-500" : "text-yellow-500"
            }`} />
            <p className="text-2xl font-bold text-gray-900">{dealer.performance}%</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Credit Utilization</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {creditUtilization.toFixed(0)}%
          </p>
        </Card>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{dealer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm font-medium text-gray-900">{dealer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-sm font-medium text-gray-900">
                        {dealer.city}, {dealer.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Joined Date</p>
                      <p className="text-sm font-medium text-gray-900">{dealer.joinedDate}</p>
                    </div>
                  </div>
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
                      <p className="text-sm font-medium text-gray-900">
                        ₹{(dealer.creditLimit / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Outstanding Amount</p>
                      <p className="text-sm font-medium text-orange-600">
                        ₹{(dealer.outstandingAmount / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <Progress value={creditUtilization} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">
                      {creditUtilization.toFixed(1)}% of credit limit utilized
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Available Credit</p>
                      <p className="text-sm font-medium text-green-600">
                        ₹{((dealer.creditLimit - dealer.outstandingAmount) / 100000).toFixed(1)}L
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dealerOrders.map((order) => (
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
                      ))}
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
                      {dealerClaims.map((claim) => (
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
                      ))}
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
