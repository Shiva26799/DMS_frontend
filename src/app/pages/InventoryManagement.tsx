import { apiClient } from "../api/client";
import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { Filter, Search, Download, AlertTriangle, Edit, Package2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
  warehouses,
  onUpdateSuccess,
}: {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  selectedItem: any;
  warehouses: any[];
  onUpdateSuccess: (updatedItem: any) => void;
}) {
  const [updateForm, setUpdateForm] = useState<{
    stockAvailable: string | number;
    warehouseId: string;
    reorderLevel: string | number;
  }>({
    stockAvailable: 0,
    warehouseId: "",
    reorderLevel: 5,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedItem) {
      setUpdateForm({
        stockAvailable: selectedItem.stockAvailable || 0,
        warehouseId: selectedItem.warehouseId?._id || "",
        reorderLevel: selectedItem.reorderLevel || 5,
      });
    }
  }, [isOpen, selectedItem]);

  const handleUpdateStock = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      const reorderLevel = updateForm.reorderLevel === "" ? 1 : Number(updateForm.reorderLevel);
      
      await apiClient.put(`/products/${selectedItem._id}`, {
        stockAvailable: Number(updateForm.stockAvailable),
        warehouseId: updateForm.warehouseId,
        reorderLevel: reorderLevel,
      });

      toast.success("Inventory updated successfully");
      onUpdateSuccess({
        ...selectedItem,
        stockAvailable: Number(updateForm.stockAvailable),
        reorderLevel: reorderLevel,
        warehouseId: warehouses.find((w) => w._id === updateForm.warehouseId) || selectedItem.warehouseId,
      });
      onClose(false);
    } catch (err) {
      toast.error("Failed to update inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Inventory Stock</DialogTitle>
          <DialogDescription>
            Update stock levels and warehouse location for {selectedItem?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stockAvailable">Stock Available *</Label>
              <Input
                id="stockAvailable"
                type="number"
                value={updateForm.stockAvailable}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, stockAvailable: e.target.value })
                }
                onFocus={(e) => e.target.select()}
                min="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder Level *</Label>
              <Input
                id="reorderLevel"
                type="number"
                value={updateForm.reorderLevel}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, reorderLevel: e.target.value })
                }
                onFocus={(e) => e.target.select()}
                min="0"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="warehouse">Warehouse Location *</Label>
            <Select
              value={updateForm.warehouseId}
              onValueChange={(value) =>
                setUpdateForm({ ...updateForm, warehouseId: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse._id} value={warehouse._id}>
                    <span className="font-medium">{warehouse.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({warehouse.city}, {warehouse.state})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Preview */}
          <div className="border-t pt-4">
            <Label className="text-xs text-gray-500">Status Preview</Label>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge
                status={
                  Number(updateForm.stockAvailable) === 0
                    ? "Out of Stock"
                    : Number(updateForm.stockAvailable) <= Number(updateForm.reorderLevel === "" ? 1 : updateForm.reorderLevel)
                      ? "Critical"
                      : "Normal"
                }
              />
              <span className="text-sm text-gray-600">
                {Number(updateForm.stockAvailable) > Number(updateForm.reorderLevel === "" ? 1 : updateForm.reorderLevel)
                  ? "Stock level is healthy"
                  : Number(updateForm.stockAvailable) > 0
                    ? "Stock is low - reorder needed"
                    : "Out of stock - urgent action required"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStock}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!updateForm.warehouseId || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Update Inventory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryManagement() {
  const [filterWarehouse, setFilterWarehouse] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const suggestionsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
    setSuggestionsPage(1);
  }, [searchQuery, filterWarehouse, filterCategory, filterStatus, itemsPerPage]);

  useEffect(() => {
    fetchInitialData(true);
  }, []);

  const fetchInitialData = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        apiClient.get("/products"),
        apiClient.get("/warehouses")
      ]);
      setInventory(productsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = useCallback((item: any) => {
    if (item.stockAvailable === 0) return "Out of Stock";
    const reorderLevel = item.reorderLevel || 5;
    if (item.stockAvailable <= reorderLevel) return "Critical";
    return "Normal";
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesWarehouse = filterWarehouse === "all" || item.warehouseId?._id === filterWarehouse;
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;

      const status = getStatus(item);
      const matchesStatus = filterStatus === "all" || status.toLowerCase() === filterStatus;

      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.partNumber && item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesWarehouse && matchesCategory && matchesStatus && matchesSearch;
    });
  }, [inventory, filterWarehouse, filterCategory, filterStatus, searchQuery, getStatus]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInventory, currentPage, itemsPerPage]);

  const totalValue = useMemo(() => {
    return inventory.reduce((sum, item) => {
      return sum + (item.stockAvailable * (item.price || 0));
    }, 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(
      (item) => getStatus(item) !== "Normal"
    ).length;
  }, [inventory, getStatus]);

  const reorderSuggestions = useMemo(() => {
    return inventory.filter((item) => getStatus(item) !== "Normal");
  }, [inventory, getStatus]);

  const suggestionsTotalPages = Math.ceil(reorderSuggestions.length / suggestionsPerPage);

  const paginatedSuggestions = useMemo(() => {
    const startIndex = (suggestionsPage - 1) * suggestionsPerPage;
    return reorderSuggestions.slice(startIndex, startIndex + suggestionsPerPage);
  }, [reorderSuggestions, suggestionsPage]);

  const handleOpenUpdateDialog = (item: any) => {
    setSelectedItem(item);
    setIsUpdateDialogOpen(true);
  };

  const onUpdateSuccess = (updatedItem: any) => {
    setInventory((prev) =>
      prev.map((item) =>
        item._id === updatedItem._id
          ? {
              ...item,
              stockAvailable: updatedItem.stockAvailable,
              reorderLevel: updatedItem.reorderLevel,
              warehouseId: updatedItem.warehouseId,
            }
          : item
      )
    );
  };

  const handleExportReport = () => {
    try {
      if (filteredInventory.length === 0) {
        toast.error("No items to export");
        return;
      }

      const reportData = filteredInventory.map(item => ({
        "Part Number / SKU": item.partNumber || item.sku || "-",
        "Product Name": item.name,
        "Category": item.category,
        "Warehouse": item.warehouseId?.name || "Unassigned",
        "Location": item.warehouseId ? `${item.warehouseId.city}, ${item.warehouseId.state}` : "-",
        "Stock Available": item.stockAvailable,
        "Reorder Level": item.reorderLevel || 5,
        "Status": getStatus(item)
      }));

      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");

      // Set column widths
      const wscols = [
        { wch: 15 }, // Part No
        { wch: 30 }, // Name
        { wch: 15 }, // Category
        { wch: 20 }, // Warehouse
        { wch: 25 }, // Location
        { wch: 15 }, // Stock
        { wch: 15 }, // Reorder
        { wch: 15 }, // Status
      ];
      worksheet["!cols"] = wscols;

      const fileName = `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage stock levels for your harvesters and spare parts
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleExportReport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {inventory.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Inventory Value</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ₹{totalValue.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Low Stock Alert (≤ 5)</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Warehouses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {warehouses.length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
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
          <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
            <SelectTrigger className="w-[220px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <SelectItem value="critical">Low Stock (≤ 5)</SelectItem>
              <SelectItem value="out of stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap">
                  Part No / SKU
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap">
                  Product Name
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap">
                  Category
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap">
                  Warehouse Location
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap text-right">
                  Available
                </th>
                <th className="text-center text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedInventory.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {item.partNumber || item.sku || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900 line-clamp-1">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${item.category === "Harvester"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                      }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.warehouseId?.name || "Unassigned"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.warehouseId?.city || ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span
                      className={`text-sm font-bold ${item.stockAvailable > (item.reorderLevel || 5)
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {item.stockAvailable}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <StatusBadge status={getStatus(item)} />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenUpdateDialog(item)}
                      className="h-8 py-0"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Results per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(val) => setItemsPerPage(parseInt(val))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="font-medium">{filteredInventory.length}</span> results
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm font-medium text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
      </Card>

      {/* Reorder Suggestions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reorder Suggestions
          </h3>
          <Button variant="outline" size="sm">
            Generate PO
          </Button>
        </div>
        <div className="space-y-3">
          {paginatedSuggestions.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.partNumber || item.sku || "N/A"} - {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.warehouseId?.name || "Unassigned"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Available: {item.stockAvailable} / Reorder Level: {item.reorderLevel || 5}
                </p>
                <p className="text-sm font-medium text-blue-600">
                  Suggested Order: {(item.reorderLevel || 5) * 2 - item.stockAvailable} units
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Reorder Suggestions Pagination Controls */}
        {suggestionsTotalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{(suggestionsPage - 1) * suggestionsPerPage + 1}</span> to <span className="font-medium">{Math.min(suggestionsPage * suggestionsPerPage, reorderSuggestions.length)}</span> of <span className="font-medium">{reorderSuggestions.length}</span> suggestions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuggestionsPage(p => Math.max(1, p - 1))}
                disabled={suggestionsPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm font-medium text-gray-700 px-2">
                Page {suggestionsPage} of {suggestionsTotalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuggestionsPage(p => Math.min(suggestionsTotalPages, p + 1))}
                disabled={suggestionsPage === suggestionsTotalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Update Stock Dialog */}
      <UpdateStockDialog
        isOpen={isUpdateDialogOpen}
        onClose={setIsUpdateDialogOpen}
        selectedItem={selectedItem}
        warehouses={warehouses}
        onUpdateSuccess={onUpdateSuccess}
      />
    </div>
  );
}
