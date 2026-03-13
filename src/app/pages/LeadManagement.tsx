import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Filter, LayoutGrid, List, Search, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";

export interface Lead {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  product: string;
  source: "Web" | "Dealer";
  region: string;
  value: number;
  status: string;
  assignedTo?: string;
  assignedDate: string;
  notes?: string;
  dealer?: string;
}

export function LeadManagement() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    product: "",
    source: "Web" as "Web" | "Dealer",
    region: "",
    value: 0,
    notes: "",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await apiClient.get("/leads");
      setLeads(res.data);
    } catch (error) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/leads", {
        ...leadForm,
        status: "New",
        assignedDate: new Date().toISOString().split("T")[0],
      });
      setLeads([res.data, ...leads]);
      setIsDialogOpen(false);
      setLeadForm({
        customerName: "",
        phone: "",
        email: "",
        product: "",
        source: "Web",
        region: "",
        value: 0,
        notes: "",
      });
      toast.success("Lead created successfully");
    } catch (error) {
      toast.error("Failed to create lead");
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = filterStatus === "all" || lead.status.toLowerCase() === filterStatus;
    const matchesSource = filterSource === "all" || lead.source.toLowerCase() === filterSource;
    const matchesRegion = filterRegion === "all" || lead.region === filterRegion;
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.product.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSource && matchesRegion && matchesSearch;
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
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>


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
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="web">Web Leads</SelectItem>
                  <SelectItem value="dealer">Dealer Leads</SelectItem>
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
                        key={lead._id}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <Link to={`/leads/${lead._id}`} className="block hover:opacity-75 transition-opacity">
                            <p className="text-sm font-medium text-blue-600">
                              {lead.customerName}
                            </p>
                            <p className="text-xs text-gray-500">{lead.phone}</p>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {lead.product}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${lead.source === "Web"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {lead.source}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {lead.region}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(lead.value)}
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
                      <Link key={lead._id} to={`/leads/${lead._id}`}>
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {lead.customerName}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            {lead.product.split(" ")[1]}
                          </p>
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${lead.source === "Web"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                                }`}
                            >
                              {lead.source}
                            </span>
                            <span className="text-xs font-medium text-gray-900">
                              {formatCurrency(lead.value)}
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
        </>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Create a new sales lead in the system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  required
                  value={leadForm.customerName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setLeadForm({ ...leadForm, customerName: value });
                  }}
                  title="Name can only contain letters and spaces"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setLeadForm({ ...leadForm, phone: value });
                  }}
                  title="Phone must contain only numbers"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Select
                  value={leadForm.source}
                  onValueChange={(val: "Web" | "Dealer") => setLeadForm({ ...leadForm, source: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web">Web</SelectItem>
                    <SelectItem value="Dealer">Dealer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product Interest *</Label>
                <Input
                  id="product"
                  required
                  placeholder="e.g. Harvester 50.4"
                  value={leadForm.product}
                  onChange={(e) => setLeadForm({ ...leadForm, product: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select
                  value={leadForm.region}
                  onValueChange={(val) => setLeadForm({ ...leadForm, region: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Punjab">Punjab</SelectItem>
                    <SelectItem value="Haryana">Haryana</SelectItem>
                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                    <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Estimated Value (₹) *</Label>
              <Input
                id="value"
                type="text"
                required
                value={leadForm.value || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setLeadForm({ ...leadForm, value: val ? parseInt(val, 10) : 0 });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
