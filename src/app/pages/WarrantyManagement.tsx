import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search, Loader2 } from "lucide-react";
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
import { useDealers } from "../context/DealerContext";
import { useWarranty } from "../context/WarrantyContext";
import { useProducts } from "../hooks/useProducts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";

export function WarrantyManagement() {
  const { dealers } = useDealers();
  const { data: productsData } = useProducts();
  const products = productsData?.products || [];
  const { claims, isLoading, createClaim, fetchClaims } = useWarranty();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Form state for new claim
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dealerId: "",
    productId: "",
    productSerial: "",
    issueDescription: "",
  });

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleCreateClaim = async () => {
    if (!formData.dealerId || !formData.productId || !formData.productSerial || !formData.issueDescription) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createClaim({
        dealerId: formData.dealerId,
        productId: formData.productId,
        machineSerialNumber: formData.productSerial,
        issueDescription: formData.issueDescription
      });
      
      setFormData({
        dealerId: "",
        productId: "",
        productSerial: "",
        issueDescription: "",
      });
      setIsDialogOpen(false);
      alert("Warranty claim submitted successfully!");
    } catch (error) {
      console.error("Failed to create claim:", error);
      alert("Failed to create claim. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = filterStatus === "all" || claim.status === filterStatus;
    const matchesSearch =
      claim.claimNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      claim.machineSerialNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      claim.dealerId?.companyName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      claim.productId?.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalClaims = claims.length;
  const openClaims = claims.filter(
    (c) => c.status !== "Closed" && c.status !== "Rejected"
  ).length;
  const approvedClaims = claims.filter((c) => 
    ["Claim Approved", "Parts Processing", "Parts Dispatched", "Repair & Collection", "Closed"].includes(c.status)
  ).length;

  const STAGES = [
    "Complaint Received",
    "Technician Assigned",
    "Initial Inspection",
    "LOVOL Review",
    "HO Review",
    "Claim Approved",
    "Parts Processing",
    "Parts Dispatched",
    "Repair & Collection",
    "Closed",
    "Rejected"
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Warranty Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage warranty claims lifecycle
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>File New Warranty Claim</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
              <div className="grid gap-2">
                <Label htmlFor="dealer">Select Dealer</Label>
                <Select
                  value={formData.dealerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dealerId: value })
                  }
                >
                  <SelectTrigger id="dealer">
                    <SelectValue placeholder="Choose a dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealers.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.companyName || d.name} ({d.code})
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
                    {products.map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productSerial">Machine Serial Number</Label>
                <Input
                  id="productSerial"
                  placeholder="e.g. SN12345678"
                  value={formData.productSerial}
                  onChange={(e) =>
                    setFormData({ ...formData, productSerial: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueDescription">Reason for Claim (Complaint)</Label>
                <textarea
                  id="issueDescription"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the issue reported by the customer..."
                  value={formData.issueDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDescription: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateClaim}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : "Submit Claim"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Claims</p>
          {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-gray-900 mt-1">{totalClaims}</p>}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Open Claims</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {openClaims}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Approved/In-Process</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-green-600 mt-1">
              {approvedClaims}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Resolution Rate</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(0) : "0"}%
            </p>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by Claim #, Serial #, Dealer or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[220px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lifecycle Stages</SelectItem>
              {STAGES.map(stage => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Claims Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Claim Number
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Product Details
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Serial Number
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Dealer
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Current Status
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Progress
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Submitted On
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
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-28 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : filteredClaims.length > 0 ? (
                filteredClaims.map((claim) => (
                <tr key={claim._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-blue-600">
                      {claim.claimNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{claim.productId?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">{claim.productId?.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {claim.machineSerialNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {claim.dealerId?.companyName || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-medium text-blue-600">{claim.stageProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/warranty/${claim._id}`}>
                      <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                        Process Claim
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    No warranty claims found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
