import {
  ShoppingCart,
  CheckCircle,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  MoreVertical,
  Calendar,
  DollarSign,
  Briefcase,
  Wrench,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { KPICard } from "../components/KPICard";
import { Card } from "../components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
import { useAnalytics } from "../hooks/useAnalytics";

export function ExecutiveDashboard() {
  const { data: analytics, isLoading: isAnalyticsLoading, fetchLeads } = useAnalytics();
  const { isAdmin } = useAuth();
  const { orders, isLoading: isOrdersLoading } = useOrders();
  const { data: leads = [], isLoading: isLeadsLoading } = useLeads();
  const { claims = [], isLoading: isClaimsLoading } = useWarranty();
  const { data: dealers = [], isLoading: isDealersLoading } = useDealers();
  const [leadRange, setLeadRange] = useState("6");

  const isLoading = isAnalyticsLoading || isOrdersLoading || isLeadsLoading || isClaimsLoading || isDealersLoading;

  const overview = analytics?.overview || {
    activeDealers: 0,
    monthlyOrders: 0,
    pendingApprovals: 0,
    openWarranties: 0,
    ordersGrowth: 0,
    recentOrders: 0
  };

  const leadsAnalytics = analytics?.leads || { sources: [], conversion: [] };

  useEffect(() => {
    fetchLeads(leadRange);
  }, [leadRange, fetchLeads]);

  const recentOrders = orders.slice(0, 3);
  const pendingClaims = claims.filter(
    (c) => c.status === "Complaint Received" || c.status === "Technician Assigned"
  ).slice(0, 3);

  const lowStockItems = (analytics?.inventory || []).filter(
    (i: any) => i.status === "Low" || i.status === "Critical"
  ).slice(0, 3);

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
              value={(overview?.activeDealers ?? dealers.length).toString()}
              icon={Package}
              color="blue"
            />
            <KPICard
              title="Recent Orders"
              value={(overview?.monthlyOrders ?? overview?.recentOrders ?? orders.length).toString()}
              icon={ShoppingCart}
              color="green"
            />
            <KPICard
              title="Pending Approvals"
              value={(overview?.pendingApprovals ?? 0).toString()}
              icon={Clock}
              color="orange"
            />
            <KPICard
              title="Open Warranty"
              value={(overview?.openWarranties ?? 0).toString()}
              icon={AlertCircle}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead vs Customer Conversion */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lead to Customer Conversion
          </h3>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leadsAnalytics.conversion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} interval={0} height={50} tick={{ dy: 5 }} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="leads" fill="#2563eb" name="Leads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="customers" fill="#16a34a" name="Customers" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Lead Source Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Lead Source Distribution
            </h3>
            <select
              value={leadRange}
              onChange={(e) => setLeadRange(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
            </select>
          </div>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={leadsAnalytics.sources}
                  cx="40%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {leadsAnalytics.sources.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle" 
                  iconType="circle"
                  formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                />
              </PieChart>
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
              Array(3).fill(0).map((_, i) => (
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
              Array(3).fill(0).map((_, i) => (
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
                      <p className="text-xs text-gray-600">{claim.dealerId?.companyName || "Unknown Dealer"}</p>
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
              Array(3).fill(0).map((_, i) => (
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
              lowStockItems.map((item: any) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${item.status === "Critical" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.product}
                      </h4>
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {item.inStock} units
                    </p>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${item.status === "Critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}
                    >
                      {item.status}
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
