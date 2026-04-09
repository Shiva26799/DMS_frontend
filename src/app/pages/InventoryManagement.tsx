import { useWarehouses } from "../hooks/useProducts";
import { useOwnInventory, useWarehouseInventory, useSubordinateInventory, useUpdateInventoryStock } from "../hooks/useInventory";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import * as XLSX from "xlsx";
import {
  Filter, Search, Download, AlertTriangle, Edit, Package2,
  Loader2, ChevronLeft, ChevronRight, Building2, Store, Plus, Minus, Settings2
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";

function UpdateStockDialog({
  isOpen,
  onClose,
  selectedItem,
}: {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  selectedItem: any;
}) {
  const [updateForm, setUpdateForm] = useState<{
    quantity: string | number;
    type: "add" | "subtract" | "set";
  }>({
    quantity: 0,
    type: "add",
  });

  const updateMutation = useUpdateInventoryStock();

  useEffect(() => {
    if (isOpen && selectedItem) {
      setUpdateForm({
        quantity: 0,
        type: "add",
      });
    }
  }, [isOpen, selectedItem]);

  const handleUpdateStock = async () => {
    if (!selectedItem) return;

    updateMutation.mutate({
      productId: selectedItem.productId._id,
      ownerType: selectedItem.ownerType,
      ownerId: selectedItem.ownerId._id || selectedItem.ownerId,
      quantity: Number(updateForm.quantity),
      type: updateForm.type,
    }, {
      onSuccess: () => {
        onClose(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Adjust Inventory</DialogTitle>
          <DialogDescription>
            Update stock level for {selectedItem?.productId?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            {(["add", "subtract", "set"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setUpdateForm({ ...updateForm, type: t })}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${updateForm.type === t
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              {updateForm.type === "set" ? "New Total Count" : "Adjustment Amount"}
            </Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                value={updateForm.quantity}
                onChange={(e) => setUpdateForm({ ...updateForm, quantity: e.target.value })}
                className="text-lg font-semibold h-12"
                min="0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {updateForm.type === "add" ? <Plus className="w-5 h-5" /> :
                  updateForm.type === "subtract" ? <Minus className="w-5 h-5" /> :
                    <Settings2 className="w-5 h-5" />}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center text-sm">
            <span className="text-blue-700 font-medium">Current Stock:</span>
            <span className="text-blue-900 font-bold text-lg">{selectedItem?.quantity || 0}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateStock}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirm Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryManagement() {
  const { role, isDistributor, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "warehouse-stock" : "my-stock");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: ownInvRes, isLoading: isOwnLoading } = useOwnInventory(currentPage, itemsPerPage);
  const { data: warehouseInvRes, isLoading: isWarehouseLoading } = useWarehouseInventory(currentPage, itemsPerPage);
  const { data: subInvRes, isLoading: isSubLoading } = useSubordinateInventory(currentPage, itemsPerPage);

  const isLoading = isOwnLoading || isWarehouseLoading || isSubLoading;

  const currentInventoryData = useMemo(() => {
    if (activeTab === "my-stock") return ownInvRes;
    if (activeTab === "warehouse-stock") return warehouseInvRes;
    if (activeTab === "dealer-stock") return subInvRes;
    return null;
  }, [activeTab, ownInvRes, warehouseInvRes, subInvRes]);

  const currentInventory = useMemo(() => currentInventoryData?.data || [], [currentInventoryData]);
  const pagination = useMemo(() => currentInventoryData?.pagination, [currentInventoryData]);

  const getStatus = useCallback((qty: number, reorderLevel: number = 5) => {
    if (qty === 0) return "Out of Stock";
    if (qty <= reorderLevel) return "Critical";
    return "Normal";
  }, []);

  const filteredInventory = useMemo(() => {
    return currentInventory.filter((item: any) => {
      const product = item.productId || {};
      const matchSearch = product.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.partNumber?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchCategory = filterCategory === "all" || product.category === filterCategory;

      const status = getStatus(item.quantity, product.reorderLevel);
      const matchStatus = filterStatus === "all" || status.toLowerCase() === filterStatus.toLowerCase();

      return matchSearch && matchCategory && matchStatus;
    });
  }, [currentInventory, debouncedSearchQuery, filterCategory, filterStatus, getStatus]);

  // Use backend pagination directly
  const paginatedInventory = filteredInventory;

  const totalPages = pagination?.totalPages || 1;

  const stats = useMemo(() => {
    if (!currentInventoryData?.stats) {
      return { total: 0, value: 0, lowStock: 0 };
    }
    const { totalItems, totalValue, lowStockCount } = currentInventoryData.stats;
    return {
      total: totalItems,
      value: totalValue,
      lowStock: lowStockCount
    };
  }, [currentInventoryData]);

  const handleOpenUpdateDialog = (item: any) => {
    setSelectedItem(item);
    setIsUpdateDialogOpen(true);
  };

  const handleExportReport = () => {
    try {
      if (filteredInventory.length === 0) {
        toast.error("No items to export");
        return;
      }

      const reportData = filteredInventory.map((item: any) => ({
        "Part Number / SKU": item.productId?.partNumber || item.productId?.sku || "-",
        "Product Name": item.productId?.name,
        "Category": item.productId?.category,
        "Location": item.ownerId?.name || item.ownerId?.companyName || "My Shop",
        "Stock Available": item.quantity,
        "Status": getStatus(item.quantity, item.productId?.reorderLevel)
      }));

      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
      XLSX.writeFile(workbook, `Inventory_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            {role === "Dealer" ? "Manage your shop stock and view assigned warehouses" :
              role === "Distributor" ? "Manage your inventory and monitor dealer stock levels" :
                "Enterprise-wide inventory and warehouse oversight"}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportReport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-full">
        <TabsList className="bg-white border p-1 h-auto gap-1">
          {!isSuperAdmin && (
            <TabsTrigger value="my-stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-4 py-2">
              <Package2 className="w-4 h-4 mr-2" />
              My Inventory
            </TabsTrigger>
          )}
          <TabsTrigger value="warehouse-stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-4 py-2">
            <Building2 className="w-4 h-4 mr-2" />
            Warehouse Stock
          </TabsTrigger>
          {(isDistributor || isSuperAdmin) && (
            <TabsTrigger value="dealer-stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-4 py-2">
              <Store className="w-4 h-4 mr-2" />
              Dealer Inventory
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Items in View</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Asset Value</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{stats.value.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Low Stock Alerts</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, SKU or Part No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Harvester">Harvesters</SelectItem>
              <SelectItem value="Spare Part">Spare Parts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="critical">Low Stock</SelectItem>
              <SelectItem value="out of stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">Part No / SKU</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">Product Name</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">Category</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  {activeTab === "dealer-stock" ? "Dealer" : "Warehouse/Owner"}
                </th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3">Available</th>
                <th className="text-center text-xs font-medium text-gray-600 uppercase px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No inventory found</td></tr>
              ) : (
                paginatedInventory.map((item: any) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{item.productId?.partNumber || item.productId?.sku || "-"}</td>
                    <td className="px-6 py-4 text-sm">{item.productId?.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${item.productId?.category === "Harvester" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`}>
                        {item.productId?.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.ownerType === "Warehouse" ? item.ownerId?.name : (item.ownerId?.companyName || "My Shop")}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{item.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={getStatus(item.quantity, item.productId?.reorderLevel)} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(activeTab === "my-stock" || isSuperAdmin) && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenUpdateDialog(item)}>
                          <Edit className="w-3.5 h-3.5 mr-1" /> Update
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      <UpdateStockDialog
        isOpen={isUpdateDialogOpen}
        onClose={setIsUpdateDialogOpen}
        selectedItem={selectedItem}
      />
    </div>
  );
}
