import { useState } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockDealers } from "../data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";

export function DealerManagement() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDealers = mockDealers.filter((dealer) => {
    const matchesStatus = filterStatus === "all" || dealer.status.toLowerCase() === filterStatus;
    const matchesRegion = filterRegion === "all" || dealer.region === filterRegion;
    const matchesSearch =
      dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesRegion && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dealer Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage dealer network and performance
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Dealer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Dealers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {mockDealers.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Dealers</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {mockDealers.filter((d) => d.status === "Active").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Credit Limit</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ₹{(mockDealers.reduce((sum, d) => sum + d.creditLimit, 0) / 10000000).toFixed(1)}Cr
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Outstanding Amount</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            ₹{(mockDealers.reduce((sum, d) => sum + d.outstandingAmount, 0) / 10000000).toFixed(1)}Cr
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
                placeholder="Search dealers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="Punjab">Punjab</SelectItem>
              <SelectItem value="Haryana">Haryana</SelectItem>
              <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
              <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
              <SelectItem value="Maharashtra">Maharashtra</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Dealers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Dealer
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Code
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Region
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Credit Limit
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Outstanding
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Performance
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
              {filteredDealers.map((dealer) => {
                const creditUtilization = (dealer.outstandingAmount / dealer.creditLimit) * 100;
                return (
                  <tr key={dealer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {dealer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dealer.city}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dealer.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dealer.region}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{(dealer.creditLimit / 100000).toFixed(1)}L
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            ₹{(dealer.outstandingAmount / 100000).toFixed(1)}L
                          </p>
                          {creditUtilization > 90 && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <Progress
                          value={creditUtilization}
                          className="h-1.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {creditUtilization.toFixed(0)}% utilized
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`w-4 h-4 ${
                            dealer.performance >= 85
                              ? "text-green-500"
                              : dealer.performance >= 75
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            dealer.performance >= 85
                              ? "text-green-600"
                              : dealer.performance >= 75
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {dealer.performance}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={dealer.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/dealers/${dealer.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
