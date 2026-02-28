import { useParams, Link } from "react-router";
import { ArrowLeft, Package, IndianRupee, Calendar, Wrench } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { mockProducts } from "../data/mockData";
import { Badge } from "../components/ui/badge";

export function ProductDetail() {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Products
          </Link>
        </div>
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
            <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
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
          {/* Product Image Placeholder */}
          <Card className="p-6">
            <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-32 h-32 text-blue-600" />
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Product Description
            </h3>
            <p className="text-sm text-gray-600">{product.description}</p>
          </Card>

          {/* Specifications */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{key}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Details & Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Product Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(product.price / 100000).toFixed(2)}L
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Stock Available</p>
                  <p className="text-lg font-bold text-gray-900">
                    {product.stockAvailable} units
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Warranty Period</p>
                  <p className="text-sm font-medium text-gray-900">
                    {product.warrantyPeriod}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Service Schedule</p>
                  <p className="text-sm font-medium text-gray-900">
                    {product.serviceSchedule}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                Create Order
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Update Stock
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Edit Product
              </Button>
              <Button className="w-full justify-start" variant="outline">
                View Inventory
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Download Brochure
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stock Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Factory</span>
                <span className="text-sm font-medium text-green-600">
                  {Math.floor(product.stockAvailable * 0.6)} units
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Regional Warehouses</span>
                <span className="text-sm font-medium text-green-600">
                  {Math.floor(product.stockAvailable * 0.3)} units
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dealer Warehouses</span>
                <span className="text-sm font-medium text-yellow-600">
                  {Math.floor(product.stockAvailable * 0.1)} units
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
