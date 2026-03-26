import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockOrders, mockDealers, mockProducts } from "../data/mockData";
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
    productId: "",
    quantity: "1",
  });

  const handleCreateOrder = () => {
    const selectedDealer = dealers.find((d) => d._id === formData.dealerId);
    const selectedProduct = mockProducts.find((p) => p.id === formData.productId);

    if (!selectedDealer || !selectedProduct) return;

    const quantity = Number(formData.quantity) || 1;
    const totalOrderValue = selectedProduct.price * quantity;

    const newOrder: any = {
      _id: `ORD${Date.now()}`,
      id: `ORD${Date.now()}`, // Keep both for safety across different mock formats
      orderNumber: `ORD-2026-${(orders.length + 1).toString().padStart(3, "0")}`,
      dealer: selectedDealer.companyName,
      dealerId: selectedDealer._id,
      product: `${selectedProduct.name} (x${quantity})`,
      quantity: quantity,
      totalValue: totalOrderValue,
      orderDate: new Date().toISOString().split("T")[0],
      paymentStatus: "Pending",
      deliveryStatus: "Processing",
      currentStage: "Order Approval",
      stageProgress: 10,
    };

    addOrder(newOrder);
    setFormData({
      dealerId: "",
      productId: "",
      quantity: "1",
    });
    setIsDialogOpen(false);
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
  const totalValue = orders.reduce((sum, order) => sum + order.totalValue, 0);
  const pendingApprovals = orders.filter(
    (o) => o.currentStage === "Payment Verification" || o.currentStage === "Order Approval"
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="dealer">Select Dealer</Label>
                <Select
                  value={formData.dealerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dealerId: value })
                  }
                >
                  <SelectTrigger id="dealer">
                    <SelectValue placeholder="Choose a dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealers.map((d) => (
                      <SelectItem key={d._id} value={d._id}>
                        {d.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product">Select Product</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productId: value })
                  }
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (₹{(p.price / 100000).toFixed(1)}L)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateOrder}
              >
                Create Order
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
              ₹{(totalValue / 10000000).toFixed(1)}Cr
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
              ₹{(totalValue / totalOrders / 100000).toFixed(1)}L
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
                    ₹{(order.totalValue / 100000).toFixed(1)}L
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
