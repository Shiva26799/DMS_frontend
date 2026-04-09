import React, { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ProductCombobox } from "./ProductCombobox";
import { useVisibleWarehouses } from "../hooks/useInventory";
import { useDealers } from "../context/DealerContext";
import { useAuth } from "../context/AuthContext";

interface ProductRow {
  productId: string;
  quantity: number;
  price: string | number;
}

interface OrderFormProps {
  initialData?: {
    dealerId?: string;
    orderSource?: "Warehouse" | "Own Stock";
    warehouseId?: string;
    products?: ProductRow[];
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

export function OrderForm({ initialData, onSubmit, onCancel, title = "Create New Order" }: OrderFormProps) {
  const { dealers } = useDealers();
  const { isSuperAdmin, role } = useAuth();
  const { data: visibleWarehouses = [], isLoading: isWarehousesLoading } = useVisibleWarehouses();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dealerId: initialData?.dealerId || "",
    warehouseId: initialData?.warehouseId || "",
    orderSource: initialData?.orderSource || "Warehouse",
    products: initialData?.products || [{ productId: "", quantity: 1, price: "" }],
  });

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { productId: "", quantity: 1, price: "" }],
    });
  };

  const removeProductRow = (index: number) => {
    if (formData.products.length <= 1) return;
    const newProducts = [...formData.products];
    newProducts.splice(index, 1);
    setFormData({ ...formData, products: newProducts });
  };

  const updateProductRow = (index: number, field: keyof ProductRow, value: any) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({ ...formData, products: newProducts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.dealerId) {
      alert("Please select a dealer.");
      return;
    }

    if (formData.orderSource === "Warehouse" && !formData.warehouseId) {
      alert("Please select a warehouse.");
      return;
    }

    if (formData.products.some(p => !p.productId)) {
      alert("Please select a product for all items.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dealer Selection (Only for Admin/Distributor or if not provided) */}
        <div className="grid gap-2">
          <Label htmlFor="dealer" className="text-sm font-semibold">Select Dealer <span className="text-red-500">*</span></Label>
          <Select
            value={formData.dealerId}
            onValueChange={(value) => setFormData({ ...formData, dealerId: value })}
            disabled={!!initialData?.dealerId}
          >
            <SelectTrigger id="dealer" className="h-10">
              <SelectValue placeholder="Choose a dealer" />
            </SelectTrigger>
            <SelectContent>
              {dealers
                .filter((d) => d.status === "Approved")
                .map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name || d.companyName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fulfillment Source */}
        <div className="grid gap-2">
          <Label htmlFor="orderSource" className="text-sm font-semibold">Fulfillment Source <span className="text-red-500">*</span></Label>
          <Select
            value={formData.orderSource}
            onValueChange={(value: any) =>
              setFormData({ 
                ...formData, 
                orderSource: value,
                warehouseId: value === "Own Stock" ? "" : formData.warehouseId
              })
            }
          >
            <SelectTrigger id="orderSource" className="h-10">
              <SelectValue placeholder="Select Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Warehouse">Warehouse Stock</SelectItem>
              <SelectItem value="Own Stock">Own Local Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Warehouse Selection */}
        {formData.orderSource === "Warehouse" && (
          <div className="grid gap-2">
            <Label htmlFor="warehouse" className="text-sm font-semibold">Fulfillment Warehouse <span className="text-red-500">*</span></Label>
            <Select
              value={formData.warehouseId}
              onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
            >
              <SelectTrigger id="warehouse" className="h-10">
                <SelectValue placeholder={isWarehousesLoading ? "Loading..." : "Select warehouse"} />
              </SelectTrigger>
              <SelectContent>
                {visibleWarehouses.map((wh: any) => (
                  <SelectItem key={wh._id} value={wh._id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Products <span className="text-red-500">*</span></Label>
          <Button type="button" variant="outline" size="sm" onClick={addProductRow} className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
          </Button>
        </div>
        
        <div className="space-y-2">
          {formData.products.map((row, index) => (
            <div key={index} className="flex gap-2 items-center group">
              <div className="flex-grow grid grid-cols-12 gap-2 items-center border p-2 rounded-md bg-white shadow-sm">
                <div className="col-span-6">
                  <ProductCombobox
                    onSelect={(selected) => {
                      const product: any = Array.isArray(selected) ? selected[0] : selected;
                      updateProductRow(index, "productId", product?.id || "");
                      if (product?.price) {
                        updateProductRow(index, "price", product.price);
                      }
                    }}
                    placeholder="Select product..."
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateProductRow(index, "quantity", parseInt(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>
                <div className="col-span-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <Input
                      type="number"
                      placeholder="Price"
                      value={row.price}
                      onChange={(e) => updateProductRow(index, "price", e.target.value)}
                      className="h-9 pl-6"
                    />
                  </div>
                </div>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                onClick={() => removeProductRow(index)}
                disabled={formData.products.length <= 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData?.dealerId ? "Convert to Order" : "Create Order"}
        </Button>
      </div>
    </form>
  );
}
