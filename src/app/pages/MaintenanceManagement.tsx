import { useState, useEffect, useCallback } from "react";
import { Filter, Search, Calendar, AlertTriangle, CheckCircle, Loader2, Eye, Wrench, X } from "lucide-react";
import Pagination from "../components/Pagination";
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
import { Skeleton } from "../components/ui/skeleton";
import { useDebounce } from "../hooks/useDebounce";
import { apiClient } from "../api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";

interface MaintenanceRecord {
  _id: string;
  orderId?: any;
  productId?: any;
  dealerId?: any;
  dealerName: string;
  productSerial: string;
  productName: string;
  serviceType: string;
  dueDate: string;
  status: "Upcoming" | "Overdue" | "Completed";
  completedDate?: string;
  technicianNotes?: string;
  serviceHistory?: Array<{
    serviceType: string;
    completedDate: string;
    technicianNotes: string;
    performedBy: string;
  }>;
  createdAt: string;
}

interface MaintenanceStats {
  total: number;
  upcoming: number;
  overdue: number;
  completed: number;
}

export function MaintenanceManagement() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({ total: 0, upcoming: 0, overdue: 0, completed: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Schedule Service dialog
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    productSerial: "",
    productName: "",
    dealerName: "",
    serviceType: "500h" as string,
    dueDate: "",
  });

  // Complete Service dialog
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  // View Details dialog
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<MaintenanceRecord | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit };
      if (filterStatus !== "all") params.status = filterStatus;
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;

      const res = await apiClient.get("/maintenance", { params });
      setRecords(res.data.records || []);
      setStats(res.data.stats || { total: 0, upcoming: 0, overdue: 0, completed: 0 });
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filterStatus, debouncedSearchQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleScheduleService = async () => {
    if (!scheduleForm.productSerial || !scheduleForm.productName || !scheduleForm.dueDate) {
      alert("Please fill in Product Serial, Product Name, and Due Date.");
      return;
    }
    try {
      setIsSubmitting(true);
      await apiClient.post("/maintenance/schedule", scheduleForm);
      setScheduleForm({ productSerial: "", productName: "", dealerName: "", serviceType: "500h", dueDate: "" });
      setIsScheduleOpen(false);
      fetchRecords();
    } catch (error: any) {
      console.error("Error scheduling service:", error);
      alert(error.response?.data?.message || "Failed to schedule service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteService = async () => {
    if (!selectedRecord) return;
    try {
      setIsCompleting(true);
      await apiClient.patch(`/maintenance/${selectedRecord._id}/complete`, { technicianNotes });
      setTechnicianNotes("");
      setSelectedRecord(null);
      setIsCompleteOpen(false);
      fetchRecords();
    } catch (error: any) {
      console.error("Error completing service:", error);
      alert(error.response?.data?.message || "Failed to complete service.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleViewDetails = async (record: MaintenanceRecord) => {
    try {
      setIsLoadingDetails(true);
      setIsDetailsOpen(true);
      const res = await apiClient.get(`/maintenance/${record._id}`);
      setDetailRecord(res.data);
    } catch (error) {
      console.error("Error fetching details:", error);
      setDetailRecord(record);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maintenance Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Preventive maintenance tracking and scheduling
          </p>
        </div>
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule Maintenance Service</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="productSerial">Machine Serial Number *</Label>
                <Input
                  id="productSerial"
                  placeholder="e.g. HP2000-2025-1234"
                  value={scheduleForm.productSerial}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, productSerial: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g. LOVOL HP-2000 Harvester"
                  value={scheduleForm.productName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, productName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dealerName">Dealer Name</Label>
                <Input
                  id="dealerName"
                  placeholder="e.g. Punjab Agro Solutions"
                  value={scheduleForm.dealerName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dealerName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Service Type *</Label>
                <Select
                  value={scheduleForm.serviceType}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, serviceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500h">500-Hour Service</SelectItem>
                    <SelectItem value="1000h">1000-Hour Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={scheduleForm.dueDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleScheduleService}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : "Schedule Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Services</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Upcoming</p>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-5 h-5 text-blue-500" />
            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Overdue</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle className="w-5 h-5 text-green-500" />
            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-600">{stats.completed}</p>}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by serial number, product, or dealer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Maintenance Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Serial Number
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Product
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Dealer
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Service Type
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Due Date
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
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : records.length > 0 ? (
                records.map((record) => {
                  const dueDate = new Date(record.dueDate);
                  const today = new Date();
                  const daysUntilDue = Math.ceil(
                    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const serviceLabel = record.serviceType === "500h" ? "500-Hour" : record.serviceType === "1000h" ? "1000-Hour" : record.serviceType;

                  return (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {record.productSerial}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.dealerId?.companyName || record.dealerName || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {serviceLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(record.dueDate).toLocaleDateString()}
                          </p>
                          {record.status === "Upcoming" && daysUntilDue <= 7 && daysUntilDue > 0 && (
                            <p className="text-xs text-orange-600">
                              Due in {daysUntilDue} days
                            </p>
                          )}
                          {record.status === "Overdue" && (
                            <p className="text-xs text-red-600">
                              Overdue by {Math.abs(daysUntilDue)} days
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {record.status === "Completed" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(record)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          ) : (
                            <>
                              {(!user || user.role !== "Distributor" || (record.dealerId?._id || record.dealerId || record.dealerName) === user?.id || !record.dealerId) && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setTechnicianNotes("");
                                    setIsCompleteOpen(true);
                                  }}
                                >
                                  <Wrench className="w-3 h-3 mr-1" />
                                  Complete
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(record)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    No maintenance records found. Services will appear here when orders with maintenance-required products are completed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
            totalItems={pagination.total}
            itemsPerPage={limit}
          />
        </div>
      </Card>

      {/* Upcoming Services Alert */}
      {stats.overdue > 0 && !isLoading && (
        <Card className="p-6 border-red-200 bg-red-50/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Overdue Services
              </h3>
              <p className="text-sm text-gray-600">
                {stats.overdue} service(s) are overdue and need immediate attention.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Complete Service Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Maintenance Service</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Machine</span>
                  <span className="text-sm font-medium">{selectedRecord.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Serial</span>
                  <span className="text-sm font-mono">{selectedRecord.productSerial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Service Type</span>
                  <span className="text-sm font-medium">
                    {selectedRecord.serviceType === "500h" ? "500-Hour" : "1000-Hour"} Service
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Dealer</span>
                  <span className="text-sm">{selectedRecord.dealerId?.companyName || selectedRecord.dealerName || "N/A"}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="techNotes">Technician Notes (Optional)</Label>
                <textarea
                  id="techNotes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Service observations, parts replaced, condition notes..."
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                />
              </div>
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                ℹ️ Completing this service will automatically schedule the next maintenance service for this machine.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteOpen(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCompleteService}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : "Mark as Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maintenance Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : detailRecord ? (
            <div className="space-y-6 py-4">
              {/* Machine Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Machine Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Product</span>
                    <span className="text-sm font-medium">{detailRecord.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Serial Number</span>
                    <span className="text-sm font-mono">{detailRecord.productSerial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Category</span>
                    <span className="text-sm">{detailRecord.productId?.category || "N/A"}</span>
                  </div>
                  {detailRecord.orderId?.orderNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Order</span>
                      <span className="text-sm text-blue-600">{detailRecord.orderId.orderNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dealer Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Dealer Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Dealer</span>
                    <span className="text-sm font-medium">
                      {detailRecord.dealerId?.companyName || detailRecord.dealerName || "N/A"}
                    </span>
                  </div>
                  {detailRecord.dealerId?.ownerName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Contact Person</span>
                      <span className="text-sm">{detailRecord.dealerId.ownerName}</span>
                    </div>
                  )}
                  {detailRecord.dealerId?.code && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Dealer Code</span>
                      <span className="text-sm font-mono">{detailRecord.dealerId.code}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Service Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Service Type</span>
                    <span className="text-sm font-medium">
                      {detailRecord.serviceType === "500h" ? "500-Hour" : detailRecord.serviceType === "1000h" ? "1000-Hour" : detailRecord.serviceType} Service
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Due Date</span>
                    <span className="text-sm">{new Date(detailRecord.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <StatusBadge status={detailRecord.status} />
                  </div>
                  {detailRecord.completedDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Completed On</span>
                      <span className="text-sm">{new Date(detailRecord.completedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {detailRecord.technicianNotes && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-500">Technician Notes</span>
                      <p className="text-sm mt-1">{detailRecord.technicianNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service History */}
              {detailRecord.serviceHistory && detailRecord.serviceHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Service History ({detailRecord.serviceHistory.length})
                  </h4>
                  <div className="space-y-2">
                    {detailRecord.serviceHistory.map((entry, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-400">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {entry.serviceType === "500h" ? "500-Hour" : "1000-Hour"} Service
                          </span>
                          <span className="text-xs text-gray-500">
                            {entry.completedDate ? new Date(entry.completedDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        {entry.performedBy && (
                          <p className="text-xs text-gray-500 mt-1">By: {entry.performedBy}</p>
                        )}
                        {entry.technicianNotes && (
                          <p className="text-xs text-gray-600 mt-1">{entry.technicianNotes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
