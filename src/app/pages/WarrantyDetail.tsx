import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockWarrantyClaims } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";
import { useWarranty } from "../context/WarrantyContext";
import { useDealers } from "../context/DealerContext";

export function WarrantyDetail() {
  const { id } = useParams();
  const { claims } = useWarranty();
  const { getDealer } = useDealers();
  
  const claim = claims.find((c) => c.id === id);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!claim) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Warranty claim not found
          </h2>
          <Link
            to="/warranty"
            className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >
            Back to Warranty Claims
          </Link>
        </div>
      </div>
    );
  }

  const warrantyStages = [
    { name: "Submitted", status: "completed" },
    {
      name: "Under Review",
      status:
        claim.status === "Under Review" ||
        claim.status === "Approved" ||
        claim.status === "Dispatch" ||
        claim.status === "Installed" ||
        claim.status === "Closed"
          ? "completed"
          : claim.status === "Submitted"
          ? "current"
          : "pending",
    },
    {
      name: "Approved",
      status:
        claim.status === "Approved" ||
        claim.status === "Dispatch" ||
        claim.status === "Installed" ||
        claim.status === "Closed"
          ? "completed"
          : claim.status === "Under Review"
          ? "current"
          : "pending",
    },
    {
      name: "Dispatch",
      status:
        claim.status === "Dispatch" ||
        claim.status === "Installed" ||
        claim.status === "Closed"
          ? "completed"
          : claim.status === "Approved"
          ? "current"
          : "pending",
    },
    {
      name: "Installed",
      status:
        claim.status === "Installed" || claim.status === "Closed"
          ? "completed"
          : claim.status === "Dispatch"
          ? "current"
          : "pending",
    },
    {
      name: "Closed",
      status: claim.status === "Closed" ? "completed" : "pending",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/warranty">
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
                {claim.claimNumber}
              </h1>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Submitted on {claim.submittedDate}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Warranty Validation Alert */}
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : claim.warrantyValid ? (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Warranty is Valid
              </p>
              <p className="text-xs text-green-700">
                Product is within warranty period
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Warranty Expired
              </p>
              <p className="text-xs text-red-700">
                This product is no longer covered under warranty
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Tracker */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Claim Progress
        </h3>
        <div className="flex items-center justify-between">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex-1 text-center relative">
                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))
          ) : (
            warrantyStages.map((stage, index) => (
              <div key={index} className="flex-1 text-center relative">
                <div className="flex items-center justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
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
                </div>
                <p
                  className={`text-xs mt-2 ${
                    stage.status === "completed"
                      ? "text-green-600 font-medium"
                      : stage.status === "current"
                      ? "text-blue-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {stage.name}
                </p>
                {index < warrantyStages.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 w-full h-0.5 ${
                      stage.status === "completed"
                        ? "bg-green-300"
                        : "bg-gray-300"
                    }`}
                    style={{ zIndex: -1 }}
                  ></div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Claim Details</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Information
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Product Name", value: claim.productName },
                    { label: "Serial Number", value: claim.productSerial, mono: true },
                    { label: "Purchase Date", value: claim.purchaseDate },
                    { label: "Dealer", value: claim.dealer }
                  ].map((info, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-sm text-gray-600">{info.label}</span>
                      {isLoading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <span className={`text-sm font-medium ${info.mono ? "font-mono" : ""} text-gray-900`}>
                          {info.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Issue Description
                </h3>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">{claim.issueDescription}</p>
                )}
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resolution Notes
                </h3>
                <Textarea
                  placeholder="Add resolution notes..."
                  className="mb-4 min-h-[120px] bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-gray-200"
                />
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-6">
                  Add Note
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Uploaded Media
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-gray-500">Image 1</p>
                  </div>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-gray-500">Image 2</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Claim submitted by dealer
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {claim.submittedDate}
                      </p>
                    </div>
                  </div>
                  {claim.status !== "Submitted" && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Claim moved to under review
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {claim.submittedDate}
                        </p>
                      </div>
                    </div>
                  )}
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
              {claim.status === "Submitted" && (
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  Move to Review
                </Button>
              )}
              {claim.status === "Under Review" && (
                <>
                  <Button className="w-full justify-center bg-green-600 hover:bg-green-700 text-white">
                    Approve Claim
                  </Button>
                  <Button
                    className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    variant="outline"
                  >
                    Reject Claim
                  </Button>
                </>
              )}
              {claim.status === "Approved" && (
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  Mark as Dispatched
                </Button>
              )}
              {claim.status === "Dispatch" && (
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  Mark as Installed
                </Button>
              )}
              {claim.status === "Installed" && (
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  Close Claim
                </Button>
              )}
              <Button className="w-full justify-start" variant="outline">
                Send Notification
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Download Report
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Claim Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Status</span>
                {isLoading ? <Skeleton className="h-6 w-20 rounded-full" /> : <StatusBadge status={claim.status} />}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Warranty</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : claim.warrantyValid ? (
                  <span className="text-sm font-medium text-green-600">
                    Valid
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-600">
                    Expired
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Submitted</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="text-sm font-medium text-gray-900">
                    {claim.submittedDate}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
