import { useParams, Link } from "react-router";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { mockLeads } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";

export function LeadDetail() {
  const { id } = useParams();
  const lead = mockLeads.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Lead not found</h2>
          <Link to="/leads" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  const activities = [
    { date: "2026-02-25", user: "Admin", action: "Created lead from web inquiry" },
    { date: "2026-02-25", user: "System", action: "Auto-assigned to dealer based on region" },
    { date: "2026-02-26", user: "Dealer", action: "Contacted customer via phone" },
    { date: "2026-02-26", user: "Dealer", action: "Demo scheduled for next week" },
  ];

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
            <p className="text-sm text-gray-600 mt-1">Lead ID: {lead.id}</p>
          </div>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h3>
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
                  <p className="text-sm font-medium text-gray-900">{lead.email}</p>
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
                  <p className="text-sm font-medium text-gray-900">
                    ₹{(lead.value / 100000).toFixed(1)}L
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Lead Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Lead Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Product Interest</p>
                <p className="text-sm font-medium text-gray-900">{lead.product}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Source</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    lead.source === "Web"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {lead.source}
                </span>
              </div>
              {lead.dealer && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Assigned Dealer</p>
                  <p className="text-sm font-medium text-gray-900">{lead.dealer}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {lead.assignedDate}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs for Activity and Notes */}
          <Card className="p-6">
            <Tabs defaultValue="activity">
              <TabsList>
                <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="followups">Follow-ups</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="mt-4">
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
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-900 mb-2">{lead.notes}</p>
                    <p className="text-xs text-gray-500">Added on {lead.assignedDate}</p>
                  </div>
                  <Textarea placeholder="Add a new note..." />
                  <Button size="sm">Add Note</Button>
                </div>
              </TabsContent>
              <TabsContent value="followups" className="mt-4">
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        Schedule product demo
                      </p>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Due: March 5, 2026</p>
                  </div>
                  <Button size="sm">Schedule Follow-up</Button>
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
              <Button className="w-full justify-start" variant="outline">
                Change Status
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Assign to Dealer
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Convert to Order
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Schedule Follow-up
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Lead Lifecycle
            </h3>
            <div className="space-y-3">
              {["New", "Assigned", "Discussion", "Negotiation", "Won"].map(
                (stage, index) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        ["New", "Assigned", "Discussion"].includes(stage)
                          ? "bg-blue-600 text-white"
                          : stage === lead.status
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`text-sm ${
                        stage === lead.status
                          ? "font-medium text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
