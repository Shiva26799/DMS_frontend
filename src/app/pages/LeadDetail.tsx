import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, Loader2, CheckCircle2, Clock, UserCheck, Plus, RefreshCw, User, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Skeleton } from "../components/ui/skeleton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { Lead } from "./LeadManagement";
import { formatCurrency } from "../utils/currency";
import {
  useLeadDetail,
  useUpdateLeadStatus,
  useAssignLeadDealer,
  useAddLeadFollowUp,
  useUpdateLead,
  useMarkFollowUpCompleted,
  useCreateOrder,
  useDeleteLead
} from "../hooks/useLeads";
import { useDealers } from "../hooks/useDealers";
import { useAuth } from "../context/AuthContext";

interface ActivityLog {
  _id?: string;
  action: string;
  note?: string;
  performedBy?: string;
  timestamp: string;
}

interface FollowUp {
  _id?: string;
  date: string;
  note: string;
  status: "Pending" | "Completed";
  performedBy?: string;
}

interface ExtendedLead extends Lead {
  activityLog?: ActivityLog[];
  followUps?: FollowUp[];
}

interface Dealer {
  _id: string;
  companyName: string;
  ownerName: string;
}

export function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAdmin, isDistributor, isDealer } = useAuth();
  const { data: lead, isLoading: isLeadLoading } = useLeadDetail(id);
  const { data: dealers = [] } = useDealers();

  const updateStatusMutation = useUpdateLeadStatus();
  const assignDealerMutation = useAssignLeadDealer();
  const addFollowUpMutation = useAddLeadFollowUp();
  const markFollowUpMutation = useMarkFollowUpCompleted();
  const createOrderMutation = useCreateOrder();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Action state
  const [activeAction, setActiveAction] = useState<"status" | "assign" | "followup" | null>(null);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [selectedDealerName, setSelectedDealerName] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [lossReason, setLossReason] = useState("");
  const [lossNotes, setLossNotes] = useState("");
  const [newRating, setNewRating] = useState("");
  const [note, setNote] = useState("");
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);

  const handleChangeRating = async () => {
    if (!newRating || !id) return;
    updateLeadMutation.mutate({ id, data: { rating: newRating } }, {
      onSuccess: () => setActiveAction(null)
    });
  };

  const handleChangeStatus = async () => {
    if (!newStatus || !id) return;
    updateStatusMutation.mutate({ id, status: newStatus, lossReason, lossNotes }, {
      onSuccess: () => {
        setActiveAction(null);
        setLossReason("");
        setLossNotes("");
      }
    });
  };

  const handleAssignDealer = async () => {
    if (!selectedDealerId || !id) return;
    assignDealerMutation.mutate({
      id,
      dealerId: selectedDealerId,
      dealerName: selectedDealerName
    }, {
      onSuccess: () => setActiveAction(null)
    });
  };


  const handleScheduleFollowUp = async () => {
    if (!followUpDate || !followUpNote || !id) {
      toast.error("Please fill in date and note");
      return;
    }
    addFollowUpMutation.mutate({
      id,
      date: followUpDate,
      note: followUpNote
    }, {
      onSuccess: () => {
        setFollowUpDate("");
        setFollowUpNote("");
        setActiveAction(null);
      }
    });
  };

  const handleAddNote = async () => {
    if (!note.trim() || !id) return;
    updateLeadMutation.mutate({ id, data: { notes: note } }, {
      onSuccess: () => setNote("")
    });
  };

  const handleMarkDone = (followUpId: string) => {
    if (!id) return;
    markFollowUpMutation.mutate({ id, followUpId });
  };

  const handleCreateOrder = () => {
    if (!id) return;
    createOrderMutation.mutate(id);
  };




  const actionLoading = updateStatusMutation.isPending ||
    assignDealerMutation.isPending ||
    addFollowUpMutation.isPending ||
    markFollowUpMutation.isPending ||
    createOrderMutation.isPending ||
    updateLeadMutation.isPending ||
    deleteLeadMutation.isPending;

  if (isLeadLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-28" />
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-2 w-2 rounded-full mt-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-900">Lead not found</h2>
          <Link to="/leads" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Leads
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
          <Link to="/leads">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lead.customerName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-600">Lead ID: {lead._id.substring(lead._id.length - 6).toUpperCase()}</p>
              <span className="text-gray-300">•</span>
              <p className="text-xs text-gray-500">
                Created {Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(isAdmin || isDistributor || isDealer) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => setIsDeleteAlertOpen(true)}
              disabled={actionLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <StatusBadge status={lead.rating} />
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this lead and all associated follow-up history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLeadMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteLeadMutation.mutate(id!)}
              disabled={deleteLeadMutation.isPending}
            >
              {deleteLeadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-0.5">Customer Information</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">{lead.email || "—"}</p>
                </div>
              </div>
              {lead.status === "Lost" && (
                <>
                  {lead.lossReason && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-gray-400 mt-0.5" /> {/* Placeholder for alignment */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reason for Loss</p>
                        <p className="text-sm font-medium text-red-600">{lead.lossReason}</p>
                      </div>
                    </div>
                  )}
                  {lead.lossNotes && (
                    <div className="flex items-start gap-3 col-span-2"> {/* Use col-span-2 for full width */}
                      <div className="w-5 h-5 text-gray-400 mt-0.5" /> {/* Placeholder for alignment */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Loss Notes</p>
                        <p className="text-sm text-gray-600 italic">{lead.lossNotes}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Region</p>
                  <p className="text-sm font-medium text-gray-900">{lead.region}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Estimated Value</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(lead.value)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Lead Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-0.5">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Product Interest</p>
                <p className="text-sm font-medium text-gray-900">{lead.product}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned Dealer</p>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium text-gray-900">{lead.dealerId?.companyName || "Not Assigned"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Source</p>
                <div className="flex">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${lead.source === "Web" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {lead.source}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {lead.assignedDate ? new Date(lead.assignedDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Card className="p-6">
            <Tabs defaultValue="activity">
              <TabsList>
                <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="followups">Follow-ups</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-4">
                <div className="space-y-4">
                  {(lead.activityLog && lead.activityLog.length > 0) ? (
                    [...lead.activityLog].reverse().map((activity, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          {activity.note && <p className="text-sm text-gray-600">{activity.note}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString("en-IN")}
                            {activity.performedBy ? ` • by ${activity.performedBy}` : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No activity recorded yet.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <div className="space-y-4">
                  {lead.notes && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{lead.notes}</p>
                    </div>
                  )}
                  <Textarea
                    placeholder="Add a new note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddNote} disabled={!note.trim() || updateLeadMutation.isPending}>
                    {updateLeadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Note
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="followups" className="mt-4">
                <div className="space-y-3">
                  {(lead.followUps && lead.followUps.length > 0) ? (
                    lead.followUps.map((fu: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{fu.note}</p>
                            {fu.status === "Pending" && new Date(fu.date) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase">
                                ⚠️ Overdue
                              </span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${fu.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {fu.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-600">Due: {new Date(fu.date).toLocaleDateString("en-IN")}</p>
                          </div>
                          {fu.status === "Pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleMarkDone(fu._id!)}
                            >
                              Mark as Done
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No follow-ups scheduled yet.</p>
                  )}
                  <Button size="sm" onClick={() => setActiveAction("followup")}>
                    Schedule Follow-up
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
              {activeAction ? "Update Lead" : "Actions"}
            </h3>

            <div className="space-y-4">
              {!activeAction ? (
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    disabled={actionLoading}
                    onClick={handleCreateOrder}
                  >
                    {createOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Order
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => {
                      setNewStatus(lead.status);
                      setActiveAction("status");
                      setTimeout(() => setIsStatusSelectOpen(true), 100);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Change Status
                  </Button>
                    {(isAdmin || isDistributor) && (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => setActiveAction("assign")}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Assign Dealer
                      </Button>
                    )}
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveAction("followup")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => {
                      setNewRating(lead.rating);
                      setActiveAction("rating" as any);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Change Rating
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {activeAction === "status" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">New Status</Label>
                      <Select
                        open={isStatusSelectOpen}
                        onOpenChange={setIsStatusSelectOpen}
                        value={newStatus}
                        onValueChange={setNewStatus}
                      >
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          {["New", "Assigned", "Discussion", "Negotiation", "Won", "Lost"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newStatus === "Lost" && (
                        <div className="space-y-3 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="loss-reason">Reason for Loss <span className="text-red-500">*</span></Label>
                            <Select value={lossReason} onValueChange={setLossReason}>
                              <SelectTrigger id="loss-reason"><SelectValue placeholder="Select reason" /></SelectTrigger>
                              <SelectContent>
                                {["Price Issue", "Not Interested", "Competitor", "No Response"].map(r => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="loss-notes">Additional Notes (optional)</Label>
                            <Textarea
                              id="loss-notes"
                              placeholder="Any extra details..."
                              value={lossNotes}
                              onChange={(e) => setLossNotes(e.target.value)}
                              className="bg-white min-h-[80px]"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={handleChangeStatus}
                          disabled={actionLoading || !newStatus || (newStatus === "Lost" && !lossReason)}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={() => { setActiveAction(null); setLossReason(""); setLossNotes(""); }}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {activeAction === "assign" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Select Dealer</Label>
                      <Select
                        value={selectedDealerId}
                        onValueChange={(val) => {
                          setSelectedDealerId(val);
                          const d = dealers.find((d: any) => d._id === val);
                          setSelectedDealerName(d?.companyName || "");
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select a dealer" /></SelectTrigger>
                        <SelectContent>
                          {isDistributor && <SelectItem value="self">Assign to Myself</SelectItem>}
                          {dealers.filter((d: any) => d.status === "Approved").map((d: any) => (
                            <SelectItem key={d._id} value={d._id}>{d.companyName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={handleAssignDealer}
                          disabled={actionLoading || !selectedDealerId}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={() => setActiveAction(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {activeAction === "followup" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="follow-up-date">Date</Label>
                        <Input
                          id="follow-up-date"
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="follow-up-note">Note</Label>
                        <Textarea
                          id="follow-up-note"
                          placeholder="e.g. Call to confirm demo"
                          value={followUpNote}
                          onChange={(e) => setFollowUpNote(e.target.value)}
                          className="bg-white min-h-[80px]"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={handleScheduleFollowUp}
                          disabled={actionLoading || !followUpDate || !followUpNote}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={() => setActiveAction(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {(activeAction as any) === "rating" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">New Rating</Label>
                      <Select
                        value={newRating}
                        onValueChange={setNewRating}
                      >
                        <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                        <SelectContent>
                          {["Hot 🔥", "Warm 🌤️", "Cold ❄️"].map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={handleChangeRating}
                          disabled={actionLoading || !newRating}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={() => setActiveAction(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Lifecycle */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-0.5">Lead Lifecycle</h3>
            <div className="space-y-2">
              {["New", "Assigned", "Discussion", "Negotiation", "Won"].map((stage, index) => {
                const stages = ["New", "Assigned", "Discussion", "Negotiation", "Won"];
                const currentIdx = stages.indexOf(lead.status);
                const stageIdx = stages.indexOf(stage);
                const isActive = stageIdx <= currentIdx;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm ${stage === lead.status ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
