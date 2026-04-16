import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search, AlertTriangle } from "lucide-react";
import Pagination from "../components/Pagination";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Dealer } from "../data/mockData";
import { useDealers } from "../context/DealerContext";
import { regions } from "../constants/region";
import { useDistributors } from "../hooks/useDistributors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import { useDebounce } from "../hooks/useDebounce";
import { Label } from "../components/ui/label";
import { Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { useAuth } from "../context/AuthContext";
import { validateFileSize } from "../utils/file";
import { useRBAC } from "../hooks/useRBAC";

export function DealerManagement() {
  const { user, isAdmin, isDistributor } = useAuth();
  const { checkPermission } = useRBAC();
  
  const canCreate = checkPermission("dealers", "create");
  const canUpdate = checkPermission("dealers", "update");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { dealers, pagination, addDealer, isLoading, refreshDealers } = useDealers();

  useEffect(() => {
    refreshDealers(page, limit);
  }, [page, limit, refreshDealers]);
  const { data: distributors } = useDistributors();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterDistributor, setFilterDistributor] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Form state for new dealer
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    code: "",
    region: "",
    creditLimit: "",
    phone: "",
    email: "",
    joinedDate: new Date().toISOString().split("T")[0],
    distributorId: "",
    companyType: "Proprietorship" as "LLP" | "Pvt Ltd" | "Proprietorship",
  });

  const [kycFiles, setKycFiles] = useState<{ [key: string]: File | null }>({});

  const handleFileChange = (field: string, file: File | null) => {
    if (file && !validateFileSize(file)) {
      // Clear the specific file input
      const input = document.getElementById(`file-${field}`) as HTMLInputElement;
      if (input) input.value = "";
      return;
    }
    setKycFiles(prev => ({ ...prev, [field]: file }));
  };

  // Returns required KYC docs based on company type
  const getRequiredDocs = () => {
    switch (formData.companyType) {
      case "Proprietorship":
        return [
          { label: "PAN Card (Owner)", field: "pan" },
          { label: "Aadhaar Card (Owner)", field: "aadhaar" },
          { label: "GST Certificate (or Shop License if no GST)", field: "gst" },
          { label: "Cancelled Cheque", field: "bankProof" }
        ];
      case "LLP":
        return [
          { label: "PAN Card of LLP", field: "pan" },
          { label: "Certificate of Incorporation", field: "incorporation" },
          { label: "Aadhaar/PAN of Authorized Signatory", field: "signatoryId" },
          { label: "Cancelled Cheque (LLP account)", field: "bankProof" },
          { label: "GST Certificate", field: "gst" }
        ];
      case "Pvt Ltd":
        // Treat Pvt Ltd same as LLP for now (can be customized)
        return [
          { label: "PAN Card of Company", field: "pan" },
          { label: "Certificate of Incorporation", field: "incorporation" },
          { label: "Aadhaar/PAN of Authorized Signatory", field: "signatoryId" },
          { label: "Cancelled Cheque (Company account)", field: "bankProof" },
          { label: "GST Certificate", field: "gst" }
        ];
      // Partnership Firm removed as per requirements
      default:
        return [];
    }
  };

  const handleAddDealer = async () => {
    if (!formData.name || !formData.code || !formData.phone || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validation for KYC documents
    const requiredDocs = getRequiredDocs();
    const missingDocs = requiredDocs.filter(doc => !kycFiles[doc.field]);
    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.map(d => d.label).join(", ")}`);
      return;
    }

    try {
      const data = new FormData();
      data.append("companyName", formData.name);
      data.append("ownerName", formData.name);
      data.append("contact", formData.phone);
      data.append("email", formData.email);
      data.append("address", formData.city || "N/A");
      data.append("code", formData.code);
      data.append("region", formData.region || "Other");
      data.append("creditLimit", String(Number(formData.creditLimit) || 0));
      data.append("companyType", formData.companyType);

      const dId = isAdmin ? formData.distributorId : (isDistributor ? user?.id : "");
      if (dId) data.append("distributorId", dId);

      // Append files
      Object.entries(kycFiles).forEach(([field, file]) => {
        if (file) data.append(field, file);
      });

      await addDealer(data);
      toast.success("Dealer onboarded successfully!");

      setFormData({
        name: "",
        city: "",
        code: "",
        region: "",
        creditLimit: "",
        phone: "",
        email: "",
        joinedDate: new Date().toISOString().split("T")[0],
        distributorId: "",
        companyType: "Proprietorship",
      });
      setKycFiles({});
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Dealer onboarding error:", error);
      if (error.response?.data?.error === "DUPLICATE_EMAIL") {
        toast.error("A dealer or user with this email already exists.");
      } else {
        toast.error(error.response?.data?.message || "Failed to onboard dealer.");
      }
    }
  };

  const filteredDealers = useMemo(() => {
    return dealers.filter((dealer: Dealer) => {
      const status = (dealer.status || "Active").toLowerCase();
      const matchesStatus = filterStatus === "all" || status === filterStatus;
      const matchesRegion = filterRegion === "all" || (dealer.region || "").toLowerCase() === filterRegion.toLowerCase();

      // Add Distributor filter
      const matchesDistributor = filterDistributor === "all" ||
        (typeof dealer.distributorId === 'string' ? dealer.distributorId : (dealer.distributorId as any)?._id) === filterDistributor;

      const name = (dealer.name || "").toLowerCase();
      const code = (dealer.code || "").toLowerCase();
      const search = debouncedSearchQuery.toLowerCase();

      const matchesSearch = name.includes(search) || code.includes(search);
      return matchesStatus && matchesRegion && matchesDistributor && matchesSearch;
    });
  }, [dealers, filterStatus, filterRegion, filterDistributor, debouncedSearchQuery]);

  const totalDealers = dealers.length;
  const activeDealersCount = dealers.filter((d: Dealer) => d.status === "Approved").length;
  const totalCreditLimit = dealers.reduce((sum: number, d: Dealer) => sum + (Number(d.creditLimit) || 0), 0);
  const totalOutstanding = dealers.reduce((sum: number, d: Dealer) => sum + (Number(d.outstandingAmount) || 0), 0);

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
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Dealer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Dealer</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Dealer Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Lovol Punjab Motors"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Ludhiana"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. DL-LDH-001"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) =>
                      setFormData({ ...formData, region: value })
                    }
                  >
                    <SelectTrigger id="region">
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
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. dealer.contact@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="joinedDate">Joined Date</Label>
                  <Input
                    id="joinedDate"
                    type="date"
                    value={formData.joinedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joinedDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    placeholder="e.g. 5000000 (for 50 Lakhs)"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, creditLimit: e.target.value })
                    }
                  />
                  {formData.creditLimit && Number(formData.creditLimit) > 0 && (
                    <p className="text-[10px] text-blue-600 font-medium italic">
                      {(() => {
                        const num = Number(formData.creditLimit);
                        const fmt = new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(num);
                        let suffix = "";
                        if (num >= 10000000) suffix = ` (${(num / 10000000).toFixed(2)} Cr)`;
                        else if (num >= 100000) suffix = ` (${(num / 100000).toFixed(2)} L)`;
                        return `${fmt}${suffix}`;
                      })()}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="grid gap-2">
                    <Label htmlFor="distributorId">Distributor</Label>
                    <Select
                      value={formData.distributorId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, distributorId: value })
                      }
                    >
                      <SelectTrigger id="distributorId">
                        <SelectValue placeholder="Select distributor" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors?.map((dist: any) => (
                          <SelectItem key={dist._id} value={dist._id}>
                            {dist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
  
                <div className="grid gap-2">
                  <Label htmlFor="companyType">Company Type</Label>
                  <Select
                    value={formData.companyType}
                    onValueChange={(value: any) => {
                      setFormData({ ...formData, companyType: value });
                      setKycFiles({}); // Reset files when type changes
                    }}
                  >
                    <SelectTrigger id="companyType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LLP">LLP</SelectItem>
                      <SelectItem value="Pvt Ltd">Pvt Ltd</SelectItem>
                      <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
  
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-semibold text-gray-700">KYC Documents</p>
                  <div className="grid gap-4">
                    {getRequiredDocs().map((doc) => (
                      <div key={doc.field} className="space-y-1.5">
                        <Label className="text-xs text-gray-500">{doc.label} *</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="file"
                              className="hidden"
                              id={`file-${doc.field}`}
                              accept=".pdf,image/*"
                              onChange={(e) => handleFileChange(doc.field, e.target.files?.[0] || null)}
                            />
                            <label
                              htmlFor={`file-${doc.field}`}
                              className={`flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer transition-all ${kycFiles[doc.field] ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                                }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                {kycFiles[doc.field] ? (
                                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                ) : (
                                  <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                                <span className={`text-sm truncate ${kycFiles[doc.field] ? "text-blue-700 font-medium" : "text-gray-500"}`}>
                                  {kycFiles[doc.field]?.name || `Upload ${doc.label}`}
                                </span>
                              </div>
                            </label>
                          </div>
                          {kycFiles[doc.field] && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleFileChange(doc.field, null)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleAddDealer}
                >
                  Add Dealer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Dealers</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalDealers}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Dealers</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-green-600 mt-1">
              {activeDealersCount}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Credit Limit</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{Number(totalCreditLimit || 0).toLocaleString('en-IN')}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Outstanding Amount</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-orange-600 mt-1">
              ₹{Number(totalOutstanding || 0).toLocaleString('en-IN')}
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
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

          {isAdmin && (
            <Select value={filterDistributor} onValueChange={setFilterDistributor}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Distributors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Distributors</SelectItem>
                {distributors?.map((dist: any) => (
                  <SelectItem key={dist._id} value={dist._id}>
                    {dist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
                {(isAdmin || isDistributor) && (
                  <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                    Distributor
                  </th>
                )}
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Credit Limit
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Outstanding
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
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : (
                filteredDealers.map((dealer: Dealer) => {
                  const creditLimit = Number(dealer.creditLimit) || 0;
                  const outstandingAmount = Number(dealer.outstandingAmount) || 0;
                  const creditUtilization = creditLimit > 0 ? (outstandingAmount / creditLimit) * 100 : 0;

                  const distName = dealer.distributorName || "Direct / None";

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
                      {(isAdmin || isDistributor) && (
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {distName}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{Number(creditLimit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{Number(outstandingAmount || 0).toLocaleString('en-IN')}
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
                            {(creditUtilization || 0).toFixed(0)}% utilized
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={dealer.status || "Active"} />
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
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}