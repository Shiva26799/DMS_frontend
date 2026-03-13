import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, Loader2, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { Lead } from "./LeadManagement";
import { formatCurrency } from "../utils/currency";

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
  const [lead, setLead] = useState<ExtendedLead | null>(null);
  const [loading, setLoading] = useState(true);

  // Action dialogs
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [selectedDealerName, setSelectedDealerName] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [note, setNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      const res = await apiClient.get(`leads/${id}`);
      setLead(res.data);
    } catch (error) {
      toast.error("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!newStatus) return;
    setActionLoading(true);
    try {
      const res = await apiClient.put(`leads/${id}/status`, { status: newStatus });
      setLead(res.data);
      toast.success(`Status updated to ${newStatus}`);
      setIsStatusDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDealer = async () => {
    if (!selectedDealerId) return;
    setActionLoading(true);
    try {
      const res = await apiClient.put(`leads/${id}/assign`, {
        dealerId: selectedDealerId,
        dealerName: selectedDealerName,
      });
      setLead(res.data);
      toast.success("Lead assigned to dealer successfully");
      setIsAssignDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign dealer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToCustomer = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`leads/${id}/convert`);
      toast.success("Lead successfully converted to customer!");
      setIsConvertDialogOpen(false);
      navigate("/leads");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to convert lead");
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!followUpDate || !followUpNote) {
      toast.error("Please fill in date and note");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(`leads/${id}/follow-up`, {
        date: followUpDate,
        note: followUpNote,
      });
      setLead(res.data);
      toast.success("Follow-up scheduled");
      setFollowUpDate("");
      setFollowUpNote("");
      setIsFollowUpDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to schedule follow-up");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      const res = await apiClient.put(`leads/${id}`, { notes: note });
      setLead((prev) => prev ? { ...prev, notes: note } : prev);
      toast.success("Note saved");
      setNote("");
    } catch {
      toast.error("Failed to save note");
    }
  };

  const openAssignDialog = async () => {
    setIsAssignDialogOpen(true);
    if (dealers.length === 0) {
      try {
        const res = await apiClient.get("dealers");
        setDealers(res.data);
      } catch {
        toast.error("Failed to load dealer list");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            <p className="text-sm text-gray-600 mt-1">Lead ID: {lead._id.substring(lead._id.length - 6).toUpperCase()}</p>
          </div>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Product Interest</p>
                <p className="text-sm font-medium text-gray-900">{lead.product}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Source</p>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${lead.source === "Web" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                  {lead.source}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{lead.assignedDate || "—"}</p>
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
                  <Button size="sm" onClick={handleAddNote} disabled={!note.trim()}>
                    Save Note
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="followups" className="mt-4">
                <div className="space-y-3">
                  {(lead.followUps && lead.followUps.length > 0) ? (
                    lead.followUps.map((fu, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{fu.note}</p>
                          <span className={`text-xs px-2 py-1 rounded ${fu.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {fu.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-600">Due: {new Date(fu.date).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No follow-ups scheduled yet.</p>
                  )}
                  <Button size="sm" onClick={() => setIsFollowUpDialogOpen(true)}>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => { setNewStatus(lead.status); setIsStatusDialogOpen(true); }}
              >
                Change Status
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={openAssignDialog}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Assign to Dealer
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setIsFollowUpDialogOpen(true)}
              >
                <Clock className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </Button>
              {lead.status === "Won" && (
                <Button
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsConvertDialogOpen(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Convert to Customer
                </Button>
              )}
            </div>
          </Card>

          {/* Lifecycle */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Lifecycle</h3>
            <div className="space-y-3">
              {["New", "Assigned", "Discussion", "Negotiation", "Won"].map((stage, index) => {
                const stages = ["New", "Assigned", "Discussion", "Negotiation", "Won", "Converted"];
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

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Lead Status</DialogTitle>
            <DialogDescription>Select a new status for this lead.</DialogDescription>
          </DialogHeader>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {["New", "Assigned", "Discussion", "Negotiation", "Won", "Lost"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeStatus} disabled={actionLoading || !newStatus} className="bg-blue-600 hover:bg-blue-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Dealer Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign to Dealer</DialogTitle>
            <DialogDescription>Select a dealer to assign this lead to.</DialogDescription>
          </DialogHeader>
          <Select
            value={selectedDealerId}
            onValueChange={(val) => {
              setSelectedDealerId(val);
              const d = dealers.find(d => d._id === val);
              setSelectedDealerName(d?.companyName || "");
            }}
          >
            <SelectTrigger><SelectValue placeholder="Select a dealer" /></SelectTrigger>
            <SelectContent>
              {dealers.map(d => (
                <SelectItem key={d._id} value={d._id}>{d.companyName} ({d.ownerName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignDealer} disabled={actionLoading || !selectedDealerId} className="bg-blue-600 hover:bg-blue-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Customer Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Convert to Customer</DialogTitle>
            <DialogDescription>
              This will create a permanent Customer record for <strong>{lead.customerName}</strong> and mark this lead as Converted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConvertToCustomer} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Convert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>Set a date and note for the next follow-up action.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="follow-up-date">Date</Label>
              <Input
                id="follow-up-date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="follow-up-note">Note</Label>
              <Textarea
                id="follow-up-note"
                placeholder="e.g. Call to confirm product demo"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFollowUpDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleFollowUp} disabled={actionLoading || !followUpDate || !followUpNote} className="bg-blue-600 hover:bg-blue-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
