import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Lead } from "../models/lead.model.js";
import { Inventory } from "../models/inventory.model.js";
import { Maintenance } from "../models/maintenance.model.js";
import { deductStockFromOrder, restoreStockForOrder } from "../services/inventory.service.js";

// Create a new order
export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { dealerId, warehouseId, orderSource, products, buyerType = "Dealer", leadId, customerName } = req.body;

        let dealer;
        if (buyerType === "User") {
            dealer = await User.findById(dealerId);
        } else {
            dealer = await Dealer.findById(dealerId);
        }
        
        if (!dealer) {
            return res.status(404).json({ message: "Dealer or Distributor not found" });
        }

        if (buyerType === "Dealer" && dealer.status !== "Approved") {
            return res.status(400).json({ 
                message: `Order cannot be created. Dealer status is "${dealer.status}". Dealer must be "Approved" first.` 
            });
        }

        let totalValue = 0;
        const itemizedProducts = [];

        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }
            if (!item.price || isNaN(Number(item.price)) || Number(item.price) <= 0) {
                return res.status(400).json({ message: `Price is mandatory and must be valid for product ${product.name}` });
            }
            const price = Number(item.price);
            const quantity = Number(item.quantity) || 1;
            
            if (warehouseId || orderSource === "Own Stock") {
                const stockQuery = {
                    productId: item.productId,
                    ownerType: orderSource === "Own Stock" ? (buyerType === "User" ? dealer.role : "Dealer") : "Warehouse",
                    ownerId: orderSource === "Own Stock" ? dealerId : warehouseId
                };
                const inventory = await Inventory.findOne(stockQuery);
                if (!inventory || inventory.quantity < quantity) {
                    return res.status(400).json({ 
                        message: `Insufficient stock for product ${product.name}. Available: ${inventory?.quantity || 0}` 
                    });
                }
            }

            totalValue += price * quantity;
            itemizedProducts.push({ productId: item.productId, quantity, price });
        }

        const orderNumber = `ORD-2026-${Date.now().toString().slice(-6)}`;
        const isOwnStock = orderSource === "Own Stock";

        // --- BEGIN TRANSACTION ---
        session.startTransaction();

        const newOrder = new Order({
            orderNumber,
            buyerType,
            dealerId,
            warehouseId: isOwnStock ? undefined : warehouseId,
            orderSource: orderSource || "Warehouse",
            assignedDistributorId: buyerType === "User" ? undefined : dealer.distributorId,
            leadId: leadId || undefined,
            customerName: customerName || undefined,
            createdBy: req.user._id,
            metadata: {
                DealerName: buyerType === "User" ? dealer.name : dealer.companyName,
                DistributorName: buyerType === "User" ? undefined : dealer.metadata?.DistributorName
            },
            products: itemizedProducts,
            totalValue,
            currentStage: "PO Upload",
            stageProgress: 10,
            activityLog: [{
                action: "Order Created",
                note: `Order created (${orderSource || "Warehouse"})${customerName ? ` for customer: ${customerName}` : ""}. Total Value: ₹${totalValue}`,
                performedBy: req.user?.name || "System"
            }]
        });

        await newOrder.save({ session });

        // Atomic Stock Deduction within the same transaction
        if (orderSource === "Warehouse" || orderSource === "Own Stock") {
            await deductStockFromOrder(newOrder._id, session);
            newOrder.activityLog.push({
                action: "Stock Deducted",
                note: `Inventory automatically adjusted for ${orderSource || "Warehouse"} fulfillment.`,
                performedBy: "System"
            });
            await newOrder.save({ session });
        }

        // --- UPDATE LEAD STATUS IF APPLICABLE ---
        if (leadId) {
            await Lead.findByIdAndUpdate(leadId, {
                status: "Won",
                stage: "Customer",
                $push: {
                    activityLog: {
                        action: "Converted to Order",
                        note: `Order ${orderNumber} created.`,
                        performedBy: req.user.name || "System",
                        timestamp: new Date()
                    }
                }
            }, { session });
        }

        await session.commitTransaction();
        // --- END TRANSACTION ---

        const populatedOrder = await Order.findById(newOrder._id)
            .populate("dealerId", "companyName ownerName code name phone contact email")
            .populate("products.productId", "name price sku")
            .populate("leadId", "customerName phone stage");

        res.status(201).json(populatedOrder);
    } catch (error) {
        await session.abortTransaction();
        console.error("Error creating order (transaction rolled back):", error);
        res.status(500).json({ message: "Error creating order", error: error.message });
    } finally {
        session.endSession();
    }
};

// Get all orders
export const getOrders = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        if (user.role === "Dealer") {
            query = { dealerId: user.dealerId };
        } else if (user.role === "Distributor") {
            const dealers = await Dealer.find({ distributorId: user._id });
            const dealerIds = dealers.map(d => d._id);
            query = {
                $or: [
                    { dealerId: { $in: dealerIds } },
                    { dealerId: user._id },
                    { assignedDistributorId: user._id },
                    { createdBy: user._id }
                ]
            };
        }

        const totalOrders = await Order.countDocuments(query);
        const stats = await Order.aggregate([
            { $match: query },
            { $group: { _id: null, totalValue: { $sum: "$totalValue" } } }
        ]);
        const totalValue = stats.length > 0 ? stats[0].totalValue : 0;

        const orders = await Order.find(query)
            .populate("dealerId", "companyName ownerName code name phone contact email")
            .populate("products.productId", "name price sku")
            .populate("leadId", "customerName phone stage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            orders,
            stats: {
                totalOrders,
                totalValue
            },
            pagination: {
                total: totalOrders,
                page,
                limit,
                pages: Math.ceil(totalOrders / limit)
            }
        });
    } catch (error) {
        console.error("Fetch orders error:", error);
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const user = req.user;
        const order = await Order.findById(req.params.id)
            .populate("dealerId", "companyName ownerName code contact email address region name phone")
            .populate("products.productId", "name price sku category description")
            .populate("leadId", "customerName phone email stage region");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Security: Role-based access control for specific order
        if (user.role === "Dealer" && String(order.dealerId?._id || order.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized access to this order." });
        }

        let readOnly = false;

        if (user.role === "Distributor") {
            // Check if they are the buyer or the assigned distributor
            if (String(order.dealerId?._id || order.dealerId) !== String(user._id)) {
                const dealer = await Dealer.findOne({ _id: order.dealerId?._id || order.dealerId, distributorId: user._id });
                if (!dealer) {
                    return res.status(403).json({ message: "Unauthorized access to this order (not your dealer)." });
                }
            }
            
            // Distributors get read-only unless they are the creator or they are the buyer
            if (
                (!order.createdBy || String(order.createdBy) !== String(user._id)) && 
                String(order.dealerId?._id || order.dealerId) !== String(user._id)
            ) {
                readOnly = true;
            }
        }

        const orderObj = order.toObject();
        orderObj.readOnly = readOnly;
        res.json(orderObj);
    } catch (error) {
        console.error("Fetch order by ID error:", error);
        res.status(500).json({ message: "Error fetching order", error: error.message });
    }
};

// Upload PO Document
export const uploadPODocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!order.documents) order.documents = {};
        order.documents.po = {
            url: req.file.location,
            uploadedAt: new Date()
        };

        // Update stage if it's currently at PO Upload
        if (order.currentStage === "PO Upload") {
            order.currentStage = "Payment Upload";
            order.stageProgress = 30;
        }

        order.activityLog.push({
            action: "PO Uploaded",
            note: `Purchase Order document uploaded: ${req.file.originalname}`,
            performedBy: "User" // In a real app, this would be from req.user
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error uploading PO", error: error.message });
    }
};

// Upload Payment Document
export const uploadPaymentDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!order.documents) order.documents = {};
        order.documents.payment = {
            url: req.file.location,
            uploadedAt: new Date()
        };

        // Update stage
        if (order.currentStage === "Payment Upload") {
            order.currentStage = "Payment Verification";
            order.stageProgress = 40;
        }

        order.activityLog.push({
            action: "Payment Receipt Uploaded",
            note: `Payment receipt uploaded: ${req.file.originalname}`,
            performedBy: "User"
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error uploading payment receipt", error: error.message });
    }
};

// Approve Payment Receipt (Circle 3)
export const approveOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Permission check: Super Admin, the concerned Dealer, or the assigned Distributor
        const isDealer = req.user.role === "Dealer";
        const isDistributor = req.user.role === "Distributor";
        const isSuperAdmin = req.user.role === "Super Admin";

        if (isDealer && String(order.dealerId) !== String(req.user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized: You can only approve payments for your own orders." });
        }

        if (isDistributor && String(order.assignedDistributorId) !== String(req.user._id)) {
            return res.status(403).json({ message: "Unauthorized: You can only approve payments for your assigned dealers." });
        }

        if (!isSuperAdmin && !isDealer && !isDistributor) {
            return res.status(403).json({ message: "Unauthorized: You do not have permission to approve payments." });
        }

        order.paymentStatus = "Paid";
        if (order.orderSource === "Own Stock") {
            order.currentStage = "Installation";
            order.stageProgress = 90;
        } else {
            order.currentStage = "Order Approval";
            order.stageProgress = 40; // End of Circle 3
        }

        order.activityLog.push({
            action: "Payment Verified",
            note: `Payment receipt verified by ${req.user.name}`,
            performedBy: req.user.name
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error verifying payment", error: error.message });
    }
};

// Finalize Order Approval (Circle 4)
export const finalizeOrderApproval = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Permission check: Super Admin or assigned Distributor
        const isSuperAdmin = req.user.role === "Super Admin";
        const isDistributor = req.user.role === "Distributor";

        if (isDistributor && String(order.assignedDistributorId) !== String(req.user._id)) {
            return res.status(403).json({ message: "Unauthorized: You can only approve orders for your assigned dealers." });
        }

        if (!isSuperAdmin && !isDistributor) {
            return res.status(403).json({ message: "Only Super Admin or the assigned Distributor can approve orders." });
        }

        const isOwnStock = order.orderSource === "Own Stock";

        // For Own Stock, skip Lovol Invoicing and go to Delivery (where Super Admin uploads tracking)
        if (isOwnStock) {
            order.currentStage = "Delivery";
            order.stageProgress = 75;
        } else {
            order.currentStage = "Invoice Generation";
            order.stageProgress = 55;
        }

        order.activityLog.push({
            action: "Order Officially Approved",
            note: `Order authorized by ${req.user.name}. Stage moved to ${order.currentStage}.`,
            performedBy: req.user.name
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error finalizing order approval", error: error.message });
    }
};

// Upload Lovol Invoice (Circle 5 - Phase 1)
export const uploadLovolInvoice = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!order.documents) order.documents = {};
        order.documents.lovolInvoice = {
            url: req.file.location,
            uploadedAt: new Date()
        };

        // Advancing to the next circle: Delivery (Only if both invoices are present)
        if (order.documents?.lovolInvoice?.url && order.documents?.dealerInvoice?.url) {
            order.currentStage = "Delivery";
            order.stageProgress = 75;
        }

        order.activityLog.push({
            action: "Lovol Invoice Uploaded",
            note: `Official Lovol invoice uploaded by ${req.user.name}`,
            performedBy: req.user.name
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error uploading Lovol invoice", error: error.message });
    }
};

// Upload Dealer Invoice (Circle 5 - Phase 2)
export const uploadDealerInvoice = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!order.documents) order.documents = {};
        order.documents.dealerInvoice = {
            url: req.file.location,
            uploadedAt: new Date()
        };

        order.activityLog.push({
            action: "Dealer Invoice Uploaded",
            note: `Dealer customer invoice uploaded by ${req.user.name}`,
            performedBy: req.user.name
        });

        // Advancing to the next circle: Delivery (Only if both invoices are present)
        if (order.documents?.lovolInvoice?.url && order.documents?.dealerInvoice?.url) {
            order.currentStage = "Delivery";
            order.stageProgress = 75;
        }

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error uploading dealer invoice", error: error.message });
    }
};

// Update Delivery Status (Circle 6 -> 7)
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { transportName, trackingId, estimatedDeliveryDate } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.deliveryDetails = {
            transportName,
            trackingId,
            estimatedDeliveryDate
        };

        order.deliveryStatus = "Dispatched";
        order.stageProgress = 80;

        order.activityLog.push({
            action: "Order Dispatched",
            note: `Order dispatched via ${transportName} (Tracking ID: ${trackingId}) by ${req.user.name}`,
            performedBy: req.user.name
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error updating delivery status", error: error.message });
    }
};

// Confirm Dealer Receipt (Circle 7)
export const markOrderAsReceived = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.deliveryStatus = "Delivered";

        // Advancing to the next circle: Installation
        order.currentStage = "Installation";
        order.stageProgress = 90;

        order.activityLog.push({
            action: "Machine Received",
            note: `Dealer confirmed physical receipt of the machine by ${req.user.name}`,
            performedBy: req.user.name
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error confirming order receipt", error: error.message });
    }
};

// Confirm Installation (Circle 8)
export const markInstallationComplete = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Advancing to the next circle: Warranty Registration
        order.currentStage = "Warranty Registration";
        order.stageProgress = 95;

        order.activityLog.push({
            action: "Installation Completed",
            note: `Machine installation was marked as complete by ${req.user.name}`,
            performedBy: req.user.name
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error marking installation as complete", error: error.message });
    }
};

// Register Warranty (Circle 9 / Final Stage)
export const registerWarranty = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const { machineSerialNumber, engineNumber, warrantyStartDate, warrantyEndDate, warrantyMonths, maintenanceService } = req.body;
 
        order.warrantyDetails = {
            machineSerialNumber,
            engineNumber,
            warrantyStartDate: warrantyStartDate ? new Date(warrantyStartDate) : new Date(),
            warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
            warrantyMonths: Number(warrantyMonths) || 0,
            maintenanceService: maintenanceService || "None"
        };

        if (req.file) {
            if (!order.documents) order.documents = {};
            order.documents.warranty = {
                url: req.file.location,
                uploadedAt: new Date()
            };
        }

        order.currentStage = "Closure";
        order.stageProgress = 100;

        order.activityLog.push({
            action: "Warranty Registered",
            note: `Warranty configured for SN: ${machineSerialNumber} and moved to Closed status by ${req.user.name}`,
            performedBy: req.user.name
        });

        await order.save();

        // Auto-create maintenance record if a maintenance tier is selected
        if (maintenanceService && maintenanceService !== "None") {
            try {
                for (const item of order.products) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        const intervalMonths = 3; // Default interval
                        // Or if the product happens to have an interval set, use it:
                        // const intervalMonths = product.maintenanceIntervalMonths || 3;
                        const startDate = warrantyStartDate ? new Date(warrantyStartDate) : new Date();
                        const dueDate = new Date(startDate);
                        dueDate.setMonth(dueDate.getMonth() + intervalMonths);

                        // Resolve dealer name
                        let dealerName = order.metadata?.DealerName || "";

                        await Maintenance.create({
                            orderId: order._id,
                            productId: item.productId,
                            dealerId: order.dealerId,
                            dealerName,
                            productSerial: machineSerialNumber || "",
                            productName: product.name,
                            serviceType: maintenanceService,
                            dueDate,
                            status: "Upcoming"
                        });
                    }
                }
            } catch (maintErr) {
                console.error("Auto-maintenance scheduling warning:", maintErr.message);
            }
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error registering warranty", error: error.message });
    }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const order = await Order.findById(req.params.id).session(session);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.currentStage === "Closure") {
            return res.status(400).json({ message: "Cannot cancel a closed order" });
        }

        // --- BEGIN TRANSACTION ---
        session.startTransaction();

        order.currentStage = "Cancelled";
        order.paymentStatus = "Cancelled";
        order.deliveryStatus = "Cancelled";
        order.stageProgress = 0;

        order.activityLog.push({
            action: "Order Cancelled",
            note: `Order was cancelled by ${req.user?.name || "User"}`,
            performedBy: req.user?.name || "User"
        });

        // Restore Stock atomically if it was deducted
        const hasStockDeducted = order.activityLog.some(log => log.action === "Stock Deducted");
        if (hasStockDeducted) {
            await restoreStockForOrder(order._id, session);
            order.activityLog.push({
                action: "Stock Restored",
                note: "Inventory levels restored following cancellation.",
                performedBy: "System"
            });
        }

        await order.save({ session });
        await session.commitTransaction();
        // --- END TRANSACTION ---

        res.json(order);
    } catch (error) {
        await session.abortTransaction();
        console.error("Error cancelling order (transaction rolled back):", error);
        res.status(500).json({ message: "Error cancelling order", error: error.message });
    } finally {
        session.endSession();
    }
};
// Admin overriding the order status (Stage Jumping)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, progress } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const oldStatus = order.currentStage;
        order.currentStage = status;
        if (progress !== undefined) order.stageProgress = progress;

        order.activityLog.push({
            action: "Stage Override",
            note: `Administrative override: moved from ${oldStatus} to ${status} by ${req.user?.name || "Super Admin"}`,
            performedBy: req.user?.name || "Super Admin"
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error overriding status", error: error.message });
    }
};

// Upload Additional Document
export const uploadAdditionalDocument = async (req, res) => {
    try {
        const { name } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!order.documents) order.documents = {};
        if (!order.documents.additional) order.documents.additional = [];

        const existingIndex = order.documents.additional.findIndex(d => d.name === name);
        if (existingIndex !== -1) {
            order.documents.additional[existingIndex] = {
                name,
                url: req.file.location,
                uploadedAt: new Date()
            };
            order.markModified("documents.additional");
            order.activityLog.push({
                action: "Additional Document Updated",
                note: `Document "${name}" updated by ${req.user?.name || "User"}`,
                performedBy: req.user?.name || "User"
            });
        } else {
            order.documents.additional.push({
                name: name || req.file.originalname,
                url: req.file.location,
                uploadedAt: new Date()
            });
            order.activityLog.push({
                action: "Additional Document Uploaded",
                note: `Document "${name || req.file.originalname}" uploaded by ${req.user?.name || "User"}`,
                performedBy: req.user?.name || "User"
            });
        }

        await order.save();
        res.json(order);
    } catch (error) {
        console.error("Additional document upload error:", error);
        res.status(500).json({ message: "Error uploading additional document", error: error.message });
    }
};

// Delete Additional Document
export const deleteAdditionalDocument = async (req, res) => {
    try {
        const { name } = req.params;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!order.documents?.additional || order.documents.additional.length === 0) {
            return res.status(400).json({ message: "No additional documents found" });
        }

        const docIndex = order.documents.additional.findIndex(d => d.name === name);
        if (docIndex === -1) {
            return res.status(404).json({ message: "Document not found" });
        }

        order.documents.additional.splice(docIndex, 1);
        order.markModified("documents.additional");

        order.activityLog.push({
            action: "Additional Document Deleted",
            note: `Document "${name}" deleted by ${req.user?.name || "User"}`,
            performedBy: req.user?.name || "User"
        });

        await order.save();
        res.json(order);
    } catch (error) {
        console.error("Delete additional document error:", error);
        res.status(500).json({ message: "Error deleting document", error: error.message });
    }
};

// Delete Primary Document
export const deletePrimaryDocument = async (req, res) => {
    try {
        const { type } = req.params; // po, payment, lovolInvoice, dealerInvoice
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const validTypes = ["po", "payment", "lovolInvoice", "dealerInvoice", "warranty"];
        if (!validTypes.includes(type) || !order.documents?.[type]) {
            return res.status(400).json({ message: "Invalid document type or document not found" });
        }

        const docName = type.toUpperCase();
        order.documents[type] = undefined;
        order.markModified("documents");

        order.activityLog.push({
            action: `${docName} Deleted`,
            note: `${docName} removed by ${req.user?.name || "User"}`,
            performedBy: req.user?.name || "User"
        });

        await order.save();
        res.json(order);
    } catch (error) {
        console.error("Delete primary document error:", error);
        res.status(500).json({ message: "Error deleting document", error: error.message });
    }
};

// Request Document from Dealer
export const requestDocument = async (req, res) => {
    try {
        const { name } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Add to documents.additional as a placeholder if name provided
        if (name) {
            if (!order.documents) order.documents = {};
            if (!order.documents.additional) order.documents.additional = [];
            order.documents.additional.push({
                name,
                url: null, // Placeholder
                uploadedAt: new Date()
            });
        }

        order.activityLog.push({
            action: "Document Requested",
            note: `Administrator (${req.user?.name || "Admin"}) requested document: ${name || "Additional Documentation"}`,
            performedBy: req.user?.name || "Admin"
        });

        await order.save();
        res.json(order);
    } catch (error) {
        console.error("Request document error:", error);
        res.status(500).json({ message: "Error requesting document", error: error.message });
    }
};
