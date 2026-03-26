import { useState, useEffect } from "react";
import { Download, Filter, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const revenueData = [
  { month: "Aug", revenue: 12.5, target: 15 },
  { month: "Sep", revenue: 18.2, target: 18 },
  { month: "Oct", revenue: 22.5, target: 20 },
  { month: "Nov", revenue: 19.8, target: 22 },
  { month: "Dec", revenue: 25.3, target: 25 },
  { month: "Jan", revenue: 28.5, target: 26 },
  { month: "Feb", revenue: 32.1, target: 30 },
];

const regionData = [
  { region: "Punjab", revenue: 45.2, orders: 120 },
  { region: "Haryana", revenue: 38.5, orders: 95 },
  { region: "UP", revenue: 35.8, orders: 88 },
  { region: "AP", revenue: 42.3, orders: 110 },
  { region: "Maharashtra", revenue: 48.7, orders: 125 },
];

const productMixData = [
  { name: "HP-2000", value: 45, color: "#2563eb" },
  { name: "HP-3000", value: 30, color: "#16a34a" },
  { name: "HP-4000", value: 15, color: "#f97316" },
  { name: "Spare Parts", value: 10, color: "#a855f7" },
];

const dealerRankingData = [
  { dealer: "Maharashtra Agri", score: 95, revenue: 8.9 },
  { dealer: "Punjab Agro", score: 92, revenue: 8.5 },
  { dealer: "South India Equip", score: 88, revenue: 12.5 },
  { dealer: "Haryana Farm Tech", score: 85, revenue: 6.8 },
  { dealer: "UP Machinery Hub", score: 75, revenue: 9.5 },
];

const warrantyData = [
  { month: "Aug", claims: 8, cost: 1.2 },
  { month: "Sep", claims: 12, cost: 1.8 },
  { month: "Oct", claims: 10, cost: 1.5 },
  { month: "Nov", claims: 7, cost: 1.1 },
  { month: "Dec", claims: 15, cost: 2.2 },
  { month: "Jan", claims: 11, cost: 1.6 },
  { month: "Feb", claims: 9, cost: 1.3 },
];

export function Reports() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const [dateRange, setDateRange] = useState("6months");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive business intelligence and insights
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "₹156.4Cr", icon: DollarSign, trend: "+18.2%", color: "blue" },
          { label: "Total Orders", value: "538", icon: TrendingUp, trend: "+12.5%", color: "green" },
          { label: "Avg Order Value", value: "₹29.1L", icon: Calendar, trend: "+5.3%", color: "orange" },
          { label: "Growth Rate", value: "18.2%", icon: TrendingUp, trend: "YoY Growth", color: "purple" }
        ].map((kpi, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${kpi.color}-100 rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{kpi.label}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                )}
                <p className={`text-xs ${kpi.trend.startsWith("+") ? "text-green-600" : "text-gray-600"}`}>
                  {kpi.trend} {kpi.trend.includes("%") && !kpi.trend.includes("YoY") ? "vs last period" : ""}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="executive">
        <TabsList>
          <TabsTrigger value="executive">Executive Dashboard</TabsTrigger>
          <TabsTrigger value="operational">Operational Metrics</TabsTrigger>
          <TabsTrigger value="dealer">Dealer Performance</TabsTrigger>
          <TabsTrigger value="warranty">Warranty Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-6 space-y-6">
          {/* Revenue vs Target */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue vs Target (₹Cr)
              </h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="Actual Revenue"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Region Performance */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Revenue by Region (₹Cr)
                </h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#2563eb" name="Revenue (Cr)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Product Mix */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Mix
                </h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productMixData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Avg Fulfillment Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">12.5 days</p>
              <p className="text-xs text-green-600">-2.3 days vs last period</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Order Approval Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">94.5%</p>
              <p className="text-xs text-green-600">+2.1% vs last period</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">On-Time Delivery</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">89.2%</p>
              <p className="text-xs text-red-600">-1.5% vs last period</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Status Distribution
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-gray-900">245 (45.5%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: "45.5%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-sm font-medium text-gray-900">182 (33.8%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: "33.8%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Pending Approval</span>
                  <span className="text-sm font-medium text-gray-900">78 (14.5%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "14.5%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Cancelled</span>
                  <span className="text-sm font-medium text-gray-900">33 (6.2%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: "6.2%" }}></div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="dealer" className="mt-6 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Top 5 Dealer Performance
              </h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                      Rank
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                      Dealer Name
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                      Performance Score
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">
                      Revenue (₹Cr)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dealerRankingData.map((dealer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-gray-900">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {dealer.dealer}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              dealer.score >= 90
                                ? "text-green-600"
                                : dealer.score >= 80
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {dealer.score}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                dealer.score >= 90
                                  ? "bg-green-600"
                                  : dealer.score >= 80
                                  ? "bg-blue-600"
                                  : "bg-orange-600"
                              }`}
                              style={{ width: `${dealer.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        ₹{dealer.revenue}Cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="warranty" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">72</p>
              <p className="text-xs text-red-600">+8.3% vs last period</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Approval Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">85.4%</p>
              <p className="text-xs text-green-600">+3.2% vs last period</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Warranty Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹10.7L</p>
              <p className="text-xs text-red-600">+12.5% vs last period</p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Warranty Claims & Cost Trend
              </h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={warrantyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="claims"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Number of Claims"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Cost (₹L)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
