import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockWarrantyClaims, mockCustomers } from "../data/mockData";
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
import { mockProducts } from "../data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

export function WarrantyManagement() {
  const { dealers } = useDealers();
  const { claims, addClaim } = useWarranty();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Form state for new claim
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    productId: "",
    productSerial: "",
    issueDescription: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const handleCreateClaim = () => {
    const selectedCustomer = mockCustomers.find((c) => c.id === formData.customerId);
    const selectedProduct = mockProducts.find((p) => p.id === formData.productId);

    if (!selectedCustomer || !selectedProduct) return;

    const newClaim: any = {
      id: `WC${Date.now()}`,
      claimNumber: `WC-2026-${(claims.length + 1).toString().padStart(3, "0")}`,
      productSerial: formData.productSerial,
      productName: selectedProduct.name,
      dealer: selectedCustomer.name,
      purchaseDate: formData.purchaseDate,
      issueDescription: formData.issueDescription,
      status: "Submitted" as const,
      submittedDate: new Date().toISOString().split("T")[0],
      warrantyValid: true,
    };

    addClaim(newClaim);
    setFormData({
      customerId: "",
      productId: "",
      productSerial: "",
      issueDescription: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
    setIsDialogOpen(false);
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = filterStatus === "all" || claim.status.toLowerCase().replace(/ /g, "-") === filterStatus;
    const matchesSearch =
      claim.claimNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      claim.productName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      claim.dealer.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalClaims = claims.length;
  const openClaims = claims.filter(
    (c) => c.status !== "Closed" && c.status !== "Rejected"
  ).length;
  const approvedClaims = claims.filter((c) => c.status === "Approved" || c.status === "Dispatch").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Warranty Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage warranty claims
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
                <Label htmlFor="productSerial">Serial Number</Label>
                <Input
                  id="productSerial"
                  placeholder="e.g. HP2000-2025-1234"
                  value={formData.productSerial}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setFormData({ ...formData, productSerial: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueDescription">Issue Description</Label>
                <Textarea
                  id="issueDescription"
                  placeholder="Describe the problem in detail..."
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
              >
                Submit Claim
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
          <p className="text-sm text-gray-600">Approved</p>
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
              {((approvedClaims / totalClaims) * 100).toFixed(0)}%
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
                placeholder="Search claims..."
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
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="dispatch">Dispatch</SelectItem>
              <SelectItem value="installed">Installed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
                  Product
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Serial Number
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Dealer
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Issue
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Warranty Valid
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Date
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
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : (
                filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-blue-600">
                      {claim.claimNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {claim.productName}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {claim.productSerial}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {claim.dealer}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                      {claim.issueDescription}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-6 py-4">
                    {claim.warrantyValid ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                        Expired
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {claim.submittedDate}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/warranty/${claim.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
