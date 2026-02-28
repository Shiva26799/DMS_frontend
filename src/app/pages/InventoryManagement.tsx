import { useState } from "react";
import { Filter, Search, Download, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockInventory } from "../data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";

export function InventoryManagement() {
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInventory = mockInventory.filter((item) => {
    const matchesLocation = filterLocation === "all" || item.location === filterLocation;
    const matchesStatus = filterStatus === "all" || item.status.toLowerCase() === filterStatus;
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesStatus && matchesSearch;
  });

  const totalValue = mockInventory.reduce((sum, item) => {
    // Rough estimate: assuming average price of 50,000 per unit
    return sum + item.available * 50000;
  }, 0);

  const lowStockCount = mockInventory.filter(
    (item) => item.status === "Low" || item.status === "Critical"
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Multi-location inventory tracking
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {mockInventory.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Inventory Value</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ₹{(totalValue / 10000000).toFixed(1)}Cr
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Storage Locations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Set(mockInventory.map((i) => i.locationName)).size}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Factory">Factory</SelectItem>
              <SelectItem value="Regional Warehouse">
                Regional Warehouse
              </SelectItem>
              <SelectItem value="Dealer Warehouse">Dealer Warehouse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  SKU
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Product Name
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Location
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Available
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Reserved
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Reorder Level
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {item.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.location}
                      </p>
                      <p className="text-xs text-gray-500">{item.locationName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        item.available > item.reorderLevel
                          ? "text-green-600"
                          : item.available > 0
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.available}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.reserved}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.reorderLevel}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm">
                      Update Stock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reorder Suggestions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reorder Suggestions
          </h3>
          <Button variant="outline" size="sm">
            Generate PO
          </Button>
        </div>
        <div className="space-y-3">
          {mockInventory
            .filter(
              (item) =>
                item.status === "Low" ||
                item.status === "Critical" ||
                item.available <= item.reorderLevel
            )
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      item.status === "Critical"
                        ? "text-red-500"
                        : "text-orange-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.sku} - {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">{item.locationName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Available: {item.available} / Reorder: {item.reorderLevel}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    Suggested Order: {item.reorderLevel * 2 - item.available}{" "}
                    units
                  </p>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
