import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Loader2, AlertCircle, Search, UserCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "./ui/alert";
import { ProductCombobox } from "./ProductCombobox";
import { useVisibleWarehouses } from "../hooks/useInventory";
import { useDealers } from "../context/DealerContext";
import { useDistributors } from "../hooks/useDistributors";
import { useAuth } from "../context/AuthContext";
import { useSearchLeads } from "../hooks/useLeads";
import { useDebounce } from "../hooks/useDebounce";
import { cn } from "./ui/utils";

interface ProductRow {
  productId: string;
  name?: string;
  quantity: number;
  availableStock?: number;
  price: string | number;
}

interface OrderFormProps {
  initialData?: {
    dealerId?: string;
    orderSource?: "Warehouse" | "Own Stock";
    warehouseId?: string;
    products?: ProductRow[];
    leadId?: string;
    customerName?: string;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

export function OrderForm({ initialData, onSubmit, onCancel, title = "Create New Order" }: OrderFormProps) {
  const { dealers } = useDealers();
  const { data: distributors = [] } = useDistributors();
  const { isSuperAdmin, role, user } = useAuth();
  const { data: visibleWarehouses = [], isLoading: isWarehousesLoading } = useVisibleWarehouses();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dealerId: initialData?.dealerId || "",
    buyerType: "Dealer" as "Dealer" | "User",
    warehouseId: initialData?.warehouseId || "",
    orderSource: initialData?.orderSource || "Warehouse",
    products: initialData?.products || [{ productId: "", quantity: 1, price: "" }],
    leadId: initialData?.leadId || "",
    customerName: initialData?.customerName || "",
  });

  // Customer/Lead search state
  const [customerSearch, setCustomerSearch] = useState(initialData?.customerName || "");
  const debouncedCustomerSearch = useDebounce(customerSearch, 400);
  const { data: searchResults = [], isLoading: isSearching } = useSearchLeads(debouncedCustomerSearch);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const isCustomerLocked = !!initialData?.leadId;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  // Pre-select buyer for Dealers and Distributors
  useEffect(() => {
    if (initialData?.dealerId) {
      const isDistributor = distributors?.some((dist: any) => dist._id === initialData.dealerId);
      updateFormData({ buyerType: isDistributor ? "User" : "Dealer" });
    } else if (user) {
      if (role === "Dealer" && user.dealerId) {
        const dId = typeof user.dealerId === 'object' ? user.dealerId._id : user.dealerId;
        updateFormData({ dealerId: dId, buyerType: "Dealer" });
      } else if (role === "Distributor") {
        updateFormData({ dealerId: user.id || user._id, buyerType: "User" });
      }
    }
  }, [user, role, initialData, distributors]);

  const addProductRow = () => {
    updateFormData({
      products: [...formData.products, { productId: "", quantity: 1, price: "" }],
    });
  };

  const removeProductRow = (index: number) => {
    if (formData.products.length <= 1) {
      updateFormData({
        products: [{ productId: "", quantity: 1, price: "" }]
      });
      return;
    }
    const newProducts = [...formData.products];
    newProducts.splice(index, 1);
    updateFormData({ products: newProducts });
  };

  const updateProductRow = (index: number, field: keyof ProductRow, value: any) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    updateFormData({ products: newProducts });
  };

  // Reset products when warehouse or source changes
  useEffect(() => {
    if (formData.warehouseId || formData.orderSource === "Own Stock") {
      updateFormData({
        products: [{ productId: "", quantity: 1, price: "" }]
      });
    }
  }, [formData.warehouseId, formData.orderSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.dealerId) {
      setError("Please select a dealer.");
      return;
    }

    if (formData.orderSource === "Warehouse" && !formData.warehouseId) {
      setError("Please select a warehouse.");
      return;
    }

    if (!formData.leadId && !customerSearch) {
      setError("Please select a customer or lead.");
      return;
    }

    if (formData.products.some(p => !p.productId)) {
      setError("Please select a product for all items.");
      return;
    }

    if (formData.products.some(p => !p.price || Number(p.price) <= 0)) {
      setError("Please enter a valid price for all products.");
      return;
    }

    const overStockItem = formData.products.find(p => p.quantity > (p.availableStock || 0));
    if (overStockItem) {
      const productName = overStockItem.name || "selected product";
      setError(`One or more products exceed available stock (${productName}). Please adjust quantities.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure customerName is set even for free-text (no lead selected)
      const submitData = {
        ...formData,
        customerName: formData.customerName || customerSearch || undefined,
      };
      await onSubmit(submitData);
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.response?.data?.message || err.message || "Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dealer Selection (Only for Admin/Distributor or if not provided) */}
        <div className="grid gap-2">
          <Label htmlFor="dealer" className="text-sm font-semibold">Select Buyer <span className="text-red-500">*</span></Label>
          <Select
            value={formData.dealerId}
            onValueChange={(value) => {
              const isDistributor = distributors?.some((dist: any) => dist._id === value) || (role === "Distributor" && value === (user?.id || user?._id));
              updateFormData({ dealerId: value, buyerType: isDistributor ? "User" : "Dealer" });
            }}
            disabled={!!initialData?.dealerId || role === "Dealer"}
          >
            <SelectTrigger id="dealer" className="h-10">
              <SelectValue placeholder="Choose a buyer (Dealer/Distributor)" />
            </SelectTrigger>
            <SelectContent>
              {/* List Distributors explicitly */}
              {(isSuperAdmin || role === "Distributor") && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Distributors</div>
                  {distributors
                    ?.filter((dist: any) => isSuperAdmin || dist._id === (user?.id || user?._id))
                    .map((dist: any) => (
                      <SelectItem key={dist._id} value={dist._id}>
                        {dist.name} (Distributor)
                      </SelectItem>
                    ))}
                </>
              )}

              {/* List Dealers */}
              {dealers?.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2 border-t pt-2">Dealers</div>
                  {dealers
                    .filter((d) => (isSuperAdmin || role === "Distributor" || d.id === (typeof user.dealerId === 'object' ? user.dealerId._id : user.dealerId)) && d.status === "Approved")
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name || d.companyName}
                      </SelectItem>
                    ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Customer / Lead Selection */}
        <div className="grid gap-2 md:col-span-2" ref={customerDropdownRef}>
          <Label className="text-sm font-semibold">
            <UserCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Customer / Lead <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
                // If user clears the field, clear the lead link
                if (!e.target.value) {
                  setFormData(prev => ({ ...prev, leadId: "", customerName: "" }));
                }
              }}
              onFocus={() => { if (customerSearch.length >= 1) setShowCustomerDropdown(true); }}
              placeholder={isCustomerLocked ? "" : "Type customer name to search..."}
              className="pl-10 h-10"
              disabled={isCustomerLocked}
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}
            {formData.leadId && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Linked</span>
            )}

            {/* Dropdown Results */}
            {showCustomerDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((lead: any) => (
                  <button
                    key={lead._id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between text-sm transition-colors"
                    onClick={() => {
                      setCustomerSearch(lead.customerName);
                      setFormData(prev => ({
                        ...prev,
                        leadId: lead._id,
                        customerName: lead.customerName,
                      }));
                      setShowCustomerDropdown(false);
                    }}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{lead.customerName}</span>
                      {lead.phone && <span className="text-gray-400 ml-2 text-xs">{lead.phone}</span>}
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase",
                      lead.stage === "Customer" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-600"
                    )}>
                      {lead.stage || "Lead"}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {showCustomerDropdown && debouncedCustomerSearch.length >= 1 && searchResults.length === 0 && !isSearching && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
                No matching leads/customers found. The name will be saved as-is.
              </div>
            )}
          </div>
          {!isCustomerLocked && !formData.leadId && customerSearch && (
            <p className="text-[11px] text-amber-600 font-medium">No lead linked — customer name will be saved as free text.</p>
          )}
        </div>

        {/* Fulfillment Source */}
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="fulfillmentSource" className="text-sm font-semibold">Fulfillment Source <span className="text-red-500">*</span></Label>
          <Select
            value={formData.orderSource === "Own Stock" ? "own-stock" : formData.warehouseId}
            onValueChange={(value) => {
              if (value === "own-stock") {
                updateFormData({ orderSource: "Own Stock", warehouseId: "" });
              } else {
                updateFormData({ orderSource: "Warehouse", warehouseId: value });
              }
            }}
          >
            <SelectTrigger id="fulfillmentSource" className="h-10">
              <SelectValue placeholder={isWarehousesLoading ? "Loading sources..." : "Select Fulfillment Source..."} />
            </SelectTrigger>
            <SelectContent>
              {!isSuperAdmin && (
                <SelectItem value="own-stock" className="font-medium text-blue-600">Own Local Stock</SelectItem>
              )}
              {visibleWarehouses.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t">Warehouses</div>
                  {visibleWarehouses.map((wh: any) => (
                    <SelectItem key={wh._id} value={wh._id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
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
                    warehouseId={formData.warehouseId}
                    ownerType={formData.orderSource as any}
                    dealerId={formData.dealerId}
                    disabled={formData.orderSource === "Warehouse" && !formData.warehouseId}
                    onSelect={(selected) => {
                      const product: any = Array.isArray(selected) ? selected[0] : selected;
                      const newProducts = [...formData.products];
                      
                      if (!product) {
                        newProducts[index] = {
                          ...newProducts[index],
                          productId: "",
                          name: "",
                          availableStock: undefined,
                          price: ""
                        };
                      } else {
                        newProducts[index] = {
                          ...newProducts[index],
                          productId: product.id || "",
                          name: product.name || "",
                          availableStock: product.stock || 0,
                          price: product.price || newProducts[index].price
                        };
                      }
                      updateFormData({ products: newProducts });
                    }}
                    placeholder={
                      formData.orderSource === "Warehouse" && !formData.warehouseId 
                        ? "Select warehouse first..." 
                        : "Select product..."
                    }
                  />
                  {row.availableStock !== undefined && row.productId && (
                    <p className="text-[10px] mt-1 text-green-600 font-medium px-1">
                      Available: {row.availableStock} units
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateProductRow(index, "quantity", parseInt(e.target.value) || 0)}
                    className={cn(
                      "h-9",
                      row.productId && row.availableStock !== undefined && row.quantity > row.availableStock && "border-red-500 bg-red-50"
                    )}
                  />
                  {row.productId && row.availableStock !== undefined && row.quantity > row.availableStock && (
                    <p className="text-[10px] text-red-500 mt-1 truncate">Over limit!</p>
                  )}
                </div>
                <div className="col-span-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <Input
                      type="number"
                      placeholder="Price *"
                      value={row.price}
                      onChange={(e) => updateProductRow(index, "price", e.target.value)}
                      className={cn(
                        "h-9 pl-6",
                        row.productId && (!row.price || Number(row.price) <= 0) && "border-red-500 bg-red-50"
                      )}
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

      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <div className="flex items-center text-sm">
          <span className="text-gray-500 mr-2">Estimate Total:</span>
          <span className="text-xl font-bold text-blue-600">
            ₹{formData.products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity) || 0), 0).toLocaleString()}
          </span>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Order
          </Button>
        </div>
      </div>
    </form>
  );
}
