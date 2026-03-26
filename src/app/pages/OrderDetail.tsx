import { useParams, Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, FileText, Upload, CheckCircle, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockOrders, mockDealers } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { useOrders } from "../context/OrderContext";
import { useDealers } from "../context/DealerContext";

import { Skeleton } from "../components/ui/skeleton";

export function OrderDetail() {
  const { id } = useParams();
  const { orders } = useOrders();
  const { getDealer } = useDealers();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const order = useMemo(() => {
    return (orders as any[]).find((o) => o.id === id || o._id === id) || (mockOrders as any[]).find((o) => o.id === id || o._id === id);
  }, [orders, id]);

  const dealer = useMemo(() => {
    if (!order) return null;
    const dId = order.dealerId;
    return (getDealer(dId) as any) || (mockDealers as any[]).find((d) => d._id === dId);
  }, [order, getDealer]);

  if (!order || !dealer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
          <Link to="/orders" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const orderStages = [
    { name: "PO Upload", status: "completed" },
    { name: "Payment Upload", status: order.stageProgress >= 30 ? "completed" : "pending" },
    { name: "Payment Verification", status: order.stageProgress >= 40 ? "completed" : order.stageProgress >= 30 ? "current" : "pending" },
    { name: "Order Approval", status: order.stageProgress >= 50 ? "completed" : order.stageProgress >= 40 ? "current" : "pending" },
    { name: "Invoice Generation", status: order.stageProgress >= 60 ? "completed" : order.stageProgress >= 50 ? "current" : "pending" },
    { name: "Delivery", status: order.stageProgress >= 80 ? "completed" : order.stageProgress >= 60 ? "current" : "pending" },
    { name: "Installation", status: order.stageProgress >= 90 ? "completed" : order.stageProgress >= 80 ? "current" : "pending" },
    { name: "Warranty Registration", status: order.stageProgress >= 95 ? "completed" : order.stageProgress >= 90 ? "current" : "pending" },
    { name: "Closure", status: order.stageProgress === 100 ? "completed" : order.stageProgress >= 95 ? "current" : "pending" },
  ];

  const activities = [
    { date: order.orderDate, user: "Dealer", action: "Order created and PO uploaded" },
    { date: order.orderDate, user: "Dealer", action: "Payment receipt uploaded" },
    { date: order.orderDate, user: "System", action: "Awaiting payment verification" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 mb-1" />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">
                {order.orderNumber}
              </h1>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Order Date: {order.orderDate}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={order.paymentStatus} />
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Dealer", value: order.dealer },
          { label: "Order Value", value: `₹${(order.totalValue / 100000).toFixed(1)}L` },
          { label: "Payment Status", value: order.paymentStatus, isBadge: true },
          { label: "Delivery Status", value: order.deliveryStatus }
        ].map((card, i) => (
          <Card key={i} className="p-4">
            <p className="text-sm text-gray-600">{card.label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : card.isBadge ? (
              <div className="mt-1">
                <StatusBadge status={card.value} />
              </div>
            ) : (
              <p className="text-lg font-semibold text-gray-900 mt-1">{card.value}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Progress Tracker */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Order Progress
        </h3>
        <div className="mb-4">
          {isLoading ? (
            <>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-64 mt-2" />
            </>
          ) : (
            <>
              <Progress value={order.stageProgress} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">
                {order.stageProgress}% Complete - Current Stage: {order.currentStage}
              </p>
            </>
          )}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 mt-6">
          {isLoading ? (
            Array(9).fill(0).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))
          ) : (
            orderStages.map((stage, index) => (
              <div key={index} className="text-center">
                <div
                  className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                    stage.status === "completed"
                      ? "bg-green-100"
                      : stage.status === "current"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  }`}
                >
                  {stage.status === "completed" ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : stage.status === "current" ? (
                    <Clock className="w-6 h-6 text-blue-600" />
                  ) : (
                    <span className="text-sm font-medium text-gray-400">
                      {index + 1}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs ${
                    stage.status === "completed"
                      ? "text-green-600 font-medium"
                      : stage.status === "current"
                      ? "text-blue-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {stage.name}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product</span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.product}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantity</span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unit Price</span>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{(order.totalValue / order.quantity / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 border-t">
                    <span className="text-sm font-semibold text-gray-900">
                      Total Value
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{(order.totalValue / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Dealer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Dealer Name</p>
                    <p className="text-sm font-medium text-gray-900">{dealer.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dealer Code</p>
                    <p className="text-sm font-medium text-gray-900">{dealer.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {dealer.city}, {dealer.region || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="text-sm font-medium text-gray-900">{dealer.contact || dealer.phone || "N/A"}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Purchase Order
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded on {order.orderDate}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Payment Receipt
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded on {order.orderDate}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload additional documents
                    </p>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.date} • by {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Admin Actions
            </h3>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                Approve Payment
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Request Documents
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Update Status
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Generate Invoice
              </Button>
              <Button className="w-full justify-start text-red-600" variant="outline">
                Cancel Order
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery</span>
                <span className="text-sm font-medium text-gray-900">
                  {order.deliveryStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-blue-600">
                  {order.stageProgress}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
