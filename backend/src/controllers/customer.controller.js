import { Lead } from "../models/lead.model.js";
import { Dealer } from "../models/dealer.model.js";

// Get all customers with RBAC (mirrors getLeads but for stage: "Customer")
export const getCustomers = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = { stage: "Customer" };

        // Support search by customer name
        const search = req.query.search;
        if (search) {
            query.customerName = { $regex: search, $options: "i" };
        }

        if (user.role === "Dealer") {
            if (!user.dealerId) {
                return res.status(403).json({ message: "Dealer account is missing dealerId linkage." });
            }
            query.dealerId = user.dealerId;
        } else if (user.role === "Distributor") {
            const dealers = await Dealer.find({ distributorId: user._id });
            const dealerIds = dealers.map(d => d._id);
            query.$or = [
                { dealerId: { $in: dealerIds } },
                { assignedTo: user._id }
            ];
        }

        const totalCustomers = await Lead.countDocuments(query);
        const customers = await Lead.find(query)
            .populate("dealerId", "companyName ownerName")
            .populate("distributorId", "name")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            customers,
            pagination: {
                total: totalCustomers,
                page,
                limit,
                pages: Math.ceil(totalCustomers / limit)
            }
        });
    } catch (error) {
        console.error("Fetch customers error:", error);
        res.status(500).json({ message: "Failed to fetch customers" });
    }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
    try {
        const user = req.user;
        const customer = await Lead.findOne({ _id: req.params.id, stage: "Customer" })
            .populate("dealerId", "companyName ownerName")
            .populate("distributorId", "name");

        if (!customer) return res.status(404).json({ message: "Customer not found" });

        // RBAC Check
        if (user.role === "Dealer" && String(customer.dealerId?._id || customer.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized access to this customer" });
        }

        if (user.role === "Distributor") {
            const dealer = await Dealer.findOne({ _id: customer.dealerId?._id || customer.dealerId, distributorId: user._id });
            if (!dealer && String(customer.assignedTo) !== String(user._id)) {
                return res.status(403).json({ message: "Unauthorized access to this customer" });
            }
        }

        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch customer" });
    }
};

// Update customer
export const updateCustomer = async (req, res) => {
    try {
        const user = req.user;
        const existingCustomer = await Lead.findOne({ _id: req.params.id, stage: "Customer" });
        if (!existingCustomer) return res.status(404).json({ message: "Customer not found" });

        // RBAC Check
        if (user.role === "Dealer" && String(existingCustomer.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized edit attempt" });
        }

        if (user.role === "Distributor") {
            const dealer = await Dealer.findOne({ _id: existingCustomer.dealerId, distributorId: user._id });
            if (!dealer && String(existingCustomer.assignedTo) !== String(user._id)) {
                return res.status(403).json({ message: "Unauthorized edit attempt" });
            }
        }

        const customer = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate("dealerId", "companyName ownerName")
            .populate("distributorId", "name");
        res.json(customer);
    } catch (error) {
        res.status(400).json({ message: "Failed to update customer", error: error.message });
    }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
    try {
        const user = req.user;
        const customer = await Lead.findOne({ _id: req.params.id, stage: "Customer" });
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        // RBAC Check
        if (user.role === "Dealer" && String(customer.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized deletion attempt" });
        }

        if (user.role === "Distributor") {
            const dealer = await Dealer.findOne({ _id: customer.dealerId, distributorId: user._id });
            if (!dealer && String(customer.assignedTo) !== String(user._id)) {
                return res.status(403).json({ message: "Unauthorized deletion attempt" });
            }
        }

        await Lead.findByIdAndDelete(req.params.id);
        res.json({ message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete customer", error: error.message });
    }
};
