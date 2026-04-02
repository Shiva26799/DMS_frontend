import { useParams, Link, useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  Plus, 
  Trash2, 
  Truck, 
  Wrench,
  ChevronRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useWarranty, WarrantyClaim } from "../context/WarrantyContext";
import { useAuth } from "../context/AuthContext";

export function WarrantyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClaim, updateClaimStatus, uploadMedia } = useWarranty();
  const { isAdmin } = useAuth();
  
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Dynamic form states
  const [extraData, setExtraData] = useState<any>({});
  const [note, setNote] = useState("");

  const loadClaim = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getClaim(id);
    setClaim(data);
    setIsLoading(false);
  }, [id, getClaim]);

  useEffect(() => {
    loadClaim();
  }, [loadClaim]);

  const handleAdvanceStatus = async (nextStatus: string) => {
    if (!claim) return;
    try {
      setIsUpdating(true);
      await updateClaimStatus(claim._id, {
        status: nextStatus,
        note: note || `Claim advanced to ${nextStatus}`,
        extraData
      });
      setNote("");
      setExtraData({});
      await loadClaim();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!claim || !e.target.files?.[0]) return;
    try {
      setIsUpdating(true);
      await uploadMedia(claim._id, e.target.files[0]);
      await loadClaim();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!claim) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Claim not found</h2>
        <Link to="/warranty" className="text-blue-600 mt-2 inline-block">Back to Warranty Claims</Link>
      </div>
    );
  }

  const STAGES = [
    "Complaint Received",
    "Technician Assigned",
    "Initial Inspection",
    "LOVOL Review",
    "HO Review",
    "Claim Approved",
    "Parts Processing",
    "Parts Dispatched",
    "Repair & Collection",
    "Closed"
  ];

  const currentStageIndex = STAGES.indexOf(claim.status);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/warranty")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{claim.claimNumber}</h1>
            <p className="text-sm text-gray-600">Created on {new Date(claim.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Progress Stepper */}
      <Card className="p-6 overflow-x-auto">
        <div className="flex items-center min-w-[800px]">
          {STAGES.map((stage, index) => (
            <div 
              key={stage} 
              className={`flex-1 relative flex flex-col items-center group ${isAdmin ? "cursor-pointer" : ""}`}
              onClick={() => isAdmin && !isUpdating && handleAdvanceStatus(stage)}
              title={isAdmin ? `Jump to ${stage}` : ""}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all
                ${index < currentStageIndex ? "bg-green-500 text-white group-hover:bg-green-600" : 
                  index === currentStageIndex ? "bg-blue-600 text-white ring-4 ring-blue-100" : 
                  "bg-gray-200 text-gray-500 group-hover:bg-gray-300"}`}>
                {index < currentStageIndex ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <p className={`text-[10px] mt-2 font-medium text-center px-1 transition-colors
                ${index === currentStageIndex ? "text-blue-600 font-bold" : "text-gray-500 font-normal group-hover:text-gray-700"}`}>
                {stage}
              </p>
              {index < STAGES.length - 1 && (
                <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0
                  ${index < currentStageIndex ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Process Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Stage Card */}
          <Card className="p-6 border-2 border-blue-50 bg-blue-50/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Current Action: {claim.status}</h3>
                <p className="text-sm text-gray-600">Follow the steps below to advance the claim to the next lifecycle stage.</p>
              </div>
            </div>

            {/* Dynamic Stage Content */}
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm space-y-6">
              {claim.status === "Complaint Received" && (
                <div className="space-y-4">
                  <p className="text-sm">A customer complaint has been received. Please assign a technician to begin the inspection process.</p>
                  <div className="space-y-2">
                    <Label>Technician Name</Label>
                    <Input 
                      placeholder="Enter name..." 
                      onChange={(e) => setExtraData({ technicianName: e.target.value })}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAdvanceStatus("Technician Assigned")}
                    disabled={isUpdating || !extraData.technicianName}
                  >
                    Assign Technician <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "Technician Assigned" && (
                <div className="space-y-4 text-center py-4">
                  <Wrench className="w-12 h-12 text-blue-600 mx-auto" />
                  <p className="text-sm">Technician <b>{claim.technicianName}</b> has been assigned. Move to the next stage when the initial inspection is ready to be documented.</p>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAdvanceStatus("Initial Inspection")}
                    disabled={isUpdating}
                  >
                    Start Inspection Document <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "Initial Inspection" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Inspection Findings & Machine Condition</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 text-sm border rounded-md" 
                      placeholder="Detail the issue found..."
                      onChange={(e) => setExtraData({ inspectionNotes: e.target.value })}
                    />
                  </div>
                  <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-2">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-500">Upload Photos/Videos of the issue (Max 10MB)</p>
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" className="relative cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Media
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAdvanceStatus("LOVOL Review")}
                    disabled={isUpdating || !extraData.inspectionNotes}
                  >
                    Send for LOVOL Review <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "LOVOL Review" && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-blue-800 bg-blue-50 p-3 rounded-md">Evaluation Phase (LOVOL India Role)</p>
                  <div className="space-y-2">
                    <Label>Evaluation Notes</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 text-sm border rounded-md" 
                      placeholder="Add technical evaluation..."
                      onChange={(e) => setExtraData({ evaluationNotes: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="destructive" onClick={() => handleAdvanceStatus("Rejected")}>Reject Claim</Button>
                    <Button 
                      onClick={() => handleAdvanceStatus("HO Review")}
                      disabled={isUpdating || !extraData.evaluationNotes}
                    >
                      Coordinate with HO <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {claim.status === "HO Review" && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-purple-800 bg-purple-50 p-3 rounded-md">Head Office Detailed Inspection Phase</p>
                  <div className="space-y-2">
                    <Label>HO Approval Notes</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 text-sm border rounded-md" 
                      placeholder="HO feedback..."
                      onChange={(e) => setExtraData({ hoNotes: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="destructive" onClick={() => handleAdvanceStatus("Rejected")}>HO Rejection</Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAdvanceStatus("Claim Approved")}
                      disabled={isUpdating || !extraData.hoNotes}
                    >
                      HO Approval <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {claim.status === "Claim Approved" && (
                <div className="space-y-4 text-center">
                  <ShieldCheck className="w-16 h-16 text-green-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-green-700">HO APPROVED</p>
                    <p className="text-sm text-gray-600">The claim has been approved. Proceed to specify required parts for replacement.</p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAdvanceStatus("Parts Processing")}
                  >
                    Start Parts Processing <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "Parts Processing" && (
                 <div className="space-y-4">
                    <p className="text-sm">Specify the parts to be dispatched to the dealer (Free of Cost - FOC).</p>
                    <div className="space-y-4">
                      {/* Note: In a real app, this would be a dynamic list of inputs */}
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Part Name" id="p_name" />
                        <Input placeholder="Part Number" id="p_num" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full border-dashed">
                        <Plus className="w-4 h-4 mr-2" /> Add Another Part
                      </Button>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        const pName = (document.getElementById("p_name") as HTMLInputElement).value;
                        const pNum = (document.getElementById("p_num") as HTMLInputElement).value;
                        handleAdvanceStatus("Parts Dispatched");
                      }}
                      disabled={isUpdating}
                    >
                      Dispatch Parts <Truck className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              )}

              {claim.status === "Parts Dispatched" && (
                <div className="space-y-4">
                   <p className="text-sm">Transit Information</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Courier/Transport Name</Label>
                        <Input placeholder="e.g. DHL" onChange={(e) => setExtraData({...extraData, transportName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Waybill/Tracking ID</Label>
                        <Input placeholder="TRK123..." onChange={(e) => setExtraData({...extraData, trackingId: e.target.value})} />
                      </div>
                   </div>
                   <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">Awaiting dealer confirmation of receipt and installation.</p>
                   <Button 
                    className="w-full" 
                    onClick={() => handleAdvanceStatus("Repair & Collection")}
                    disabled={isUpdating || !extraData.transportName}
                   >
                     Confirm Delivery & Install <ChevronRight className="w-4 h-4 ml-2" />
                   </Button>
                </div>
              )}

              {claim.status === "Repair & Collection" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Repair Details & Confirmation</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 text-sm border rounded-md" 
                      placeholder="Note down repair findings..."
                      onChange={(e) => setExtraData({ ...extraData, installationNotes: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                     <input 
                      type="checkbox" 
                      id="collect" 
                      onChange={(e) => setExtraData({...extraData, damagedPartsCollected: e.target.checked})}
                    />
                     <label htmlFor="collect" className="text-sm">I confirm that damaged parts have been collected from the customer</label>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => handleAdvanceStatus("Closed")}
                    disabled={isUpdating || !extraData.installationNotes || !extraData.damagedPartsCollected}
                  >
                    Final Closure <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "Closed" && (
                <div className="text-center py-8">
                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                   </div>
                   <h4 className="text-xl font-bold">Lifecycle Completed</h4>
                   <p className="text-sm text-gray-500 mt-2">This claim has been successfully resolved and closed.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Info Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="bg-gray-100/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="media">Evidence ({claim.media.length})</TabsTrigger>
              <TabsTrigger value="history">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
               <Card className="p-6">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Machine Details</h4>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500">Model Name</div>
                    <div className="font-medium text-right">{claim.productId?.name}</div>
                    <div className="text-gray-500">Machine Serial Number</div>
                    <div className="font-mono font-medium text-right">{claim.machineSerialNumber}</div>
                    <div className="text-gray-500">Engine Number</div>
                    <div className="font-mono font-medium text-right">{claim.engineNumber || "N/A"}</div>
                    <div className="text-gray-500 border-t pt-4">Dealer Contact</div>
                    <div className="font-medium text-right border-t pt-4">{claim.dealerId?.companyName}</div>
                  </div>
               </Card>

               <Card className="p-6">
                  <h4 className="font-bold mb-4">Initial Complaint</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg italic underline decoration-blue-200">
                    "{claim.issueDescription}"
                  </p>
               </Card>
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              <Card className="p-6">
                 {claim.media.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No media uploaded yet</p>
                    </div>
                 ) : (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {claim.media.map((m, i) => (
                        <div key={i} className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                          <img src={m.url} className="w-full h-full object-cover" />
                        </div>
                      ))}
                   </div>
                 )}
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card className="p-6">
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                   {claim.activityLog.map((log, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{log.action}</p>
                            <p className="text-sm text-gray-600">{log.note}</p>
                            <p className="text-xs text-gray-400 mt-1">by {log.performedBy}</p>
                          </div>
                          <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                   )).reverse()}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Status Summary */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none">
            <h3 className="text-lg font-bold mb-4">Registration Status</h3>
            <div className="space-y-4">
               <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-white/60">Warranty Verification</p>
                    <p className="text-sm font-medium">Valid Coverage</p>
                  </div>
               </div>
               <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-white/60 mb-2">Completion Progress</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${claim.stageProgress}%` }} 
                       />
                    </div>
                    <span className="text-sm font-bold">{claim.stageProgress}%</span>
                  </div>
               </div>
            </div>
          </Card>

          <Card className="p-6">
             <h4 className="font-bold mb-4">Technical Details</h4>
             <div className="space-y-4 text-sm">
                <div className="pb-4 border-b">
                   <p className="text-gray-500">Technician</p>
                   <p className="font-medium">{claim.technicianName || "Awaiting Assignment"}</p>
                </div>
                {claim.partsRequested.length > 0 && (
                   <div className="pb-4 border-b">
                      <p className="text-gray-500">Parts Status</p>
                      <div className="mt-2 space-y-1">
                         {claim.partsRequested.map((p: any, i: number) => (
                           <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span className="text-xs">{p.partName}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">{p.status}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
                {claim.dispatchDetails?.trackingId && (
                   <div className="pb-4 border-b">
                      <p className="text-gray-500">Tracking Info</p>
                      <p className="font-medium text-blue-600 cursor-pointer hover:underline">{claim.dispatchDetails.trackingId}</p>
                      <p className="text-xs text-gray-400 mt-1">{claim.dispatchDetails.transportName}</p>
                   </div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
