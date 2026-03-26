import { useParams, Link, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Package, IndianRupee, Calendar, Wrench, Loader2, Plus, Image as ImageIcon, Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useProductDetail, useWarehouses, useUpdateProduct, useDeleteProduct } from "../hooks/useProducts";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: product, isLoading: isProductLoading, error: productError } = useProductDetail(id);
  const { data: warehouses = [], isLoading: isWarehousesLoading } = useWarehouses();
  
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", sku: "", partNumber: "", category: "", description: "", price: "", stockAvailable: "", warrantyPeriod: "", warehouseId: "", reorderLevel: "5"
  });
  const [editSpecs, setEditSpecs] = useState<{ key: string; value: string }[]>([]);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setEditForm({
        name: product.name || "",
        sku: product.sku || "",
        partNumber: product.partNumber || "",
        category: product.category || "",
        description: product.description || "",
        price: String(product.price || "0"),
        stockAvailable: String(product.stockAvailable || "0"),
        warrantyPeriod: product.warrantyPeriod || "",
        warehouseId: product.warehouseId?._id || product.warehouseId || "",
        reorderLevel: String(product.reorderLevel || "5"),
      });

      if (product.specifications) {
        const specsArr = Object.entries(product.specifications).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setEditSpecs(specsArr.length > 0 ? specsArr : [{ key: "", value: "" }]);
      } else {
        setEditSpecs([{ key: "", value: "" }]);
      }
    }
  }, [product]);

  const openEditModal = () => {
    setIsEditOpen(true);
    setNewImageFile(null);
    setNewImagePreview(null);
  };

  const addEditSpecRow = () => setEditSpecs([...editSpecs, { key: "", value: "" }]);
  const removeEditSpecRow = (i: number) => setEditSpecs(editSpecs.filter((_, idx) => idx !== i));
  const updateEditSpec = (i: number, field: "key" | "value", val: string) => {
    const updated = [...editSpecs];
    updated[i][field] = val;
    setEditSpecs(updated);
  };

  const handleNewImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateMutation.isPending) return;

    const fd = new FormData();
    fd.append("name", editForm.name);
    fd.append("category", editForm.category);
    if (editForm.sku) fd.append("sku", editForm.sku);
    if (editForm.partNumber) fd.append("partNumber", editForm.partNumber);
    fd.append("price", editForm.price);
    fd.append("stockAvailable", editForm.stockAvailable);
    fd.append("description", editForm.description);
    fd.append("warrantyPeriod", editForm.warrantyPeriod);
    fd.append("warehouseId", editForm.warehouseId);
    fd.append("reorderLevel", editForm.reorderLevel);

    const specsObj: Record<string, string> = {};
    editSpecs.forEach(({ key, value }) => {
      if (key.trim()) specsObj[key.trim()] = value.trim();
    });
    fd.append("specifications", JSON.stringify(specsObj));

    if (newImageFile) {
      fd.append("image", newImageFile);
    }

    updateMutation.mutate({ id: id!, data: fd }, {
      onSuccess: () => {
        setIsEditOpen(false);
        setNewImageFile(null);
        setNewImagePreview(null);
      }
    });
  };

  const handleDeleteSubmit = () => {
    deleteMutation.mutate(id!, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        navigate("/products");
      }
    });
  };

  const loading = isProductLoading || isWarehousesLoading;
  const actionLoading = updateMutation.isPending || deleteMutation.isPending;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-96 w-full rounded-lg" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }


  if (productError || !product) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Back to Products
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {product.category === "Spare Part" ? `Part No: ${product.partNumber}` : `SKU: ${product.sku}`}
            </p>
          </div>
        </div>
        <Badge
          variant={product.category === "Harvester" ? "default" : "secondary"}
          className={
            product.category === "Harvester"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }
        >
          {product.category}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image */}
          <Card className="p-6">
            <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-32 h-32 text-blue-600" />
              )}
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Description</h3>
            <p className="text-sm text-gray-600">{product.description || "No description available."}</p>
          </Card>

          {/* Specifications */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              {product.specifications && Object.keys(product.specifications).length > 0
                ? Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{key}</p>
                    <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                  </div>
                ))
                : (
                  <div className="border border-gray-200 rounded-lg p-4 col-span-2">
                    <p className="text-sm text-gray-600">No specifications available.</p>
                  </div>
                )
              }
            </div>
          </Card>
        </div>

        {/* Right Column - Details & Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">{product.category === "Spare Part" ? "Part Number" : "SKU"}</p>
                  <p className="text-lg font-bold text-gray-900">{product.category === "Spare Part" ? product.partNumber : product.sku}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-lg font-bold text-gray-900">₹{(product.price / 100000).toFixed(2)}L</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Stock Available</p>
                  <p className="text-lg font-bold text-gray-900">{product.stockAvailable} units</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Warranty Period</p>
                  <p className="text-sm font-medium text-gray-900">{product.warrantyPeriod || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Service Schedule</p>
                  <p className="text-sm font-medium text-gray-900">{product.serviceSchedule || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Warehouse</p>
                  <p className="text-sm font-medium text-gray-900">{product.warehouseId?.name || "Unassigned"}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                Create Order
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Update Stock
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={openEditModal}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
              <Button className="w-full justify-start" variant="outline">
                View Inventory
              </Button>
              <Button
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Product
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Factory</span>
                <span className="text-sm font-medium text-green-600">{Math.floor(product.stockAvailable * 0.6)} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Regional Warehouses</span>
                <span className="text-sm font-medium text-green-600">{Math.floor(product.stockAvailable * 0.3)} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dealer Warehouses</span>
                <span className="text-sm font-medium text-yellow-600">{Math.floor(product.stockAvailable * 0.1)} units</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update the product details below.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Image */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 cursor-pointer overflow-hidden hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newImagePreview ? (
                    <img src={newImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Change Image</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleNewImage} />
                <p className="text-[10px] text-gray-400">Click to change image (JPEG, PNG, WEBP)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{editForm.category === "Spare Part" ? "Part Number" : "SKU"}</Label>
                  <Input
                    value={editForm.category === "Spare Part" ? editForm.partNumber : editForm.sku}
                    onChange={e => {
                      if (editForm.category === "Spare Part") {
                        setEditForm({ ...editForm, partNumber: e.target.value });
                      } else {
                        setEditForm({ ...editForm, sku: e.target.value });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={editForm.category} onValueChange={(val) => setEditForm({ ...editForm, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Harvester">Harvester</SelectItem>
                      <SelectItem value="Spare Part">Spare Part</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (₹) *</Label>
                  <Input type="number" required value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Stock *</Label>
                  <Input type="number" required value={editForm.stockAvailable} onChange={e => setEditForm({ ...editForm, stockAvailable: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Warranty Period</Label>
                  <Input value={editForm.warrantyPeriod} onChange={e => setEditForm({ ...editForm, warrantyPeriod: e.target.value })} placeholder="e.g. 2 Years" />
                </div>
                <div className="space-y-2">
                  <Label>Warehouse *</Label>
                  <Select value={editForm.warehouseId} onValueChange={(val) => setEditForm({ ...editForm, warehouseId: val })}>
                    <SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w: any) => (
                        <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reorder Alert Level</Label>
                  <Input type="number" value={editForm.reorderLevel} onChange={e => setEditForm({ ...editForm, reorderLevel: e.target.value })} placeholder="5" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Description</Label>
                <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="h-20" placeholder="Detailed product description..." />
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Technical Specifications</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={addEditSpecRow}>
                    <Plus className="w-3 h-3 mr-1" /> Add Row
                  </Button>
                </div>
                <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                  {editSpecs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input placeholder="Spec name" value={spec.key} onChange={e => updateEditSpec(i, "key", e.target.value)} className="flex-1 h-8 text-sm bg-white" />
                      <Input placeholder="Value" value={spec.value} onChange={e => updateEditSpec(i, "value", e.target.value)} className="flex-1 h-8 text-sm bg-white" />
                      {editSpecs.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-red-500" onClick={() => removeEditSpecRow(i)}>✕</Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product <strong>{product.name}</strong> from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSubmit();
              }}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
