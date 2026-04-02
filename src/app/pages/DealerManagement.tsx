import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search, AlertTriangle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { useAuth } from "../context/AuthContext";

export function DealerManagement() {
  const { user, isAdmin, isDistributor } = useAuth();
  const { dealers, addDealer, isLoading } = useDealers();
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
  });

  const handleAddDealer = () => {
    if (!formData.name) {
      alert("Dealer Name is required.");
      return;
    }
    if (!formData.code) {
      alert("Dealer Code is required.");
      return;
    }
    if (!formData.phone) {
      alert("Phone number is required.");
      return;
    }
    if (!formData.email) {
      alert("Email is required.");
      return;
    }

    const newDealer: any = {
      companyName: formData.name,
      ownerName: formData.name, // Using name as ownerName for now as it's required
      contact: formData.phone,
      email: formData.email,
      address: formData.city || "N/A",
      code: formData.code,
      region: formData.region || "Other",
      creditLimit: (Number(formData.creditLimit) || 0) * 100000,
      performanceScore: 0,
      distributorId: isAdmin ? formData.distributorId : (isDistributor ? user?.id : undefined),
    };

    addDealer(newDealer);
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
    });
    setIsDialogOpen(false);
  };

  const roleFilteredDealers = dealers.filter((dealer: Dealer) => {
    if (isDistributor) {
      return dealer.distributorId === user?.id;
    }
    return true;
  });

  const filteredDealers = useMemo(() => {
    return roleFilteredDealers.filter((dealer: Dealer) => {
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
  }, [roleFilteredDealers, filterStatus, filterRegion, filterDistributor, debouncedSearchQuery]);

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
                  placeholder="Enter dealer name"
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
                  placeholder="Enter city"
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
                  placeholder="Enter dealer code"
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
                  placeholder="+91 98765 00000"
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
                  placeholder="contact@example.com"
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
                <Label htmlFor="creditLimit">Credit Limit (in Lakhs)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  placeholder="e.g. 50 for 50L"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, creditLimit: e.target.value })
                  }
                />
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
              ₹{(totalCreditLimit / 10000000).toFixed(1) || "0.0"}Cr
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Outstanding Amount</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-orange-600 mt-1">
              ₹{(totalOutstanding / 10000000).toFixed(1) || "0.0"}Cr
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
                {isAdmin && (
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

                  // Extract distributor name securely
                  const distId = typeof dealer.distributorId === 'object'
                    ? (dealer.distributorId as any)?._id
                    : dealer.distributorId;
                  const distObj = distributors?.find((d: any) => d._id === distId);
                  const distName = distObj?.name || (dealer as any).distributorId?.name || dealer.distributorName || "-";

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
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {distName}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{(creditLimit / 100000).toFixed(1)}L
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{(outstandingAmount / 100000).toFixed(1)}L
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
