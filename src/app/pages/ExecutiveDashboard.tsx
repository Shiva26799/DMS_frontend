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
import { mockOrders, mockWarrantyClaims, mockInventory } from "../data/mockData";
import { Link } from "react-router";

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

const dealerPerformance = [
  { dealer: "Maharashtra", score: 95 },
  { dealer: "Punjab", score: 92 },
  { dealer: "South India", score: 88 },
  { dealer: "Haryana", score: 85 },
  { dealer: "UP", score: 75 },
];

export function ExecutiveDashboard() {
  const recentOrders = mockOrders.slice(0, 5);
  const pendingClaims = mockWarrantyClaims.filter(
    (c) => c.status === "Submitted" || c.status === "Under Review"
  );
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Monthly Orders"
          value="24"
          icon={ShoppingCart}
          trend={{ value: "12%", positive: true }}
          color="blue"
        />
        <KPICard
          title="Pending Approvals"
          value="8"
          icon={Clock}
          color="orange"
        />
        <KPICard
          title="Inventory Value"
          value="₹15.2Cr"
          icon={Package}
          trend={{ value: "5%", positive: true }}
          color="green"
        />
        <KPICard
          title="Dealer Performance"
          value="87%"
          icon={TrendingUp}
          trend={{ value: "3%", positive: true }}
          color="purple"
        />
        <KPICard
          title="Open Warranty"
          value="12"
          icon={AlertCircle}
          color="orange"
        />
        <KPICard title="Backorders" value="5" icon={CheckCircle} color="red" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales Trend (₹Cr)
          </h3>
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
        </Card>

        {/* Inventory Movement */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Status
          </h3>
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
        </Card>
      </div>

      {/* Dealer Performance Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dealer Performance Score
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dealerPerformance} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="dealer" />
            <Tooltip />
            <Bar dataKey="score" fill="#16a34a" name="Performance %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

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
            {recentOrders.map((order) => (
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
            ))}
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
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {claim.claimNumber}
                    </p>
                    <p className="text-xs text-gray-600">{claim.dealer}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {claim.issueDescription}
                </p>
              </div>
            ))}
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
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.sku}
                    </p>
                    <p className="text-xs text-gray-600">{item.locationName}</p>
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
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
