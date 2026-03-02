import { useState } from "react";
import { Filter, Search, Download, AlertTriangle, Edit, Package2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockInventory, mockWarehouses } from "../data/mockData";
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

export function InventoryManagement() {
  const [filterWarehouse, setFilterWarehouse] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState(mockInventory);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({
    available: 0,
    reserved: 0,
    reorderLevel: 0,
    warehouseId: "",
  });

  const filteredInventory = inventory.filter((item) => {
    const matchesWarehouse = filterWarehouse === "all" || item.warehouseId === filterWarehouse;
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status.toLowerCase() === filterStatus;
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesCategory && matchesStatus && matchesSearch;
  });

  const totalValue = inventory.reduce((sum, item) => {
    // Rough estimate based on category
    const estimatedPrice = item.category === "Harvester" ? 2000000 : 5000;
    return sum + item.available * estimatedPrice;
  }, 0);

  const lowStockCount = inventory.filter(
    (item) => item.status === "Low" || item.status === "Critical"
  ).length;

  const handleOpenUpdateDialog = (item: any) => {
    setSelectedItem(item);
    setUpdateForm({
      available: item.available,
      reserved: item.reserved,
      reorderLevel: item.reorderLevel,
      warehouseId: item.warehouseId,
    });
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateStock = () => {
    if (!selectedItem) return;

    // Calculate new status
    let newStatus: "Normal" | "Low" | "Critical" | "Out of Stock" = "Normal";
    if (updateForm.available === 0) {
      newStatus = "Out of Stock";
    } else if (updateForm.available <= updateForm.reorderLevel * 0.5) {
      newStatus = "Critical";
    } else if (updateForm.available <= updateForm.reorderLevel) {
      newStatus = "Low";
    }

    const warehouseName = mockWarehouses.find(w => w.id === updateForm.warehouseId)?.name || selectedItem.warehouseName;

    setInventory(
      inventory.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              available: updateForm.available,
              reserved: updateForm.reserved,
              reorderLevel: updateForm.reorderLevel,
              warehouseId: updateForm.warehouseId,
              warehouseName: warehouseName,
              status: newStatus,
            }
          : item
      )
    );

    toast.success("Inventory updated successfully");
    setIsUpdateDialogOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Multi-warehouse inventory tracking for harvesters and spare parts
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {inventory.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Inventory Value</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ₹{(totalValue / 10000000).toFixed(1)}Cr
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Warehouses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {mockWarehouses.filter(w => w.status === "Active").length}
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
                placeholder="Search inventory..."
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
              {mockWarehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
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
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
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
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  SKU
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Product Name
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Category
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Warehouse Location
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Available
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Reserved
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Reorder Level
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
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {item.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{item.productName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.category === "Harvester" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.warehouseName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mockWarehouses.find(w => w.id === item.warehouseId)?.city}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        item.available > item.reorderLevel
                          ? "text-green-600"
                          : item.available > 0
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.available}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.reserved}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.reorderLevel}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenUpdateDialog(item)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          {inventory
            .filter(
              (item) =>
                item.status === "Low" ||
                item.status === "Critical" ||
                item.available <= item.reorderLevel
            )
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      item.status === "Critical"
                        ? "text-red-500"
                        : "text-orange-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.sku} - {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.warehouseName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Available: {item.available} / Reorder: {item.reorderLevel}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    Suggested Order: {item.reorderLevel * 2 - item.available}{" "}
                    units
                  </p>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Update Stock Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Inventory Stock</DialogTitle>
            <DialogDescription>
              Update stock levels and warehouse location for {selectedItem?.productName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="available">Available Quantity *</Label>
                <Input
                  id="available"
                  type="number"
                  value={updateForm.available}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, available: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reserved">Reserved Quantity</Label>
                <Input
                  id="reserved"
                  type="number"
                  value={updateForm.reserved}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, reserved: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reorder">Reorder Level *</Label>
              <Input
                id="reorder"
                type="number"
                value={updateForm.reorderLevel}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, reorderLevel: parseInt(e.target.value) || 0 })
                }
                min="0"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                System will alert when stock falls below this level
              </p>
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
                  {mockWarehouses
                    .filter(w => w.status === "Active")
                    .map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        <div>
                          <div className="font-medium">{warehouse.name}</div>
                          <div className="text-xs text-gray-500">
                            {warehouse.city}, {warehouse.state}
                          </div>
                        </div>
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
                    updateForm.available === 0
                      ? "Out of Stock"
                      : updateForm.available <= updateForm.reorderLevel * 0.5
                      ? "Critical"
                      : updateForm.available <= updateForm.reorderLevel
                      ? "Low"
                      : "Normal"
                  } 
                />
                <span className="text-sm text-gray-600">
                  {updateForm.available > updateForm.reorderLevel
                    ? "Stock level is healthy"
                    : updateForm.available > 0
                    ? "Reorder recommended"
                    : "Out of stock - urgent action required"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStock}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!updateForm.warehouseId}
            >
              Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
