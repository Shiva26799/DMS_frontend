import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Filter, LayoutGrid, List, Search, Loader2, Trash2 } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { regions } from "../constants/region";
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
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { formatCurrency } from "../utils/currency";
import { useLeads, useAddLead, useDeleteLead } from "../hooks/useLeads";
import { useDebounce } from "../hooks/useDebounce";

import { ProductCombobox } from "../components/ProductCombobox";
import { useAuth } from "../context/AuthContext";
import { useDealers } from "../hooks/useDealers";

export interface Lead {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  product: string;
  source: "Web" | "Dealer";
  region: string;
  city?: string;
  value: number;
  status: string;
  rating: string;
  inquiryType: "Walk-in" | "Field" | "Campaign / Activity" | "Digital/Web";
  lossReason?: string;
  lossNotes?: string;
  assignedTo?: string;
  assignedDate: string;
  notes?: string;
  dealerId?: {
    _id: string;
    companyName: string;
    ownerName?: string;
  };
  followUps?: any[];
  createdAt: string;
}

export function LeadManagement() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { isAdmin, isDistributor, isDealer, user: authUser } = useAuth();
  const { data: leads = [], isLoading: isLeadsLoading } = useLeads();
  const { data: dealers = [] } = useDealers();
  const addLeadMutation = useAddLead();
  const deleteLeadMutation = useDeleteLead();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    product: "",
    source: "Web" as "Web" | "Dealer",
    region: "",
    city: "",
    value: 0,
    inquiryType: "Walk-in" as "Walk-in" | "Field" | "Campaign / Activity" | "Digital/Web",
    rating: "Warm 🌤️",
    notes: "",
    dealerId: "",
  });
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addLeadMutation.isPending) return;

    addLeadMutation.mutate({
      ...leadForm,
      status: "New",
      assignedDate: new Date().toISOString().split("T")[0],
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setLeadForm({
          customerName: "",
          phone: "",
          email: "",
          product: "",
          source: "Web",
          region: "",
          city: "",
          value: 0,
          inquiryType: "Walk-in",
          rating: "Warm 🌤️",
          notes: "",
          dealerId: "",
        });
      }
    });
  };

  const filteredLeads = leads.filter((lead: Lead) => {
    const status = (lead.status || "New").toLowerCase();
    const source = (lead.source || "Web").toLowerCase();
    const region = (lead.region || "").toLowerCase();

    const matchesStatus = filterStatus === "all" || status === filterStatus;
    const matchesSource = filterSource === "all" || source === filterSource;
    const matchesRegion = filterRegion === "all" || region === filterRegion.toLowerCase();

    const customerName = (lead.customerName || "").toLowerCase();
    const product = (lead.product || "").toLowerCase();
    const searchQueryLower = debouncedSearchQuery.toLowerCase();

    const matchesSearch =
      customerName.includes(searchQueryLower) ||
      product.includes(searchQueryLower);
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

  filteredLeads.forEach((lead: Lead) => {
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
              {/* <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="Punjab">Punjab</SelectItem>
                <SelectItem value="Haryana">Haryana</SelectItem>
                <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
              </SelectContent> */}
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
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
                      Dealer
                    </th>

                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      Region
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      City
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      Value
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      Rating
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      Next Follow-up
                    </th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      Date
                    </th>
                    <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLeadsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                      </tr>
                    ))
                  ) : (
                    filteredLeads.map((lead: Lead) => (
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
                          {lead.dealerId?.companyName || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {lead.region}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {lead.city || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(lead.value)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lead.rating} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(() => {
                            const pendingFollowUps = lead.followUps?.filter((f: any) => f.status === "Pending") || [];
                            if (pendingFollowUps.length === 0) return "—";
                            const next = pendingFollowUps.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                            const nextDate = new Date(next.date);
                            const isOverdue = nextDate < new Date(new Date().setHours(0, 0, 0, 0));
                            return (
                              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                {nextDate.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}
                                {isOverdue && " ⚠️"}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadToDelete(lead);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
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
                  {isLeadsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                          </div>
                          <Skeleton className="h-3 w-16" />
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-12 rounded" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    leads.map((lead: Lead) => (
                      <div key={lead._id} className="relative group">
                        <Link key={lead._id} to={`/leads/${lead._id}`}>
                          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate pr-4">
                                {lead.customerName}
                              </p>
                              <div onClick={(e) => e.preventDefault()}>
                                <button
                                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setLeadToDelete(lead)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs text-gray-600">
                                {lead.product.split(" ")[1]}
                              </p>
                              <StatusBadge status={lead.rating} />
                            </div>
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
                            {lead.dealerId && (
                              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="font-medium">Assigned:</span>
                                <span className="truncate">{lead.dealerId.companyName}</span>
                              </div>
                            )}
                          </Card>
                        </Link>
                      </div>
                    ))
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </>




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
                    {!isDealer && <SelectItem value="Dealer">Dealer</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product Interest *</Label>
                <ProductCombobox
                  multiple={true}
                  onSelect={(selected) => {
                    const productsArr = Array.isArray(selected) ? selected : (selected ? [selected] : []);
                    const names = productsArr.map(p => p.name).join(", ");
                    setLeadForm({ ...leadForm, product: names });
                  }}
                  placeholder="Search products..."
                  className="w-full"
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
                  {/* <SelectContent>
                    <SelectItem value="Punjab">Punjab</SelectItem>
                    <SelectItem value="Haryana">Haryana</SelectItem>
                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                    <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  </SelectContent> */}

                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={leadForm.city}
                  onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inquiryType">Inquiry Type *</Label>
                <Select
                  value={leadForm.inquiryType}
                  onValueChange={(val: any) => setLeadForm({ ...leadForm, inquiryType: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Field">Field</SelectItem>
                    <SelectItem value="Campaign / Activity">Campaign / Activity</SelectItem>
                    <SelectItem value="Digital/Web">Digital/Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating *</Label>
                <Select
                  value={leadForm.rating}
                  onValueChange={(val: string) => setLeadForm({ ...leadForm, rating: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hot 🔥">Hot 🔥</SelectItem>
                    <SelectItem value="Warm 🌤️">Warm 🌤️</SelectItem>
                    <SelectItem value="Cold ❄️">Cold ❄️</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Button type="submit" disabled={addLeadMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {addLeadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              for <span className="font-semibold text-gray-900">{leadToDelete?.customerName}</span> and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLeadMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => leadToDelete && deleteLeadMutation.mutate(leadToDelete._id, {
                onSuccess: () => setLeadToDelete(null)
              })}
              disabled={deleteLeadMutation.isPending}
            >
              {deleteLeadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
