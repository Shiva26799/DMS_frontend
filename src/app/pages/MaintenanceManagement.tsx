import { useState, useEffect } from "react";
import { Filter, Search, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockMaintenanceRecords, mockCustomers, mockProducts } from "../data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
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

export function MaintenanceManagement() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Form state for new maintenance
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    productId: "",
    serviceType: "3-Month",
    dueDate: new Date().toISOString().split("T")[0],
  });

  const handleScheduleService = () => {
    // In a real app, this would call an API
    setIsDialogOpen(false);
    setFormData({
      customerId: "",
      productId: "",
      serviceType: "3-Month",
      dueDate: new Date().toISOString().split("T")[0],
    });
  };

  const filteredRecords = mockMaintenanceRecords.filter((record) => {
    const matchesStatus = filterStatus === "all" || record.status.toLowerCase() === filterStatus;
    const matchesType = filterType === "all" || record.serviceType === filterType;
    const matchesSearch =
      record.productSerial.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      record.productName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      record.customerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      record.dealer.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const upcomingCount = mockMaintenanceRecords.filter(
    (r) => r.status === "Upcoming"
  ).length;
  const overdueCount = mockMaintenanceRecords.filter(
    (r) => r.status === "Overdue"
  ).length;
  const completedCount = mockMaintenanceRecords.filter(
    (r) => r.status === "Completed"
  ).length;

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule Maintenance Service</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Select Customer</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customerId: value })
                  }
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product">Select Product</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productId: value })
                  }
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, serviceType: value })
                  }
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-Month">3-Month Service</SelectItem>
                    <SelectItem value="6-Month">6-Month Service</SelectItem>
                    <SelectItem value="500-Hour">500-Hour Service</SelectItem>
                    <SelectItem value="1000-Hour">1000-Hour Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleScheduleService}
              >
                Schedule Service
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
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {mockMaintenanceRecords.length}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Upcoming</p>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-5 h-5 text-blue-500" />
            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Overdue</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-600">{overdueCount}</p>}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle className="w-5 h-5 text-green-500" />
            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-600">{completedCount}</p>}
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
                placeholder="Search maintenance records..."
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="3-Month">3-Month Service</SelectItem>
              <SelectItem value="6-Month">6-Month Service</SelectItem>
              <SelectItem value="500-Hour">500-Hour Service</SelectItem>
              <SelectItem value="1000-Hour">1000-Hour Service</SelectItem>
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
                  Customer
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
                  Last Service
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
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 border font-mono" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : (
                filteredRecords.map((record) => {
                const dueDate = new Date(record.dueDate);
                const today = new Date();
                const daysUntilDue = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {record.productSerial}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {record.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.dealer}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {record.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {record.dueDate}
                        </p>
                        {record.status === "Upcoming" && daysUntilDue <= 7 && (
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.lastServiceDate || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4">
                      {record.status === "Completed" ? (
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      ) : (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Complete Service
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </Card>

      {/* Upcoming Services Alert */}
      {upcomingCount > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Services
                </h3>
                <p className="text-sm text-gray-600">
                  {upcomingCount} services need attention
                </p>
              </div>
            </div>
            <Button variant="outline">Send Reminders</Button>
          </div>
          <div className="space-y-3">
            {mockMaintenanceRecords
              .filter((r) => r.status === "Upcoming")
              .map((record) => {
                const dueDate = new Date(record.dueDate);
                const today = new Date();
                const daysUntilDue = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.productName} - {record.serviceType}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Dealer: {record.dealer} • Serial: {record.productSerial}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {record.dueDate}
                      </p>
                      <p
                        className={`text-xs ${
                          daysUntilDue <= 7
                            ? "text-orange-600"
                            : "text-gray-600"
                        }`}
                      >
                        {daysUntilDue > 0
                          ? `Due in ${daysUntilDue} days`
                          : "Due today"}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}
