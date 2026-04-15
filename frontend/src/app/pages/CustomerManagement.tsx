import { useState } from "react";
import { useNavigate } from "react-router";
import Pagination from "../components/Pagination";
import { Filter, Search, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { regions } from "../constants/region";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
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
import { useCustomers, useDeleteCustomer } from "../hooks/useCustomers";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";

export interface Customer {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  product: string;
  region: string;
  value: number;
  notes?: string;
  dealerId?: {
    _id: string;
    companyName: string;
    ownerName?: string;
  };
  distributorId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export function CustomerManagement() {
  const navigate = useNavigate();
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { isAdmin, isDistributor, isDealer } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { data, isLoading } = useCustomers(page, limit);
  const customers = data?.customers || [];
  const pagination = data?.pagination;
  const deleteCustomerMutation = useDeleteCustomer();

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((customer: Customer) => {
    const region = (customer.region || "").toLowerCase();
    const matchesRegion = filterRegion === "all" || region === filterRegion.toLowerCase();

    const name = (customer.customerName || "").toLowerCase();
    const phone = (customer.phone || "").toLowerCase();
    const product = (customer.product || "").toLowerCase();
    const searchQueryLower = debouncedSearchQuery.toLowerCase();

    const matchesSearch =
      name.includes(searchQueryLower) ||
      phone.includes(searchQueryLower) ||
      product.includes(searchQueryLower);

    return matchesRegion && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage customers converted from leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Customer Table */}
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
                  Region
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Value
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Belongs To (Dealer)
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Belongs To (Distributor)
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Date Added
                </th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No customers found</p>
                    <p className="text-sm mt-1">Customers are automatically created when orders are placed from leads.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer: Customer) => (
                   <tr
                    key={customer._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/customers/${customer._id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {customer.customerName}
                      </p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                      {customer.email && (
                        <p className="text-xs text-gray-400">{customer.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.product || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.region || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(customer.value)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-gray-700 font-medium">
                          {customer.dealerId?.companyName || "—"}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700 font-medium">
                          {customer.distributorId?.name || "—"}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(customer.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToDelete(customer);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer record
              for <span className="font-semibold text-gray-900">{customerToDelete?.customerName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCustomerMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => customerToDelete && deleteCustomerMutation.mutate(customerToDelete._id, {
                onSuccess: () => setCustomerToDelete(null)
              })}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
