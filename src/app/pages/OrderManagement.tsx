import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockProducts } from "../data/mockData";
import { useDealers } from "../context/DealerContext";
import { useOrders } from "../context/OrderContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { useDebounce } from "../hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { ProductCombobox } from "../components/ProductCombobox";

export function OrderManagement() {
  const { dealers } = useDealers();
  const { orders, addOrder } = useOrders();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Form state for new order
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dealerId: "",
    products: [{ productId: "", quantity: 1, price: "" as any }],
  });

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { productId: "", quantity: 1, price: "" as any }],
    });
  };

  const removeProductRow = (index: number) => {
    if (formData.products.length <= 1) return;
    const newProducts = [...formData.products];
    newProducts.splice(index, 1);
    setFormData({ ...formData, products: newProducts });
  };

  const updateProductRow = (index: number, field: string, value: any) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({ ...formData, products: newProducts });
  };

  const handleCreateOrder = async () => {
    const selectedDealer = dealers.find((d) => d.id === formData.dealerId);
    
    // Validation
    if (!formData.dealerId) {
      alert("Please select a dealer.");
      return;
    }

    if (formData.products.some(p => !p.productId)) {
      alert("Please select a product for all items.");
      return;
    }

    if (formData.products.some(p => Number(p.quantity) <= 0)) {
      alert("Quantity must be greater than 0 for all items.");
      return;
    }

    if (!selectedDealer) return;

    try {
      await addOrder({
        dealerId: formData.dealerId,
        products: formData.products.map(p => ({
          productId: p.productId,
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
        })),
      });
      
      setFormData({
        dealerId: "",
        products: [{ productId: "", quantity: 1, price: "" as any }],
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" ||
      order.paymentStatus.toLowerCase() === filterStatus ||
      order.deliveryStatus.toLowerCase().includes(filterStatus);
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      order.dealer.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + (Number(order.totalValue) || 0), 0);
  const pendingApprovals = orders.filter(
    (o) => 
      o.currentStage === "PO Upload" || 
      o.currentStage === "Payment Upload" || 
      o.currentStage === "Payment Verification" || 
      o.currentStage === "Order Approval"
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Complete order lifecycle tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="dealer" className="text-sm font-semibold">Select Dealer <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.dealerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dealerId: value })
                  }
                >
                  <SelectTrigger id="dealer" className="h-10">
                    <SelectValue placeholder="Choose a dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealers
                      .filter((d) => d.status === "Approved")
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

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
                              const product = Array.isArray(selected) ? selected[0] : selected;
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
                            onChange={(e) => updateProductRow(index, "quantity", e.target.value)}
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
                        <Plus className="w-4 h-4 rotate-45" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 border-t pt-4">
              <div className="flex-1 flex items-center text-sm">
                <span className="text-gray-500 mr-2">Estimate Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  ₹{formData.products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity) || 0), 0).toLocaleString()}
                </span>
              </div>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 px-8"
                onClick={handleCreateOrder}
              >
                Submit Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Value</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-green-600 mt-1">
              ₹{totalValue.toLocaleString()}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending Approvals</p>
          {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : <p className="text-2xl font-bold text-orange-600 mt-1">{pendingApprovals}</p>}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Avg Order Value</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{totalOrders > 0 ? (totalValue / totalOrders).toLocaleString() : "0"}
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
                placeholder="Search orders..."
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending Payment</SelectItem>
              <SelectItem value="partial">Partial Payment</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="transit">In Transit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Order Number
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Dealer
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Product
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Order Value
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Payment Status
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Current Stage
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Progress
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-2 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-blue-600">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.dealer}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{order.product}</p>
                        <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{Number(order.totalValue).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.currentStage}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24">
                        <Progress value={order.stageProgress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {order.stageProgress}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.orderDate}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
