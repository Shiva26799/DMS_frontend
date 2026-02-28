import { useState } from "react";
import { Link } from "react-router";
import { Plus, Filter, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockLeads, Lead } from "../data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";

export function LeadManagement() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesStatus = filterStatus === "all" || lead.status.toLowerCase() === filterStatus;
    const matchesRegion = filterRegion === "all" || lead.region === filterRegion;
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.product.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesRegion && matchesSearch;
  });

  const leadsByStatus: Record<string, Lead[]> = {
    New: [],
    Assigned: [],
    Discussion: [],
    Negotiation: [],
    Won: [],
    Lost: [],
  };

  filteredLeads.forEach((lead) => {
    leadsByStatus[lead.status].push(lead);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage web and dealer-generated leads
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="discussion">Discussion</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
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
          <div className="flex gap-2 border-l pl-4">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {viewMode === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Lead ID
                  </th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Product
                  </th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Source
                  </th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Region
                  </th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Value
                  </th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {lead.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lead.customerName}
                        </p>
                        <p className="text-xs text-gray-500">{lead.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.product}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          lead.source === "Web"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.region}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{(lead.value / 100000).toFixed(1)}L
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.assignedDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Object.entries(leadsByStatus).map(([status, leads]) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{status}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {leads.length}
                </span>
              </div>
              <div className="space-y-3">
                {leads.map((lead) => (
                  <Link key={lead.id} to={`/leads/${lead.id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {lead.customerName}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {lead.product.split(" ")[1]}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            lead.source === "Web"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {lead.source}
                        </span>
                        <span className="text-xs font-medium text-gray-900">
                          ₹{(lead.value / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
