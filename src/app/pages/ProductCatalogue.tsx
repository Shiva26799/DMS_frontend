import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router";
import * as XLSX from "xlsx";
import { Plus, Filter, Search, Package, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
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
import { useProducts, useWarehouses, useAddProduct, useBulkAddProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";

interface Product {
  _id: string;
  name: string;
  sku?: string;
  partNumber?: string;
  category: string;
  description?: string;
  price: number;
  stockAvailable: number;
  warrantyPeriod?: string;
  imageUrl?: string;
  warehouseId?: {
    _id: string;
    name: string;
  };
}

export function ProductCatalogue() {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const { data, isLoading: isProductsLoading } = useProducts({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    category: filterCategory === "all" ? undefined : filterCategory
  });

  const products = data?.products || [];
  const totalProducts = data?.totalProducts || 0;
  const totalPages = data?.totalPages || 0;
  const counts = data?.counts || { total: 0, Harvester: 0, "Spare Part": 0 };

  const { data: warehouses = [], isLoading: isWarehousesLoading } = useWarehouses();

  const loading = isProductsLoading || isWarehousesLoading;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, searchQuery, itemsPerPage]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    partNumber: "",
    category: "",
    description: "",
    price: "",
    stockAvailable: "",
    warrantyPeriod: "",
    warehouseId: "",
  });
  const [bulkWarehouseId, setBulkWarehouseId] = useState<string>("");
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (warehouses.length > 0 && !formData.warehouseId) {
      setFormData(prev => ({ ...prev, warehouseId: warehouses[0]._id }));
      setBulkWarehouseId(warehouses[0]._id);
    }
  }, [warehouses]);

  const addSpecRow = () => setSpecs([...specs, { key: "", value: "" }]);
  const removeSpecRow = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: "key" | "value", val: string) => {
    const updated = [...specs];
    updated[i][field] = val;
    setSpecs(updated);
  };

  const filteredProducts = products;
  const paginatedProducts = products;

  const addMutation = useAddProduct();
  const bulkMutation = useBulkAddProducts();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addMutation.isPending) return;

    const submitData = new FormData();
    submitData.append("name", formData.name);
    if (formData.sku) submitData.append("sku", formData.sku);
    if (formData.partNumber) submitData.append("partNumber", formData.partNumber);
    submitData.append("category", formData.category);
    submitData.append("description", formData.description);
    submitData.append("price", formData.price || "0");
    submitData.append("stockAvailable", formData.stockAvailable || "0");
    submitData.append("warrantyPeriod", formData.warrantyPeriod);
    if (formData.warehouseId) submitData.append("warehouseId", formData.warehouseId);

    const specsObj: Record<string, string> = {};
    specs.forEach(({ key, value }) => {
      if (key.trim()) specsObj[key.trim()] = value.trim();
    });
    submitData.append("specifications", JSON.stringify(specsObj));

    if (imageFile) {
      submitData.append("image", imageFile);
    }

    addMutation.mutate(submitData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        setFormData({ name: "", sku: "", partNumber: "", category: "", description: "", price: "", stockAvailable: "", warrantyPeriod: "", warehouseId: warehouses[0]?._id || "" });
        setSpecs([{ key: "", value: "" }]);
        setImageFile(null);
        setImagePreview(null);
      }
    });
  };

  const handleBulkImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays (rows)
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 1) {
          toast.error("The Excel file seems to be empty");
          return;
        }

        const importedProducts: any[] = [];

        // 1. Detect Category from Headers (first non-empty row)
        let detectedCategory: "Harvester" | "Spare Part" = "Spare Part";
        for (const row of jsonData) {
          if (!row || row.length < 2) continue;
          const headers = row.map(cell => String(cell || "").toLowerCase().trim());
          if (headers.some(h => h.includes("part no") || h.includes("counting status") || h.includes("item description"))) {
            detectedCategory = "Spare Part";
            break;
          }
          if (headers.some(h => h.includes("product type") || h.includes("specification") || h.includes("product name"))) {
            detectedCategory = "Harvester";
            break;
          }
        }

        let rowSkipCount = 0;

        // Process each row
        jsonData.forEach((row) => {
          if (!row || row.length < 2) {
            rowSkipCount++;
            return;
          }

          let parts = row.map(cell => String(cell || "").trim());

          // Skip header/title rows
          const isHeaderOrTitle = parts.some((p: string) => {
            const lp = p.toLowerCase();
            return lp.includes("lovol products") || lp === "part no" || lp === "product type" || lp === "s.no" || lp === "sn" || lp === "item description" || lp === "updated counting status" || lp === "product name" || lp === "brief specification";
          });

          if (isHeaderOrTitle || parts[0] === "" || (parts[0].toLowerCase() === "sl no")) {
            rowSkipCount++;
            return;
          }

          // DETECTION: If the first column is a small number and there are 4+ columns, 
          // it's likely an index column. Offset everything by 1.
          let offset = 0;
          if (!isNaN(Number(parts[0])) && parts[0].length < 6 && parts.length >= 4) {
            offset = 1;
          }

          if (detectedCategory === "Harvester") {
            // Harvesters format: SL No | Type | Name | Spec
            const productType = parts[offset] || "";
            const spec = parts[offset + 2] || "";
            importedProducts.push({
              category: "Harvester",
              sku: "-",          // Leave SKU empty as requested
              name: parts[offset + 1] || "-",     // Product Name
              description: `${productType}${productType && spec ? " - " : ""}${spec}`.trim() || "-", // Combine Type and Spec
              price: 0,
              stockAvailable: 0,
              warehouseId: bulkWarehouseId
            });
          } else {
            // Spare Part: Part No -> partNumber, Item Description -> name, Stock -> stockAvailable
            const itemName = parts[offset + 1] || "-";
            importedProducts.push({
              category: "Spare Part",
              partNumber: parts[offset],
              name: itemName,
              description: "-",
              stockAvailable: parseInt(parts[offset + 2]?.replace(/[^\d]/g, '')) || 0,
              price: 0,
              warehouseId: bulkWarehouseId
            });
          }
        });

        if (importedProducts.length === 0) {
          toast.error("Could not parse any valid products. Please ensure the Excel has the correct columns.");
          setIsBulkModalOpen(false); // Close modal if no products parsed
          setSelectedFile(null);
          return;
        }
        try {
          bulkMutation.mutate(importedProducts, {
            onSuccess: () => {
              setIsBulkModalOpen(false);
              setSelectedFile(null);
            }
          });
        } catch (err: any) {
          toast.error("Error submitting bulk import");
        }
      };

      if (selectedFile) {
        reader.readAsArrayBuffer(selectedFile);
      }
    } catch (err: any) {
      toast.error("Error reading file");
    }
  };

  const actionLoading = addMutation.isPending || bulkMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalogue</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage harvesters and spare parts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => setIsBulkModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {counts.total}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Harvesters</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {counts.Harvester}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Spare Parts</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {counts["Spare Part"]}
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
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Harvester">Harvesters</SelectItem>
              <SelectItem value="Spare Part">Spare Parts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden border border-gray-100">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="text-gray-500">Add a new product or adjust your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product: any) => (
            <Link key={product.id || product._id} to={`/products/${product.id || product._id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <Badge
                    variant={
                      product.category === "Harvester" ? "default" : "secondary"
                    }
                    className={
                      product.category === "Harvester"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {product.category}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description || "No description provided."}
                </p>
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{product.category === "Spare Part" ? "Part No" : "SKU"}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {product.category === "Spare Part" ? product.partNumber : product.sku}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="text-sm font-medium text-gray-900">
                      {product.price > 0
                        ? `₹${(product.price / 100000).toFixed(2)}L`
                        : "-"
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock</span>
                    <span
                      className={`text-sm font-medium ${product.stockAvailable > 10
                        ? "text-green-600"
                        : product.stockAvailable > 5
                          ? "text-orange-600"
                          : "text-red-600"
                        }`}
                    >
                      {product.stockAvailable} units
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Warranty</span>
                    <span className="text-sm font-medium text-gray-900">
                      {product.warrantyPeriod || "N/A"}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
                  {[12, 24, 48, 96].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalProducts)}</span> of <span className="font-medium">{totalProducts}</span> products
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleAddProduct}>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter the details of the new product to add it to the catalogue.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Product Image */}
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <div
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 cursor-pointer overflow-hidden hover:bg-gray-100 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 font-medium">Upload Image</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
                <p className="text-[10px] text-gray-400">JPEG, PNG, WEBP (Max 5MB)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. LOVOL HP-2000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identifier">
                    {formData.category === "Spare Part" ? "Part Number *" : "SKU *"}
                  </Label>
                  <Input
                    id="identifier"
                    required
                    value={formData.category === "Spare Part" ? formData.partNumber : formData.sku}
                    onChange={e => {
                      if (formData.category === "Spare Part") {
                        setFormData({ ...formData, partNumber: e.target.value });
                      } else {
                        setFormData({ ...formData, sku: e.target.value });
                      }
                    }}
                    placeholder={formData.category === "Spare Part" ? "e.g. RGV410408" : "e.g. HP-2000"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Harvester">Harvester</SelectItem>
                      <SelectItem value="Spare Part">Spare Part</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse *</Label>
                  <Select value={formData.warehouseId} onValueChange={(val) => setFormData({ ...formData, warehouseId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w: any) => (
                        <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input id="price" type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="e.g. 1850000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock *</Label>
                  <Input id="stock" type="number" required value={formData.stockAvailable} onChange={e => setFormData({ ...formData, stockAvailable: e.target.value })} placeholder="e.g. 15" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty Period</Label>
                  <Input id="warranty" value={formData.warrantyPeriod} onChange={e => setFormData({ ...formData, warrantyPeriod: e.target.value })} placeholder="e.g. 2 Years" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description..."
                  className="h-20"
                />
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Technical Specifications</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={addSpecRow}>
                    <Plus className="w-3 h-3 mr-1" /> Add Row
                  </Button>
                </div>
                <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                  {specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="Spec name (e.g. Engine)"
                        value={spec.key}
                        onChange={e => updateSpec(i, "key", e.target.value)}
                        className="flex-1 h-8 text-sm bg-white"
                      />
                      <Input
                        placeholder="Value (e.g. 4-cylinder)"
                        value={spec.value}
                        onChange={e => updateSpec(i, "value", e.target.value)}
                        className="flex-1 h-8 text-sm bg-white"
                      />
                      {specs.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-700" onClick={() => removeSpecRow(i)}>
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading || !formData.name || !formData.sku || !formData.category || !formData.price || !formData.stockAvailable} className="bg-blue-600 hover:bg-blue-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Add Products</DialogTitle>
            <DialogDescription>
              Select an Excel file (.xlsx, .xls) and the warehouse where these items will be stored.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Warehouse *</Label>
              <Select value={bulkWarehouseId} onValueChange={setBulkWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: any) => (
                    <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile ? selectedFile.name : "Click to select or drag and drop"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Excel files only (.xlsx, .xls)
                </p>
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
                </div>
                <div>
                  <p className="font-semibold underline">Harvesters:</p>
                  <p className="italic">1. SKU (Type)</p>
                  <p className="italic">2. Product Name</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBulkModalOpen(false);
              setSelectedFile(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={actionLoading || !selectedFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Import Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
