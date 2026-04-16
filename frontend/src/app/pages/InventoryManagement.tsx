import { useProducts, useWarehouses } from "../hooks/useProducts";
import { useOwnInventory, useWarehouseInventory, useSubordinateDealerInventory, useUpdateInventoryStock, useBulkUpdateInventory, useVisibleWarehouses } from "../hooks/useInventory";
import { useDealers } from "../hooks/useDealers";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useRBAC } from "../hooks/useRBAC";
import * as XLSX from "xlsx";
import Pagination from "../components/Pagination";
import {
  Filter, Search, Download, AlertTriangle, Edit, Package2,
  Loader2, Building2, Store, Plus, Minus, Settings2, Trash2, X
} from "lucide-react";
import { ProductCombobox } from "../components/ProductCombobox";
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
    binLocation?: string;
    minStockLevel?: number;
  }>({
    quantity: 0,
    type: "add",
    binLocation: "",
    minStockLevel: 0,
  });

  const updateMutation = useUpdateInventoryStock();

  useEffect(() => {
    if (isOpen && selectedItem) {
      setUpdateForm({
        quantity: 0,
        type: "add",
        binLocation: selectedItem.binLocation || "",
        minStockLevel: selectedItem.minStockLevel || 0,
      });
    }
  }, [isOpen, selectedItem]);

  const handleUpdateStock = async () => {
    if (!selectedItem) return;

    updateMutation.mutate({
      productId: selectedItem.productId._id,
      ownerType: selectedItem.ownerType,
      ownerId: selectedItem.ownerId?._id || selectedItem.ownerId,
      quantity: Number(updateForm.quantity),
      type: updateForm.type,
      binLocation: updateForm.binLocation,
      minStockLevel: Number(updateForm.minStockLevel),
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binLocation">Bin Location</Label>
              <Input
                id="binLocation"
                value={updateForm.binLocation}
                onChange={(e) => setUpdateForm({ ...updateForm, binLocation: e.target.value })}
                placeholder="e.g., A-102"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Min. Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                value={updateForm.minStockLevel}
                onChange={(e) => setUpdateForm({ ...updateForm, minStockLevel: Number(e.target.value) })}
                min="0"
              />
            </div>
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
  const { user, role, isDistributor, isDealer, isSuperAdmin, isWarehouseAdmin } = useAuth();
  const { checkPermission } = useRBAC();
  const canManageStock = checkPermission("inventory", "manage");
  
  const { data: visibleWarehouses = [] } = useVisibleWarehouses();
  const updateMutation = useUpdateInventoryStock();
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "warehouse-stock" : "my-stock");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterNetworkType, setFilterNetworkType] = useState<string>("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");
  const [selectedDealerId, setSelectedDealerId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: ownInvRes, isLoading: isOwnLoading } = useOwnInventory({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchQuery,
    category: filterCategory,
    status: filterStatus,
    enabled: activeTab === "my-stock" || (isWarehouseAdmin && activeTab === "my-stock")
  });
  const { data: warehouseInvRes, isLoading: isWarehouseLoading } = useWarehouseInventory({
    page: currentPage,
    limit: itemsPerPage,
    warehouseId: selectedWarehouseId === "all" ? undefined : selectedWarehouseId,
    search: debouncedSearchQuery,
    category: filterCategory,
    status: filterStatus,
    enabled: activeTab === "warehouse-stock"
  });
  const { data: subInvRes, isLoading: isSubLoading } = useSubordinateDealerInventory({
    page: currentPage,
    limit: itemsPerPage,
    ownerType: filterNetworkType,
    dealerId: selectedDealerId === "all" ? undefined : selectedDealerId,
    search: debouncedSearchQuery,
    category: filterCategory,
    status: filterStatus,
    enabled: activeTab === "dealer-stock"
  });

  const isLoading = isOwnLoading || isWarehouseLoading || isSubLoading;

  const currentInventoryData = useMemo(() => {
    if (activeTab === "my-stock") return ownInvRes;
    if (activeTab === "warehouse-stock") return warehouseInvRes;
    if (activeTab === "dealer-stock") return subInvRes;
    return null;
  }, [activeTab, ownInvRes, warehouseInvRes, subInvRes]);

  const currentInventory = useMemo(() => {
    if (Array.isArray(currentInventoryData)) return currentInventoryData;
    return currentInventoryData?.data || [];
  }, [currentInventoryData]);

  const pagination = useMemo(() => {
    if (Array.isArray(currentInventoryData)) return null;
    return currentInventoryData?.pagination;
  }, [currentInventoryData]);

  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;

  const getStatus = useCallback((qty: number, reorderLevel: number = 5) => {
    if (qty === 0) return "Out of Stock";
    if (qty <= reorderLevel) return "Critical";
    return "Normal";
  }, []);

  const filteredInventory = currentInventory;

  const stats = useMemo(() => {
    if (Array.isArray(currentInventoryData)) {
      const totalItems = currentInventoryData.length;
      const totalValue = currentInventoryData.reduce((acc: number, item: any) =>
        acc + ((item.quantity || 0) * (item.productId?.price || 0)), 0);
      const lowStockCount = currentInventoryData.filter((item: any) =>
        (item.quantity || 0) <= (item.productId?.reorderLevel || 5)).length;

      return { total: totalItems, value: totalValue, lowStock: lowStockCount };
    }

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

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: productsRes } = useProducts({ limit: 100 });
  const products = productsRes?.products || [];
  const { data: warehousesRes } = useWarehouses();
  const warehouses = warehousesRes || [];
  const { data: dealersRes } = useDealers();
  const dealers = dealersRes || [];

  const handleAddProduct = () => {
    setIsAddDialogOpen(true);
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
        <div className="flex gap-2">
          {canManageStock && (
            <>
              {((isDealer || isDistributor || isWarehouseAdmin) && activeTab === "my-stock") || (isSuperAdmin && activeTab === "warehouse-stock") ? (
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isDealer || isDistributor ? "Bulk Add to My Inventory" : "Bulk Add"}
                </Button>
              ) : null}
              {((isDealer || isDistributor || isWarehouseAdmin) && activeTab === "my-stock") || (isSuperAdmin && activeTab === "warehouse-stock") ? (
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isDealer || isDistributor
                    ? "Add Product to My Inventory"
                    : `Add Product to ${activeTab === "my-stock" ? "My Inventory" : "Warehouse"}`
                  }
                </Button>
              ) : null}
            </>
          )}
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-full">
        <TabsList className="bg-white border p-1 h-auto gap-1">
          {!isSuperAdmin && (
            <TabsTrigger value="my-stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-4 py-2">
              <Package2 className="w-4 h-4 mr-2" />
              My Inventory
            </TabsTrigger>
          )}
          {(isSuperAdmin || isDistributor || role === "Dealer") && (
            <TabsTrigger value="warehouse-stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-4 py-2">
              <Building2 className="w-4 h-4 mr-2" />
              Warehouse Stock
            </TabsTrigger>
          )}
          {(isDistributor || isSuperAdmin) && (
            <TabsTrigger value="dealer-stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-4 py-2">
              <Store className="w-4 h-4 mr-2" />
              {isSuperAdmin ? "Network Inventory" : "Dealer Inventory"}
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

          {isSuperAdmin && activeTab === "dealer-stock" && (
            <Select value={filterNetworkType} onValueChange={setFilterNetworkType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Network Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Dealers & Dist.)</SelectItem>
                <SelectItem value="Dealer">Dealers Only</SelectItem>
                <SelectItem value="Distributor">Distributors Only</SelectItem>
              </SelectContent>
            </Select>
          )}

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

          {activeTab === "warehouse-stock" && (
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {visibleWarehouses.map((w: any) => (
                  <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeTab === "dealer-stock" && (
            <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Dealers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dealers / Dist.</SelectItem>
                {dealers.map((d: any) => (
                  <SelectItem key={d._id} value={d._id}>{d.companyName || d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
                  {activeTab === "dealer-stock" ? (isSuperAdmin ? "Partner" : "Dealer") : "Warehouse/Owner"}
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap">Shelf Location</th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3">Available</th>
                <th className="text-center text-xs font-medium text-gray-600 uppercase px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="p-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No products found in inventory.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item: any) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{item.productId?.partNumber || item.productId?.sku || "-"}</td>
                    <td className="px-6 py-4 text-sm">{item.productId?.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${item.productId?.category === "Harvester" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`}>
                        {item.productId?.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span>{item.ownerType === "Warehouse" ? (item.ownerId?.name || "My Warehouse") : (item.ownerId?.companyName || item.ownerId?.name || "My Shop")}</span>
                        {isSuperAdmin && activeTab === "dealer-stock" && (
                          <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
                            {item.ownerType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-blue-600">
                      {item.binLocation || "Not set"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{item.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={getStatus(item.quantity, item.productId?.reorderLevel)} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManageStock && (isSuperAdmin || isWarehouseAdmin || activeTab === "my-stock") && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenUpdateDialog(item)}>
                            <Edit className="w-3.5 h-3.5 mr-1" /> Update
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Remove this product completely from your inventory record?")) {
                                updateMutation.mutate({
                                  productId: item.productId._id,
                                  ownerType: item.ownerType,
                                  ownerId: item.ownerId._id || item.ownerId,
                                  quantity: 0,
                                  type: "delete"
                                });
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="px-6 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={stats.total}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </Card>

      <UpdateStockDialog
        isOpen={isUpdateDialogOpen}
        onClose={setIsUpdateDialogOpen}
        selectedItem={selectedItem}
      />

      <AddProductToInventoryDialog
        isOpen={isAddDialogOpen}
        onClose={setIsAddDialogOpen}
        defaultOwnerType={activeTab === "my-stock" ? (isDealer ? "Dealer" : isDistributor ? "Distributor" : "Warehouse") : "Warehouse"}
        defaultOwnerId={activeTab === "my-stock" ? (isDealer ? (user?.dealerId?._id || user?.dealerId || user?.id) : isWarehouseAdmin ? (user?.managedWarehouseId?._id || user?.managedWarehouseId) : user?.id) : (user?.managedWarehouseId?._id || user?.managedWarehouseId)}
        products={products}
      />

      <BulkInventoryImportDialog
        isOpen={isBulkModalOpen}
        onClose={setIsBulkModalOpen}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        defaultOwnerType={activeTab === "my-stock" ? (isDealer ? "Dealer" : isDistributor ? "Distributor" : "Warehouse") : "Warehouse"}
        defaultOwnerId={activeTab === "my-stock" ? (isDealer ? (user?.dealerId?._id || user?.dealerId || user?.id) : isWarehouseAdmin ? (user?.managedWarehouseId?._id || user?.managedWarehouseId) : user?.id) : (user?.managedWarehouseId?._id || user?.managedWarehouseId)}
      />
    </div>
  );
}

function BulkInventoryImportDialog({
  isOpen,
  onClose,
  selectedFile,
  setSelectedFile,
  defaultOwnerType,
  defaultOwnerId,
}: {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  defaultOwnerType?: string;
  defaultOwnerId?: string;
}) {
  const { role, user } = useAuth();
  const isDealerOrDistributor = role === "Dealer" || role === "Distributor";
  const isWarehouseAdmin = role === "Warehouse Admin";
  const hideWarehouseSelect = isDealerOrDistributor || isWarehouseAdmin;
  const { data: warehousesRes } = useVisibleWarehouses();
  const warehouses = warehousesRes || [];
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>("");

  useEffect(() => {
    if (isDealerOrDistributor) {
      setTargetWarehouseId("own-inventory");
    } else if (isWarehouseAdmin && user?.managedWarehouseId) {
      setTargetWarehouseId(user.managedWarehouseId);
    } else if (defaultOwnerId) {
      setTargetWarehouseId(defaultOwnerId);
    } else {
      setTargetWarehouseId("");
    }
  }, [isDealerOrDistributor, isWarehouseAdmin, user?.managedWarehouseId, defaultOwnerId, isOpen]);

  const bulkUpdateMutation = useBulkUpdateInventory();
  const actionLoading = bulkUpdateMutation.isPending;

  const handleBulkImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to array of arrays (rows)
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 1) {
            toast.error("The Excel file seems to be empty");
            return;
          }

          const importedItems: any[] = [];

          // Header detection
          let skuIdx = -1, qtyIdx = -1, locIdx = -1;
          let headerRowIdx = -1;

          for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
            const row = jsonData[i].map(c => String(c || "").toLowerCase().trim());
            const sIdx = row.findIndex(c => c.includes("sku") || c.includes("part no") || c.includes("identifier"));
            const qIdx = row.findIndex(c => c.includes("qty") || c.includes("quantity") || c.includes("stock") || c.includes("count") || c.includes("status"));
            const lIdx = row.findIndex(c => c.includes("loc") || c.includes("bin") || c.includes("warehouse"));

            if (sIdx !== -1 && qIdx !== -1) {
              skuIdx = sIdx;
              qtyIdx = qIdx;
              locIdx = lIdx;
              headerRowIdx = i;
              break;
            }
          }

          if (headerRowIdx === -1) {
            // Fallback to defaults
            skuIdx = 0;
            qtyIdx = 2; // In ProductCatalogue, Spare Part stock is 3rd column (index 2)
            locIdx = 3;
            headerRowIdx = 0;
          }

          jsonData.slice(headerRowIdx + 1).forEach((row) => {
            const identifier = String(row[skuIdx] || "").trim();
            if (!identifier || identifier.toLowerCase().includes("part no") || identifier.toLowerCase().includes("lovol")) return;

            const quantity = String(row[qtyIdx] || "").replace(/[^\d.]/g, "");
            const binLocation = locIdx !== -1 ? String(row[locIdx] || "").trim() : "";

            const isOwn = targetWarehouseId === "own-inventory";
            const finalOwnerId = isOwn ? defaultOwnerId : targetWarehouseId;
            const finalOwnerType = isOwn ? defaultOwnerType : "Warehouse";

            importedItems.push({
              sku: identifier,
              partNumber: identifier,
              quantity: parseFloat(quantity) || 0,
              binLocation: binLocation,
              ownerType: finalOwnerType,
              ownerId: finalOwnerId,
              type: "set",
            });
          });

          if (importedItems.length === 0) {
            toast.error("Could not parse any valid items. Please check the Excel format.");
            return;
          }

          bulkUpdateMutation.mutate(importedItems, {
            onSuccess: () => {
              onClose(false);
              setSelectedFile(null);
            },
          });
        } catch (err) {
          toast.error("Error processing Excel data");
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err: any) {
      toast.error("Error reading file");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isDealerOrDistributor ? "Bulk Add to My Inventory" : "Bulk Add Products"}
          </DialogTitle>
          <DialogDescription>
            {isDealerOrDistributor
              ? "Select an Excel file (.xlsx, .xls) to update your personal stock levels."
              : "Select an Excel file (.xlsx, .xls) and the warehouse where these items will be stored."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hideWarehouseSelect && (
            <div className="space-y-2">
              <Label>Select Warehouse <span className="text-red-500">*</span></Label>
              <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {isDealerOrDistributor && (
                    <>
                      <SelectItem value="own-inventory">My Own Inventory</SelectItem>
                      <div className="h-px bg-gray-100 my-1" />
                    </>
                  )}
                  {warehouses.map((w: any) => (
                    <SelectItem key={w._id} value={w._id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="py-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center space-y-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {selectedFile ? selectedFile.name : "Click to select or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Excel files only (.xlsx, .xls)</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-2">
            <p><strong>Expected Columns (Order is Important):</strong></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold underline">Spare Parts:</p>
                <p className="italic">1. Part No</p>
                <p className="italic">2. Item Description (Name)</p>
                <p className="italic">3. Updated Counting Status (Stock)</p>
                <p className="italic font-bold">4. Warehouse Location (Bin)</p>
              </div>
              <div>
                <p className="font-semibold underline">Harvesters:</p>
                <p className="italic">1. SKU (Type)</p>
                <p className="italic">2. Product Name</p>
                <p className="italic font-bold">3. Warehouse Location (Bin)</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose(false);
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkImport}
            disabled={actionLoading || !selectedFile || !targetWarehouseId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Import Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddProductToInventoryDialog({
  isOpen,
  onClose,
  products,
  defaultOwnerType,
  defaultOwnerId
}: {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  products: any[];
  defaultOwnerType?: "Warehouse" | "Dealer" | "Distributor";
  defaultOwnerId?: string;
}) {
  const { user, role } = useAuth();
  const isDealerOrDistributor = role === "Dealer" || role === "Distributor";
  const isWarehouseAdmin = role === "Warehouse Admin";
  const hideWarehouseSelect = isDealerOrDistributor || isWarehouseAdmin;
  const { data: warehousesRes } = useVisibleWarehouses();
  const warehouses = warehousesRes || [];
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>("");

  useEffect(() => {
    if (isDealerOrDistributor) {
      setTargetWarehouseId("own-inventory");
    } else if (isWarehouseAdmin && user?.managedWarehouseId) {
      setTargetWarehouseId(user.managedWarehouseId);
    } else if (defaultOwnerId) {
      setTargetWarehouseId(defaultOwnerId);
    } else {
      setTargetWarehouseId("");
    }
  }, [isDealerOrDistributor, isWarehouseAdmin, user?.managedWarehouseId, defaultOwnerId, isOpen]);

  const [rows, setRows] = useState([
    { productId: "", quantity: 0, binLocation: "", minStockLevel: 0, id: Date.now() }
  ]);

  const bulkUpdateMutation = useBulkUpdateInventory();

  const addRow = () => {
    setRows([...rows, { productId: "", quantity: 0, binLocation: "", minStockLevel: 0, id: Date.now() }]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: string, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSaveAll = () => {
    const validRows = rows.filter(r => r.productId);
    if (validRows.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    if (!hideWarehouseSelect && !targetWarehouseId) {
      toast.error("Please select a target warehouse");
      return;
    }

    const isOwn = targetWarehouseId === "own-inventory";
    const finalOwnerId = isOwn ? defaultOwnerId : targetWarehouseId;
    const finalOwnerType = isOwn ? defaultOwnerType : "Warehouse";

    if (!finalOwnerId) {
      toast.error("Unable to determine target owner ID.");
      return;
    }

    const payload = validRows.map(r => ({
      productId: r.productId,
      ownerType: finalOwnerType || "Warehouse",
      ownerId: finalOwnerId,
      quantity: Number(r.quantity),
      type: "set" as const, // Use 'set' for initial addition
      binLocation: r.binLocation,
      minStockLevel: Number(r.minStockLevel),
    }));

    bulkUpdateMutation.mutate(payload, {
      onSuccess: () => {
        onClose(false);
        setRows([{ productId: "", quantity: 0, binLocation: "", minStockLevel: 0, id: Date.now() }]);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>
              {isDealerOrDistributor ? "Add to My Inventory" : "Add Products to Inventory"}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={addRow} className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          <DialogDescription>
            {isDealerOrDistributor
              ? "Select products and enter initial stock details for your inventory."
              : "Select a target warehouse, choose products, and enter initial stock details."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1">
          {!hideWarehouseSelect && (
            <div className="space-y-2 mb-4">
              <Label>Select Warehouse <span className="text-red-500">*</span></Label>
              <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {isDealerOrDistributor && (
                    <>
                      <SelectItem value="own-inventory">My Own Inventory</SelectItem>
                      <div className="h-px bg-gray-100 my-1" />
                    </>
                  )}
                  {warehouses.map((w: any) => (
                    <SelectItem key={w._id} value={w._id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Header Row */}
          <div className="grid grid-cols-[1fr_80px_80px_120px_40px] gap-3 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>Product *</span>
            <span>Qty</span>
            <span>Min Stock</span>
            <span>Bin Location</span>
            <span className="text-center"></span>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_80px_80px_120px_40px] gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <ProductCombobox
                    onSelect={(p: any) => updateRow(row.id, 'productId', p?._id || p?.id || "")}
                    placeholder="Search product..."
                    className="w-full"
                  />
                </div>
                <Input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                  min="0"
                  className="w-full"
                />
                <Input
                  type="number"
                  value={row.minStockLevel}
                  onChange={(e) => updateRow(row.id, 'minStockLevel', e.target.value)}
                  min="0"
                  className="w-full"
                />
                <Input
                  placeholder="Shelf A-1"
                  value={row.binLocation}
                  onChange={(e) => updateRow(row.id, 'binLocation', e.target.value)}
                  className="w-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="text-gray-400 hover:text-red-600 h-10 w-10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
          <Button onClick={handleSaveAll} className="bg-blue-600 hover:bg-blue-700" disabled={bulkUpdateMutation.isPending}>
            {bulkUpdateMutation.isPending && <Loader2 className="h-4 h-4 animate-spin mr-2" />}
            Save All Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
