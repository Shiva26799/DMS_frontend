import {
  ShoppingCart,
  CheckCircle,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import { KPICard } from "../components/KPICard";
import { Card } from "../components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StatusBadge } from "../components/StatusBadge";
import { mockWarrantyClaims, mockInventory } from "../data/mockData";
import { Link } from "react-router";
import { Skeleton } from "../components/ui/skeleton";
import { useState, useEffect } from "react";
import { useOrders } from "../context/OrderContext";
import { useLeads } from "../hooks/useLeads";
import { useWarranty } from "../context/WarrantyContext";
import { useDealers } from "../hooks/useDealers";
import { useAuth } from "../context/AuthContext";

const salesData = [
  { month: "Aug", sales: 12.5, target: 15 },
  { month: "Sep", sales: 18.2, target: 18 },
  { month: "Oct", sales: 22.5, target: 20 },
  { month: "Nov", sales: 19.8, target: 22 },
  { month: "Dec", sales: 25.3, target: 25 },
  { month: "Jan", sales: 28.5, target: 26 },
  { month: "Feb", sales: 32.1, target: 30 },
];

const inventoryData = [
  { product: "HP-2000", inStock: 15, reserved: 3 },
  { product: "HP-3000", inStock: 8, reserved: 2 },
  { product: "HP-4000", inStock: 5, reserved: 1 },
  { product: "Spare Parts", inStock: 230, reserved: 40 },
];

export function ExecutiveDashboard() {
  const { user, isAdmin, isDistributor } = useAuth();
  const { orders, isLoading: isOrdersLoading } = useOrders();
  const { data: leads = [], isLoading: isLeadsLoading } = useLeads();
  const { claims = [], isLoading: isClaimsLoading } = useWarranty();
  const { data: dealers = [], isLoading: isDealersLoading } = useDealers();

  const isLoading = isOrdersLoading || isLeadsLoading || isClaimsLoading || isDealersLoading;

  const recentOrders = orders.slice(0, 5);
  
  // Real-time metrics
  const monthlyOrders = orders.filter(o => {
    const orderDate = new Date(o.orderDate);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).length;

  const pendingApprovals = orders.filter(o => o.currentStage === "Order Approval" || o.currentStage === "Payment Verification").length;
  
  const openWarranties = claims.filter(c => c.status !== "Closed").length;

  const pendingClaims = claims.filter(
    (c) => c.status === "Complaint Received" || c.status === "Technician Assigned"
  ).slice(0, 5);

  const lowStockItems = mockInventory.filter(
    (i) => i.status === "Low" || i.status === "Critical"
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Overview of key metrics and business performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-3 w-12" />
            </Card>
          ))
        ) : (
          <>
            <KPICard
              title={isAdmin ? "Total Dealers" : "Active Dealers"}
              value={isAdmin ? dealers.length.toString() : dealers.length.toString()}
              icon={Package}
              color="blue"
            />
            <KPICard
              title="Recent Orders"
              value={orders.length.toString()}
              icon={ShoppingCart}
              trend={{ value: `${monthlyOrders} this month`, positive: true }}
              color="green"
            />
            <KPICard
              title="Pending Approvals"
              value={pendingApprovals.toString()}
              icon={Clock}
              color="orange"
            />
            <KPICard
              title="Open Warranty"
              value={openWarranties.toString()}
              icon={AlertCircle}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales Trend (₹Cr)
          </h3>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Actual Sales"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#16a34a"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Inventory Movement */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Status
          </h3>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inStock" fill="#2563eb" name="In Stock" />
                <Bar dataKey="reserved" fill="#f97316" name="Reserved" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom Section - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
            <Link
              to="/orders"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-600">{order.dealer}</p>
                    </div>
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{order.orderDate}</span>
                    <span className="font-medium text-gray-900">
                      ₹{(order.totalValue / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Pending Claims */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Warranty Claims
            </h3>
            <Link
              to="/warranty"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : (
              pendingClaims.map((claim) => (
                <div
                  key={claim._id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {claim.claimNumber}
                      </p>
                      <p className="text-xs text-gray-600">{claim.dealerId?.companyName || "N/A"}</p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {claim.issueDescription}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Low Stock Alerts
            </h3>
            <Link
              to="/inventory"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.sku}
                      </p>
                      <p className="text-xs text-gray-600">{item.warehouseName}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Available: {item.available}</span>
                    <span className="text-red-600 font-medium">
                      Reorder: {item.reorderLevel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
