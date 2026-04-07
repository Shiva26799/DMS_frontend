import { Lead } from "../models/lead.model.js";
import { Customer } from "../models/customer.model.js";
import { Dealer } from "../models/dealer.model.js";

export const getLeads = async (req, res) => {
    try {
        const user = req.user;
        let query = {};

        if (user.role === "Dealer") {
            if (!user.dealerId) {
                return res.status(403).json({ message: "Dealer account is missing dealerId linkage." });
            }
            query = { dealerId: user.dealerId };
        } else if (user.role === "Distributor") {
            // Find all dealers managed by this distributor
            const dealers = await Dealer.find({ distributorId: user._id });
            const dealerIds = dealers.map(d => d._id);
            // Show leads for their dealers OR leads assigned directly to the distributor
            query = { 
                $or: [
                    { dealerId: { $in: dealerIds } },
                    { assignedTo: user._id }
                ]
            };
        }

        const leads = await Lead.find(query).populate("dealerId", "companyName ownerName").sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error("Fetch leads error:", error);
        res.status(500).json({ message: "Failed to fetch leads" });
    }
};

export const createLead = async (req, res) => {
    try {
        const user = req.user;
        const { phone, dealerId } = req.body;

        // Duplicate check
        const existingLead = await Lead.findOne({ phone });
        if (existingLead) {
            return res.status(400).json({ message: "A lead with this phone number already exists." });
        }

        const leadData = { ...req.body };
        // Clean up empty strings that could cause CastErrors
        if (!leadData.dealerId || leadData.dealerId === "") delete leadData.dealerId;
        if (!leadData.customerId || leadData.customerId === "") delete leadData.customerId;
        if (!leadData.assignedTo || leadData.assignedTo === "") delete leadData.assignedTo;

        leadData.metadata = {
            DistributorName: "",
            DealerName: ""
        };

        if (user.role === "Dealer") {
            leadData.source = "Dealer";
            leadData.dealerId = user.dealerId;
            leadData.metadata.DealerName = user.name;
            leadData.assignedTo = user._id; // Auto-assign to self
        } else if (user.role === "Distributor") {
            leadData.source = "Web"; 
            leadData.metadata.DistributorName = user.name;
            if (dealerId) {
                const dealer = await Dealer.findOne({ _id: dealerId, distributorId: user._id });
                if (!dealer) {
                    return res.status(403).json({ message: "You can only assign leads to your own dealers." });
                }
                leadData.metadata.DealerName = dealer.companyName;
            } else {
                leadData.assignedTo = user._id;
            }
        } else {
            leadData.source = leadData.source || "Web";
            if (dealerId) {
                const dealer = await Dealer.findById(dealerId);
                if (dealer) {
                    leadData.metadata.DealerName = dealer.companyName;
                    leadData.metadata.DistributorName = dealer.metadata?.DistributorName;
                }
            }
        }

        leadData.activityLog = [{
            action: "Lead Created",
            note: `Lead added by ${user.name || user.role}`,
            performedBy: user.name || user.role,
            timestamp: new Date(),
        }];

        const lead = new Lead(leadData);
        await lead.save();
        res.status(201).json(lead);
    } catch (error) {
        console.error("Lead creation error:", error);
        res.status(400).json({ message: "Failed to create lead", error: error instanceof Error ? error.message : error });
    }
};

export const getLeadById = async (req, res) => {
    try {
        const user = req.user;
        const lead = await Lead.findById(req.params.id).populate("dealerId", "companyName ownerName");
        if (!lead) return res.status(404).json({ message: "Lead not found" });

        if (user.role === "Dealer" && String(lead.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized access to this lead" });
        }

        if (user.role === "Distributor") {
            const dealer = await Dealer.findOne({ _id: lead.dealerId, distributorId: user._id });
            if (!dealer && String(lead.assignedTo) !== String(user._id)) {
                return res.status(403).json({ message: "Unauthorized access to this lead" });
            }
        }

        res.json(lead);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch lead" });
    }
};

export const updateLead = async (req, res) => {
    try {
        const user = req.user;

        const existingLead = await Lead.findById(req.params.id);
        if (!existingLead) return res.status(404).json({ message: "Lead not found" });

        if (user.role === "Dealer" && String(existingLead.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized edit attempt" });
        }

        if (user.role === "Distributor") {
            const dealer = await Dealer.findOne({ _id: existingLead.dealerId, distributorId: user._id });
            if (!dealer && String(existingLead.assignedTo) !== String(user._id)) {
                return res.status(403).json({ message: "Unauthorized edit attempt" });
            }
        }

        const updateData = { ...req.body };
        if (user.role === "Dealer") {
            delete updateData.dealerId;
        }

        // Log rating change if it exists
        if (updateData.rating && updateData.rating !== existingLead.rating) {
            if (!updateData.$push) updateData.$push = {};
            updateData.$push.activityLog = {
                action: "Rating Changed",
                note: `Rating updated to: ${updateData.rating}`,
                performedBy: user.name || user.role,
                timestamp: new Date(),
            };
        }

        const lead = await Lead.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ message: "Failed to update lead", error });
    }
};

export const assignLead = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "Super Admin" && user.role !== "Distributor") {
            return res.status(403).json({ message: "Unauthorized to assign leads." });
        }
        const { dealerId, dealerName } = req.body;
        const updateData = {};

        // Role-based validation for assignment
        if (user.role === "Distributor") {
            // Distributor assigning to themselves
            if (!dealerId || dealerId === "self") {
                 updateData.assignedTo = user._id;
                 updateData.status = "Assigned";
                 updateData.$push = {
                    activityLog: {
                        action: "Lead Assigned",
                        note: `Assigned to self (Distributor)`,
                        performedBy: user.name || "Distributor",
                        timestamp: new Date(),
                    }
                 };
            } else {
                // Distributor assigning to a dealer - verify ownership
                const dealer = await Dealer.findOne({ _id: dealerId, distributorId: user._id });
                if (!dealer) {
                    return res.status(403).json({ message: "You can only assign leads to your own dealers." });
                }
                updateData.dealerId = dealerId;
                updateData.metadata = {
                    DealerName: dealer.companyName,
                    DistributorName: user.name
                };
                updateData.status = "Assigned";
                updateData.$push = {
                    activityLog: {
                        action: "Lead Assigned",
                        note: `Assigned to dealer: ${dealer.companyName}`,
                        performedBy: user.name || "Distributor",
                        timestamp: new Date(),
                    }
                };
            }
        } else {
            // Super Admin logic
            const dealer = await Dealer.findById(dealerId);
            if (dealer) {
                updateData.dealerId = dealerId;
                updateData.metadata = {
                    DealerName: dealer.companyName,
                    DistributorName: dealer.metadata?.DistributorName
                };
                updateData.status = "Assigned";
                updateData.$push = {
                    activityLog: {
                        action: "Lead Assigned",
                        note: `Assigned to dealer: ${dealer.companyName}`,
                        performedBy: user.name || "Super Admin",
                        timestamp: new Date(),
                    }
                };
            }
        }

        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after' }
        );

        if (!lead) return res.status(404).json({ message: "Lead not found" });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ message: "Failed to assign lead", error });
    }
};

export const updateLeadStatus = async (req, res) => {
    try {
        const user = req.user;
        const { status, lossReason, lossNotes } = req.body;
        const validStatuses = ["New", "Assigned", "Discussion", "Negotiation", "Won", "Lost"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        if (status === "Lost" && !lossReason) {
            return res.status(400).json({ message: "Loss reason is required for Lost status" });
        }

        const updateData = { status };
        if (status === "Lost") {
            updateData.lossReason = lossReason;
            updateData.lossNotes = lossNotes;
        } else {
            // Clear lossReason and lossNotes if status is not Lost
            updateData.lossReason = undefined;
            updateData.lossNotes = undefined;
        }

        if (user.role === "Dealer") {
            const existingLead = await Lead.findById(req.params.id);
            if (!existingLead || String(existingLead.dealerId) !== String(user.dealerId)) {
                return res.status(403).json({ message: "Unauthorized" });
            }
        }

        if (user.role === "Distributor") {
            const existingLead = await Lead.findById(req.params.id);
            if (!existingLead) return res.status(404).json({ message: "Lead not found" });
            const dealer = await Dealer.findOne({ _id: existingLead.dealerId, distributorId: user._id });
            if (!dealer && String(existingLead.assignedTo) !== String(user._id)) {
                return res.status(403).json({ message: "Unauthorized" });
            }
        }

        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            {
                status,
                lossReason: status === "Lost" ? lossReason : undefined,
                $push: {
                    activityLog: {
                        action: "Status Changed",
                        note: `Status updated to: ${status}${lossReason ? `. Reason: ${lossReason}` : ""}`,
                        performedBy: user.name || user.role,
                        timestamp: new Date(),
                    }
                }
            },
            { returnDocument: 'after' }
        );

        if (!lead) return res.status(404).json({ message: "Lead not found" });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ message: "Failed to update status", error });
    }
};

export const addLeadFollowUp = async (req, res) => {
    try {
        const user = req.user;
        const { date, note } = req.body;
        if (!date || !note) {
            return res.status(400).json({ message: "date and note are required." });
        }

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).json({ message: "Cannot schedule follow-up in the past." });
        }

        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    followUps: { date: new Date(date), note, performedBy: user.name || user.role, status: "Pending" },
                    activityLog: {
                        action: "Follow-up Scheduled",
                        note: `Follow-up on ${date}: ${note}`,
                        performedBy: user.name || user.role,
                        timestamp: new Date(),
                    }
                }
            },
            { returnDocument: 'after' }
        );

        if (!lead) return res.status(404).json({ message: "Lead not found" });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ message: "Failed to add follow-up", error });
    }
};

export const markFollowUpCompleted = async (req, res) => {
    try {
        const user = req.user;
        const { followUpId } = req.params;

        const lead = await Lead.findOneAndUpdate(
            { _id: req.params.id, "followUps._id": followUpId },
            {
                $set: { "followUps.$.status": "Completed" },
                $push: {
                    activityLog: {
                        action: "Follow-up Completed",
                        note: "Marked a pending follow-up as completed",
                        performedBy: user.name || user.role,
                        timestamp: new Date(),
                    }
                }
            },
            { returnDocument: 'after' }
        );

        if (!lead) return res.status(404).json({ message: "Lead or follow-up not found" });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ message: "Failed to mark follow-up as completed", error });
    }
};

export const convertLeadToCustomer = async (req, res) => {
    try {
        const user = req.user;
        const lead = await Lead.findById(req.params.id);

        if (!lead) return res.status(404).json({ message: "Lead not found" });
        if (lead.status !== "Won") {
            return res.status(400).json({ message: "Only 'Won' leads can be converted to customers." });
        }

        const customer = new Customer({
            name: lead.customerName,
            phone: lead.phone,
            email: lead.email,
            region: lead.region,
            product: lead.product,
            value: lead.value,
            dealerId: lead.dealerId,
            metadata: {
                DealerName: lead.metadata?.DealerName,
                DistributorName: lead.metadata?.DistributorName
            },
            leadId: lead._id,
            notes: lead.notes,
        });
        await customer.save();

        lead.activityLog.push({
            action: "Converted to Customer",
            note: `Customer record created (ID: ${customer._id})`,
            performedBy: user.name || user.role,
            timestamp: new Date(),
        });

        lead.customerId = customer._id;
        lead.status = "Won"; // Ensure status is explicitly set to Won upon successful conversion if it wasn't already
        await lead.save();

        res.json({ message: "Lead successfully converted to customer", customer });
    } catch (error) {
        console.error("Conversion error:", error);
        res.status(500).json({ message: "Failed to convert lead", error });
    }
};
export const deleteLead = async (req, res) => {
    try {
        const user = req.user;
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: "Lead not found" });

        if (user.role === "Dealer" && String(lead.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized deletion attempt" });
        }

        if (user.role === "Distributor") {
            const dealer = await Dealer.findOne({ _id: lead.dealerId, distributorId: user._id });
            if (!dealer && String(lead.assignedTo) !== String(user._id)) {
                return res.status(403).json({ message: "Unauthorized deletion attempt" });
            }
        }

        await Lead.findByIdAndDelete(req.params.id);
        res.json({ message: "Lead deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete lead", error });
    }
};
