import { Lead } from "../models/Lead.js";
import { Customer } from "../models/Customer.js";

export const getLeads = async (req, res) => {
    try {
        const user = req.user;
        let query = {};

        if (user.role === "Dealer") {
            if (!user.dealerId) {
                return res.status(403).json({ message: "Dealer account is missing dealerId linkage." });
            }
            query = { dealerId: user.dealerId };
        }

        const leads = await Lead.find(query).sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leads" });
    }
};

export const createLead = async (req, res) => {
    try {
        const user = req.user;
        const leadData = { ...req.body };

        if (user.role === "Dealer") {
            leadData.source = "Dealer";
            if (user.dealerId) {
                leadData.dealerId = user.dealerId;
            }
        } else {
            leadData.source = "Web";
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
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: "Lead not found" });

        if (user.role === "Dealer" && String(lead.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized access to this lead" });
        }

        res.json(lead);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch lead" });
    }
};

export const updateLead = async (req, res) => {
    try {
        const user = req.user;

        if (user.role === "Dealer") {
            const existingLead = await Lead.findById(req.params.id);
            if (!existingLead || String(existingLead.dealerId) !== String(user.dealerId)) {
                return res.status(403).json({ message: "Unauthorized edit attempt" });
            }
            delete req.body.dealerId;
        }

        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (!lead) return res.status(404).json({ message: "Lead not found" });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ message: "Failed to update lead", error });
    }
};

export const assignLead = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "Admin") {
            return res.status(403).json({ message: "Only Admins can assign leads." });
        }

        const { dealerId, dealerName } = req.body;
        if (!dealerId) {
            return res.status(400).json({ message: "dealerId is required." });
        }

        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            {
                dealerId,
                status: "Assigned",
                $push: {
                    activityLog: {
                        action: "Lead Assigned",
                        note: `Assigned to dealer: ${dealerName || dealerId}`,
                        performedBy: user.name || "Admin",
                        timestamp: new Date(),
                    }
                }
            },
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
        const { status } = req.body;
        const validStatuses = ["New", "Assigned", "Discussion", "Negotiation", "Won", "Lost"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        if (user.role === "Dealer") {
            const existingLead = await Lead.findById(req.params.id);
            if (!existingLead || String(existingLead.dealerId) !== String(user.dealerId)) {
                return res.status(403).json({ message: "Unauthorized" });
            }
        }

        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            {
                status,
                $push: {
                    activityLog: {
                        action: "Status Changed",
                        note: `Status updated to: ${status}`,
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
        await lead.save();

        res.json({ message: "Lead successfully converted to customer", customer });
    } catch (error) {
        console.error("Conversion error:", error);
        res.status(500).json({ message: "Failed to convert lead", error });
    }
};
