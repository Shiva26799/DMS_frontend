import { Maintenance } from "../models/maintenance.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";

// Get all maintenance records with filters
export const getMaintenanceRecords = async (req, res) => {
    try {
        const { status, search, dealer, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};

        if (status && status !== "all") {
            query.status = status;
        }

        if (dealer && dealer !== "all") {
            query.dealerId = dealer;
        }

        if (search) {
            query.$or = [
                { productSerial: { $regex: search, $options: "i" } },
                { productName: { $regex: search, $options: "i" } },
                { dealerName: { $regex: search, $options: "i" } }
            ];
        }

        // Role-based filtering
        const user = req.user;
        if (user.role === "Dealer") {
            const userDealerId = user.dealerId?._id || user.dealerId;
            query.dealerId = userDealerId;
        } else if (user.role === "Distributor") {
            const userId = user._id?._id || user._id;
            const dealers = await Dealer.find({ distributorId: userId });
            const dealerIds = dealers.map(d => d._id);
            query.dealerId = { $in: [...dealerIds, userId] };
        }

        // Auto-update overdue records
        await Maintenance.updateMany(
            { status: "Upcoming", dueDate: { $lt: new Date() } },
            { $set: { status: "Overdue" } }
        );

        const total = await Maintenance.countDocuments(query);
        const records = await Maintenance.find(query)
            .populate("productId", "name sku category")
            .populate("orderId", "orderNumber")
            .populate("dealerId", "companyName ownerName code")
            .sort({ dueDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Stats
        const allQuery = { ...query };
        delete allQuery.status;
        const upcomingCount = await Maintenance.countDocuments({ ...allQuery, status: "Upcoming" });
        const overdueCount = await Maintenance.countDocuments({ ...allQuery, status: "Overdue" });
        const completedCount = await Maintenance.countDocuments({ ...allQuery, status: "Completed" });

        res.json({
            records,
            stats: {
                total,
                upcoming: upcomingCount,
                overdue: overdueCount,
                completed: completedCount
            },
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching maintenance records:", error);
        res.status(500).json({ message: "Error fetching maintenance records", error: error.message });
    }
};

// Get single maintenance record details (View Details)
export const getMaintenanceById = async (req, res) => {
    try {
        const record = await Maintenance.findById(req.params.id)
            .populate("productId", "name sku category price specifications")
            .populate("orderId", "orderNumber warrantyDetails totalValue createdAt")
            .populate("dealerId", "companyName ownerName code contact email address region");

        if (!record) {
            return res.status(404).json({ message: "Maintenance record not found" });
        }

        res.json(record);
    } catch (error) {
        console.error("Error fetching maintenance details:", error);
        res.status(500).json({ message: "Error fetching maintenance details", error: error.message });
    }
};

// Complete a service (Complete Service button)
export const completeService = async (req, res) => {
    try {
        const { technicianNotes } = req.body;
        const record = await Maintenance.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: "Maintenance record not found" });
        }

        const user = req.user;
        const userId = String(user._id?._id || user._id);
        if (user.role === "Distributor" && String(record.dealerId?._id || record.dealerId) !== userId) {
            return res.status(403).json({ message: "Read-only access: Distributors cannot complete service for their dealers." });
        }

        if (record.status === "Completed") {
            return res.status(400).json({ message: "Service already completed" });
        }

        // Save to service history
        record.serviceHistory.push({
            serviceType: record.serviceType,
            completedDate: new Date(),
            technicianNotes: technicianNotes || "",
            performedBy: req.user?.name || "System"
        });

        record.status = "Completed";
        record.completedDate = new Date();
        record.technicianNotes = technicianNotes || "";

        await record.save();

        // Auto-schedule the next maintenance if applicable
        try {
            const product = await Product.findById(record.productId);
            if (product && product.maintenanceRequired) {
                const intervalMonths = product.maintenanceIntervalMonths || 3;
                const nextDueDate = new Date();
                nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);

                // Determine next service type
                const serviceOrder = ["500h", "1000h"];
                const currentIndex = serviceOrder.indexOf(record.serviceType);
                const nextServiceType = currentIndex >= 0 && currentIndex < serviceOrder.length - 1
                    ? serviceOrder[currentIndex + 1]
                    : serviceOrder[0]; // Loop back to 500h

                const nextMaintenance = new Maintenance({
                    orderId: record.orderId,
                    productId: record.productId,
                    dealerId: record.dealerId,
                    dealerName: record.dealerName,
                    productSerial: record.productSerial,
                    productName: record.productName,
                    serviceType: nextServiceType,
                    dueDate: nextDueDate,
                    status: "Upcoming",
                    serviceHistory: record.serviceHistory // Carry forward history
                });

                await nextMaintenance.save();
            }
        } catch (scheduleError) {
            console.error("Error auto-scheduling next maintenance:", scheduleError);
        }

        res.json(record);
    } catch (error) {
        console.error("Error completing service:", error);
        res.status(500).json({ message: "Error completing service", error: error.message });
    }
};

// Manually schedule a new maintenance service (Schedule Service button)
export const scheduleService = async (req, res) => {
    try {
        let { orderId, productId, dealerId, productSerial, productName, dealerName, serviceType, dueDate } = req.body;
        const user = req.user;

        if (!productSerial || !productName || !serviceType || !dueDate) {
            return res.status(400).json({ message: "productSerial, productName, serviceType, and dueDate are required." });
        }

        // --- RBAC on dealerId ---
        if (user.role === "Dealer") {
            dealerId = user.dealerId?._id || user.dealerId;
        } else if (user.role === "Distributor") {
            const userId = String(user._id?._id || user._id);
            if (dealerId && dealerId !== userId) {
                // Must be one of their dealers
                const dealerCheck = await Dealer.findOne({ _id: dealerId, distributorId: user._id?._id || user._id });
                if (!dealerCheck) {
                    return res.status(403).json({ message: "Access denied: Cannot schedule service for a dealer outside your network." });
                }
            } else if (!dealerId) {
                // Default to self for distributor if not provided
                dealerId = user._id?._id || user._id;
            }
        } else if (user.role === "Super Admin") {
            // Can pass whatever
        } else {
            return res.status(403).json({ message: "Unauthorized to schedule service." });
        }
        // --- End RBAC ---

        // If productId given, validate it requires maintenance
        if (productId) {
            const product = await Product.findById(productId);
            if (product && !product.maintenanceRequired) {
                return res.status(400).json({ message: `Product "${product.name}" does not require maintenance.` });
            }
        }

        // Resolve dealer name
        let resolvedDealerName = dealerName || "";
        if (dealerId && !resolvedDealerName) {
            const dealer = await Dealer.findById(dealerId);
            if (dealer) resolvedDealerName = dealer.companyName || dealer.ownerName || "";
        }

        const newRecord = new Maintenance({
            orderId: orderId || undefined,
            productId: productId || undefined,
            dealerId: dealerId || undefined,
            dealerName: resolvedDealerName,
            productSerial,
            productName,
            serviceType,
            dueDate: new Date(dueDate),
            status: new Date(dueDate) < new Date() ? "Overdue" : "Upcoming"
        });

        await newRecord.save();

        const populated = await Maintenance.findById(newRecord._id)
            .populate("productId", "name sku category")
            .populate("dealerId", "companyName ownerName code");

        res.status(201).json(populated);
    } catch (error) {
        console.error("Error scheduling maintenance:", error);
        res.status(500).json({ message: "Error scheduling maintenance", error: error.message });
    }
};
