import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search, Loader2 } from "lucide-react";
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
import { useDealers } from "../context/DealerContext";
import { useDistributors } from "../hooks/useDistributors";
import { useWarranty } from "../context/WarrantyContext";
import { useCustomers } from "../hooks/useCustomers";
import { useAuth } from "../context/AuthContext";
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

interface CustomerProduct {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  sku: string;
  machineSerialNumber: string;
  engineNumber: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyMonths: number;
  daysRemaining: number | null;
  isExpired: boolean;
}

export function WarrantyManagement() {
  const { dealers } = useDealers();
  const { user, isSuperAdmin, isDistributor, isDealer } = useAuth();
  const { data: distributors = [] } = useDistributors();
  const { claims, pagination, isLoading, createClaim, fetchClaims } = useWarranty();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filter the dealer list based on the current user's role
  const availableDealers = isDistributor
    ? dealers.filter((d: any) => d.distributorId === user?.id || d.distributorId?._id === user?.id)
    : dealers;

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dealerId: isDealer ? (user?.dealerId || "") : isDistributor ? (user?.id || "") : "",
    buyerType: isDealer ? "Dealer" : isDistributor ? "User" : "Dealer",
    productId: "",
    productSerial: "",
    issueDescription: "",
    customerName: "",
  });

  // Customer autocomplete state
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch, 400);
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers(1, 20, debouncedCustomerSearch || undefined);
  const customers = customersData?.customers || [];
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerInputRef = useRef<HTMLDivElement>(null);

  // Customer products state
  const [customerProducts, setCustomerProducts] = useState<CustomerProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (customerInputRef.current && !customerInputRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch customer products when dealerId changes
  const fetchCustomerProducts = useCallback(async (dealerId: string, buyerType: string) => {
    if (!dealerId) {
      setCustomerProducts([]);
      return;
    }
    try {
      setIsLoadingProducts(true);
      const res = await apiClient.get("/warranty/customer-products", { params: { dealerId, buyerType } });
      setCustomerProducts(res.data || []);
    } catch (error) {
      console.error("Error fetching customer products:", error);
      setCustomerProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (formData.dealerId) {
      fetchCustomerProducts(formData.dealerId, formData.buyerType);
    }
  }, [formData.dealerId, formData.buyerType, fetchCustomerProducts]);

  useEffect(() => {
    fetchClaims(page, limit);
  }, [page, limit, fetchClaims]);

  const handleSelectCustomer = (customer: any) => {
    setFormData({
      ...formData,
      customerName: customer.customerName,
      dealerId: customer.dealerId?._id || customer.dealerId || formData.dealerId,
      buyerType: customer.buyerType || "Dealer", // Assuming customer might belong to distributor eventually
    });
    setCustomerSearch(customer.customerName);
    setShowCustomerDropdown(false);
  };

  const handleSelectProduct = (product: CustomerProduct) => {
    setFormData({
      ...formData,
      productId: product.productId,
      productSerial: product.machineSerialNumber,
    });
  };

  const handleCreateClaim = async () => {
    const effDealerId = formData.dealerId;
    if (!effDealerId || !formData.productId || !formData.productSerial || !formData.issueDescription) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createClaim({
        dealerId: effDealerId,
        buyerType: formData.buyerType,
        productId: formData.productId,
        machineSerialNumber: formData.productSerial,
        issueDescription: formData.issueDescription,
        customerName: formData.customerName,
      });

      setFormData({
        dealerId: isDealer ? (user?.dealerId || "") : isDistributor ? (user?.id || "") : "",
        buyerType: isDealer ? "Dealer" : isDistributor ? "User" : "Dealer",
        productId: "",
        productSerial: "",
        issueDescription: "",
        customerName: "",
      });
      setCustomerSearch("");
      setCustomerProducts([]);
      setIsDialogOpen(false);
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
      claim.productId?.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (claim.customerName || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase());
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

  const selectedProduct = customerProducts.find(p => p.productId === formData.productId);

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
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>File New Warranty Claim</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
              {/* Dealer Selector */}
              {isSuperAdmin ? (
                <div className="grid gap-2">
                  <Label htmlFor="dealer">Filing Claim For</Label>
                  <Select
                    value={formData.dealerId}
                    onValueChange={(value) => {
                      const isDist = distributors.some((dist: any) => dist._id === value);
                      setFormData({ ...formData, dealerId: value, buyerType: isDist ? "User" : "Dealer", productId: "", productSerial: "" })
                    }}
                  >
                    <SelectTrigger id="dealer">
                      <SelectValue placeholder="Choose a buyer (Dealer/Distributor)" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors?.length > 0 && (
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Distributors</div>
                      )}
                      {distributors?.map((dist: any) => (
                        <SelectItem key={dist._id} value={dist._id}>
                          {dist.name} (Distributor)
                        </SelectItem>
                      ))}

                      {dealers?.length > 0 && (
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2 border-t pt-2">Dealers</div>
                      )}
                      {dealers
                        .filter((d: any) => d.status === "Approved")
                        .map((d: any) => (
                          <SelectItem key={d.id || d._id} value={d.id || d._id}>
                            {d.companyName || d.name} ({d.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : isDistributor ? (
                <div className="grid gap-2">
                  <Label>Filing Claim As</Label>
                  <div className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm text-gray-600 items-center">
                    {user?.name || "Your Distribution Network"} (Myself)
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>Filing Claim As</Label>
                  <div className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm text-gray-600 items-center">
                    {user?.name || "Your Dealership"} (Your Account)
                  </div>
                </div>
              )}

              {/* Customer Name (Typeable autocomplete) */}
              <div className="grid gap-2" ref={customerInputRef}>
                <Label htmlFor="customerName">Customer Name</Label>
                <div className="relative">
                  <Input
                    id="customerName"
                    placeholder="Start typing customer name..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setFormData({ ...formData, customerName: e.target.value });
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    autoComplete="off"
                  />
                  {showCustomerDropdown && customerSearch.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {isCustomersLoading ? (
                        <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </div>
                      ) : customers.length > 0 ? (
                        customers.map((c: any) => (
                          <button
                            key={c._id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => handleSelectCustomer(c)}
                          >
                            <p className="font-medium text-gray-900">{c.customerName}</p>
                            <p className="text-xs text-gray-500">{c.phone} • {c.product}</p>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Selector (from customer purchased products) */}
              <div className="grid gap-2">
                <Label htmlFor="product">Product (Purchased by Customer)</Label>
                {isLoadingProducts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading purchased products...
                  </div>
                ) : customerProducts.length > 0 ? (
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => {
                      const prod = customerProducts.find(p => p.productId === value);
                      if (prod) handleSelectProduct(prod);
                    }}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select a purchased product" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerProducts.map((p) => (
                        <SelectItem key={`${p.orderId}-${p.productId}`} value={p.productId}>
                          <div className="flex items-center gap-2">
                            <span>{p.productName}</span>
                            <span className="text-xs text-gray-400">SN: {p.machineSerialNumber}</span>
                            {p.daysRemaining !== null && (
                              <span className={`text-xs font-semibold ${p.isExpired ? "text-red-600" : p.daysRemaining <= 30 ? "text-orange-600" : "text-green-600"}`}>
                                {p.isExpired ? "Expired" : `${p.daysRemaining}d left`}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm text-gray-500 items-center">
                    {formData.dealerId ? "No warranty-registered products found for this dealer" : "Select a dealer first"}
                  </div>
                )}
              </div>

              {/* Auto-filled Serial Number */}
              <div className="grid gap-2">
                <Label htmlFor="productSerial">Machine Serial Number</Label>
                <Input
                  id="productSerial"
                  placeholder="Auto-filled from product selection"
                  value={formData.productSerial}
                  onChange={(e) =>
                    setFormData({ ...formData, productSerial: e.target.value })
                  }
                  className={selectedProduct ? "bg-green-50 border-green-200" : ""}
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500">
                    Engine: {selectedProduct.engineNumber || "N/A"} • Order: {selectedProduct.orderNumber}
                  </p>
                )}
              </div>

              {/* Issue Description */}
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
                placeholder="Search by Claim #, Serial #, Dealer, Product or Customer..."
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
                  Customer
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
                  Distributor
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {claim.customerName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{claim.productId?.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">{claim.productId?.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {claim.machineSerialNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {claim.dealerId?.companyName || claim.dealerId?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {claim.distributorId?.name || "—"}
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
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    No warranty claims found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="px-6 pb-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              totalItems={pagination.total}
              itemsPerPage={limit}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
