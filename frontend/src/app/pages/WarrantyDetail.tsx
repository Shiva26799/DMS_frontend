import { useParams, Link, useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, CheckCircle, Clock, Upload, Plus, Trash2, 
  Truck, Wrench, ChevronRight, ShieldCheck, FileText,
  Eye, Download, Info, Search
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "../components/ui/alert-dialog";
import { ProductCombobox } from "../components/ProductCombobox";
import { useWarranty, WarrantyClaim } from "../context/WarrantyContext";
import { useAuth } from "../context/AuthContext";

export function WarrantyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClaim, updateClaimStatus, uploadMedia } = useWarranty();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [extraData, setExtraData] = useState<any>({});
  const [note, setNote] = useState("");
  const [previewMedia, setPreviewMedia] = useState<{url: string, type: string} | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{status: string, payload?: any} | null>(null);

  const [partsList, setPartsList] = useState<{partName: string, partNumber: string, quantity: number}[]>([{ partName: "", partNumber: "", quantity: 1 }]);

  const loadClaim = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getClaim(id);
    setClaim(data);
    setIsLoading(false);
  }, [id, getClaim]);

  useEffect(() => { loadClaim(); }, [loadClaim]);

  const handleAdvanceStatus = async (nextStatus: string, payloadOverride?: any, skipConfirm = false) => {
    if (!claim) return;
    
    // Only require confirmation via AlertDialog if not explicitly skipped (e.g. from top bar jumps)
    if (!skipConfirm && (!pendingUpdate || pendingUpdate.status !== nextStatus)) {
      setPendingUpdate({ status: nextStatus, payload: payloadOverride });
      setIsConfirmOpen(true);
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await updateClaimStatus(claim._id, {
        status: nextStatus,
        note: note || `Claim advanced to ${nextStatus}`,
        extraData: payloadOverride || extraData
      });
      setNote("");
      setExtraData({});
      setClaim(updated);
      setPendingUpdate(null);
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!claim || !e.target.files?.length) return;
    try {
      setIsUpdating(true);
      const currentNotes = extraData.inspectionNotes || extraData.evaluationNotes || extraData.hoNotes || "";
      let latestClaim = claim;
      for (let i = 0; i < e.target.files.length; i++) {
         latestClaim = await uploadMedia(claim._id, e.target.files[i], claim.status, currentNotes);
      }
      setClaim(latestClaim);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="p-6 space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!claim) return <div className="p-6 text-center"><h2 className="text-xl font-semibold">Claim not found</h2><Link to="/warranty" className="text-blue-600 mt-2 inline-block">Back to Warranty Claims</Link></div>;

  const STAGES = [
    "Complaint Received", "Technician Assigned", "Initial Inspection", 
    "LOVOL Review", "HO Review", "Claim Approved", "Parts Processing", 
    "Parts Dispatched", "Parts Received", "Repair & Collection", "Closed"
  ];
  const currentStageIndex = STAGES.indexOf(claim.status);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/warranty")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{claim.claimNumber}</h1>
            <p className="text-sm text-gray-600">Created on {new Date(claim.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Progress Stepper - UI ALIGNMENT FIXED */}
      <Card className="p-6 overflow-x-auto">
        <div className="flex items-start min-w-[800px]">
          {STAGES.map((stage, index) => (
            <div 
              key={stage} 
              className={`flex-1 relative flex flex-col items-center group ${isSuperAdmin ? "cursor-pointer" : ""}`}
              onClick={() => isSuperAdmin && !isUpdating && handleAdvanceStatus(stage)}
              title={isSuperAdmin ? `Jump to ${stage}` : ""}
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

            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm space-y-6">
              {user?.role === "Distributor" && claim.buyerType === "Dealer" ? (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
                  <strong>Read-Only Access:</strong> You are viewing a claim submitted by one of your dealers. 
                  Distributors cannot modify or advance claims on behalf of dealers.
                </div>
              ) : (
                <>
              {claim.status === "Complaint Received" && (
                <div className="space-y-4">
                  <p className="text-sm">A customer complaint has been received. Please assign a technician to begin the inspection process.</p>
                  <div className="space-y-2">
                    <Label>Technician Name</Label>
                    <Input placeholder="Enter name..." onChange={(e) => setExtraData({ technicianName: e.target.value })} />
                  </div>
                  <Button className="w-full" onClick={() => handleAdvanceStatus("Technician Assigned", null, true)} disabled={isUpdating || !extraData.technicianName}>
                    Assign Technician <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "Technician Assigned" && (
                <div className="space-y-4 text-center py-4">
                  <Wrench className="w-12 h-12 text-blue-600 mx-auto" />
                  <p className="text-sm">Technician <b>{claim.technicianName}</b> has been assigned. Move to the next stage when the initial inspection is ready to be documented.</p>
                  <Button className="w-full" onClick={() => handleAdvanceStatus("Initial Inspection", null, true)} disabled={isUpdating}>
                    Start Inspection Document <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "Initial Inspection" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Inspection Findings & Machine Condition</Label>
                    <textarea className="w-full min-h-[100px] p-3 text-sm border rounded-md" placeholder="Detail the issue found..." onChange={(e) => setExtraData({ inspectionNotes: e.target.value })} />
                  </div>
                  <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-2">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-500">Upload Photos/Videos of the issue (Max 10MB)</p>
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" className="relative cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" /> Upload Media
                        <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleAdvanceStatus("LOVOL Review", null, true)} disabled={isUpdating || !extraData.inspectionNotes}>
                    Send for LOVOL Review <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "LOVOL Review" && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-blue-800 bg-blue-50 p-3 rounded-md">Evaluation Phase (LOVOL India Role)</p>
                  <div className="space-y-2">
                    <Label>Evaluation Notes</Label>
                    <textarea className="w-full min-h-[100px] p-3 text-sm border rounded-md" placeholder="Add technical evaluation..." onChange={(e) => setExtraData({ evaluationNotes: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Exclusively restricted form options check */}
                    {isSuperAdmin ? (
                      <>
                        <Button variant="destructive" onClick={() => handleAdvanceStatus("Rejected", null, true)}>Reject Claim</Button>
                        <Button onClick={() => handleAdvanceStatus("HO Review", null, true)} disabled={isUpdating || !extraData.evaluationNotes}>
                          Coordinate with HO <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    ) : (
                      <div className="col-span-2 text-center text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
                        Awaiting HO (Super Admin) review and decision.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {claim.status === "HO Review" && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-purple-800 bg-purple-50 p-3 rounded-md">Head Office Detailed Inspection Phase</p>
                  <div className="space-y-2">
                    <Label>HO Approval Notes</Label>
                    <textarea className="w-full min-h-[100px] p-3 text-sm border rounded-md" placeholder="HO feedback..." onChange={(e) => setExtraData({ hoNotes: e.target.value })} />
                  </div>
                  {isSuperAdmin ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="destructive" onClick={() => handleAdvanceStatus("Rejected", null, true)}>HO Rejection</Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAdvanceStatus("Claim Approved", null, true)} disabled={isUpdating || !extraData.hoNotes}>
                        HO Approval <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
                      This stage requires HO (Super Admin) approval.
                    </div>
                  )}
                </div>
              )}

              {claim.status === "Claim Approved" && (
                <div className="space-y-4 text-center">
                  <ShieldCheck className="w-16 h-16 text-green-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-green-700">HO APPROVED</p>
                    <p className="text-sm text-gray-600">The claim has been approved. Proceed to specify required parts for replacement.</p>
                  </div>
                  <Button className="w-full" onClick={() => handleAdvanceStatus("Parts Processing", null, true)}>
                    Start Parts Processing <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {claim.status === "Parts Processing" && (
                 <div className="space-y-4">
                    <p className="text-sm">Specify the parts to be dispatched (Free of Cost - FOC).</p>
                    <div className="space-y-4">
                      {partsList.map((part, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row items-center gap-2">
                          <div className="flex-1 w-full md:w-1/2">
                            <ProductCombobox 
                              placeholder="Search part name..."
                              onSelect={(selected: any) => {
                                if (!selected) return;
                                const newParts = [...partsList];
                                newParts[idx].partName = selected.name;
                                newParts[idx].partNumber = selected.partNumber || selected.sku || "";
                                setPartsList(newParts);
                              }}
                            />
                          </div>
                          <Input placeholder="Part Number" className="md:w-1/3" value={part.partNumber} onChange={(e) => { const newParts = [...partsList]; newParts[idx].partNumber = e.target.value; setPartsList(newParts); }} />
                          <Input type="number" min="1" placeholder="Qty" className="w-full md:w-20" value={part.quantity} onChange={(e) => { const newParts = [...partsList]; newParts[idx].quantity = Number(e.target.value); setPartsList(newParts); }} />
                          {partsList.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => setPartsList(partsList.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setPartsList([...partsList, { partName: "", partNumber: "", quantity: 1 }])}>
                        <Plus className="w-4 h-4 mr-2" /> Add Another Part
                      </Button>
                    </div>
                    <Button className="w-full" onClick={() => handleAdvanceStatus("Parts Dispatched", { ...extraData, parts: partsList.filter(p => p.partName && p.partNumber && p.quantity > 0) }, true)} disabled={isUpdating || partsList.some(p => !p.partName || !p.partNumber || p.quantity < 1)}>
                      Dispatch Parts <Truck className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              )}

              {claim.status === "Parts Dispatched" && (
                <div className="space-y-4">
                   <p className="text-sm">Transit Information</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Courier/Transport Name</Label><Input placeholder="e.g. DHL" onChange={(e) => setExtraData({...extraData, transportName: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Waybill/Tracking ID</Label><Input placeholder="TRK123..." onChange={(e) => setExtraData({...extraData, trackingId: e.target.value})} /></div>
                   </div>
                   <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">Awaiting dealer confirmation of receipt and installation.</p>
                   <Button className="w-full" onClick={() => handleAdvanceStatus("Parts Received", null, true)} disabled={isUpdating || !extraData.transportName}>
                     Confirm Parts Shipped <ChevronRight className="w-4 h-4 ml-2" />
                   </Button>
                </div>
              )}

              {claim.status === "Parts Received" && (
                <div className="space-y-4 text-center py-4">
                   <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                   <p className="text-sm font-bold text-gray-900">Awaiting Part Receipt Confirmation</p>
                   <p className="text-sm text-gray-600">Confirm receipt of specific parts.</p>
                   <Button className="w-full mt-4" onClick={() => handleAdvanceStatus("Repair & Collection", null, true)} disabled={isUpdating}>
                     Confirm Parts Received <CheckCircle className="w-4 h-4 ml-2" />
                   </Button>
                </div>
              )}

              {claim.status === "Repair & Collection" && (
                <div className="space-y-4">
                  {isSuperAdmin ? (
                    <>
                      <div className="space-y-2">
                        <Label>Repair Details & Confirmation (Super Admin Only)</Label>
                        <textarea className="w-full min-h-[100px] p-3 text-sm border rounded-md" placeholder="Note down repair findings..." onChange={(e) => setExtraData({ ...extraData, installationNotes: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                        <input type="checkbox" id="collect" onChange={(e) => setExtraData({...extraData, damagedPartsCollected: e.target.checked})} />
                        <label htmlFor="collect" className="text-sm">I confirm that damaged parts have been collected</label>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleAdvanceStatus("Closed", null, true)} disabled={isUpdating || !extraData.installationNotes || !extraData.damagedPartsCollected}>
                        Final Closure <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  ) : (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
                      Only Super Administrators can perform the final repair closure and collection confirmation.
                    </div>
                  )}
                </div>
              )}

              {claim.status === "Closed" && (
                <div className="text-center py-8">
                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                   <h4 className="text-xl font-bold">Lifecycle Completed</h4>
                   <p className="text-sm text-gray-500 mt-2">This claim has been successfully resolved and closed.</p>
                </div>
              )}
                </>
              )}
            </div>
          </Card>

          {/* Info Tabs */}
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="bg-gray-50/50 p-1 flex-wrap h-auto justify-start">
              <TabsTrigger value="overview" className="rounded-xl px-4 md:px-6 py-2.5">Overview</TabsTrigger>
              <TabsTrigger value="insights" className="rounded-xl px-4 md:px-6 py-2.5">Insights & Details</TabsTrigger>
              <TabsTrigger value="evidence" className="rounded-xl px-4 md:px-6 py-2.5">Evidence ({claim.media.length})</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl px-4 md:px-6 py-2.5">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Historic Data & Context</h3>
                {!(claim.inspectionNotes || claim.evaluationNotes || claim.hoApproval?.notes || claim.dispatchDetails?.trackingId || claim.installationNotes) && (
                   <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                     No insights or context details have been recorded yet.
                   </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {claim.inspectionNotes && (
                     <Card className="p-4 border-l-4 border-l-gray-500 bg-gray-50"><h4 className="text-sm font-bold mb-2">Initial Inspection</h4><p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{claim.inspectionNotes}</p></Card>
                   )}
                   {claim.evaluationNotes && (
                     <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/30"><h4 className="text-sm font-bold mb-2">LOVOL Evaluation</h4><p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{claim.evaluationNotes}</p></Card>
                   )}
                   {claim.hoApproval?.notes && (
                     <Card className="p-4 border-l-4 border-l-purple-500 bg-purple-50/30"><h4 className="text-sm font-bold mb-2">HO Review Notes</h4><p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{claim.hoApproval.notes}</p></Card>
                   )}
                   {claim.dispatchDetails?.trackingId && (
                     <Card className="p-4 border-l-4 border-l-green-500 bg-green-50/30"><h4 className="text-sm font-bold mb-2">Tracking & Shipping</h4><p className="text-sm text-gray-700">Carrier: {claim.dispatchDetails.transportName}<br/>TRK: {claim.dispatchDetails.trackingId}</p></Card>
                   )}
                   {claim.installationNotes && (
                     <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50/30"><h4 className="text-sm font-bold mb-2">Repair Notes</h4><p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{claim.installationNotes}</p></Card>
                   )}
                   {claim.partsRequested && claim.partsRequested.length > 0 && (
                     <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/30 md:col-span-2 lg:col-span-3">
                        <h4 className="text-sm font-bold mb-4">Approved Parts for Dispatch</h4>
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-orange-100/50 text-gray-700"><tr><th className="p-2">Part Name</th><th className="p-2">Part Number</th><th className="p-2 text-center">Qty</th><th className="p-2">Status</th></tr></thead>
                              <tbody className="divide-y divide-orange-100">
                                 {claim.partsRequested.map((part: any, idx: number) => (
                                    <tr key={idx}><td className="p-2 font-medium">{part.partName}</td><td className="p-2 font-mono text-gray-600">{part.partNumber}</td><td className="p-2 text-center">{part.quantity}</td><td className="p-2"><span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-gray-100">{part.status || "Pending"}</span></td></tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </Card>
                   )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="mt-4 space-y-4">
               <Card className="p-6">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Machine Details</h4>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500">Model Name</div><div className="font-medium text-right">{claim.productId?.name}</div>
                    <div className="text-gray-500">Machine Serial Number</div><div className="font-mono font-medium text-right">{claim.machineSerialNumber}</div>
                    <div className="text-gray-500">Engine Number</div><div className="font-mono font-medium text-right">{claim.engineNumber || "N/A"}</div>
                    <div className="text-gray-500 pt-4 border-t">Customer Name</div><div className="font-medium text-right pt-4 border-t">{claim.customerName || "—"}</div>
                    <div className="text-gray-500">Dealer/Filer</div><div className="font-medium text-right">{claim.dealerId?.companyName || claim.dealerId?.name}</div>
                    <div className="text-gray-500">Distributor</div><div className="font-medium text-right">{claim.distributorId?.name || "—"}</div>
                  </div>
               </Card>
               <Card className="p-6">
                  <h4 className="font-bold mb-4">Initial Complaint</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg italic underline decoration-blue-200">"{claim.issueDescription}"</p>
               </Card>
            </TabsContent>

            <TabsContent value="evidence" className="mt-4">
              <Card className="p-6">
                 {claim.media.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><Upload className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No media uploaded yet</p></div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {claim.media.map((m, i) => (
                        <div key={i} className="group relative bg-gray-50 rounded-xl overflow-hidden border shadow-sm flex flex-col">
                          <div className="aspect-video bg-gray-100 flex-shrink-0 relative group">
                            {m.type === "video" ? (<video src={m.url} controls className="w-full h-full object-cover" />) : (<img src={m.url} className="w-full h-full object-cover" />)}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                               <button onClick={() => setPreviewMedia({url: m.url, type: m.type})} className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"><Eye className="w-4 h-4" /></button>
                               <a href={m.url} download className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"><Download className="w-4 h-4" /></a>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">{m.stage || "Initial Upload"}</span>
                                <span className="text-xs text-gray-400">{new Date(m.uploadedAt).toLocaleDateString()}</span>
                             </div>
                             {m.notes && (<p className="text-sm text-gray-600 mt-1 italic leading-tight">"{m.notes}"</p>)}
                          </div>
                        </div>
                      ))}
                   </div>
                 )}
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card className="p-6">
                {/* ACTIVITY LOG LINE REMOVED HERE ALONG WITH GAP-4 FLEX FIX */}
                <div className="space-y-6">
                   {claim.activityLog.map((log, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-4 h-4 mt-1 shrink-0 rounded-full bg-white border-2 border-blue-500" />
                        <div className="flex-1 flex justify-between items-start">
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
                       <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${claim.stageProgress}%` }} />
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
                {claim.partsRequested && claim.partsRequested.length > 0 && (
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

      {/* Full Screen Media Preview */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6" onClick={() => setPreviewMedia(null)}>
           <Button variant="outline" className="absolute top-4 right-4 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white" onClick={() => setPreviewMedia(null)}>Close</Button>
           {previewMedia.type === "video" ? (
             <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
           ) : (
             <img src={previewMedia.url} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
           )}
        </div>
      )}

      {/* Advance Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Change Warranty Stage?</AlertDialogTitle>
               <AlertDialogDescription>
                  You are about to move this claim to the <strong>{pendingUpdate?.status}</strong> stage. 
                  This will update the claim lifecycle and visible actions. Do you wish to proceed?
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel onClick={() => { setIsConfirmOpen(false); setPendingUpdate(null); }}>Cancel</AlertDialogCancel>
               <AlertDialogAction onClick={() => { if (pendingUpdate) { handleAdvanceStatus(pendingUpdate.status, pendingUpdate.payload, true); } }} className="bg-blue-600 hover:bg-blue-700">
                  Confirm & Change Stage
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
