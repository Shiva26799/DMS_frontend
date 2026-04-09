import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Product } from "../models/product.model.js";
import { Lead } from "../models/lead.model.js";
import { deductStockFromOrder } from "../services/inventory.service.js";

// Create a new order
export const createOrder = async (req, res) => {
    try {
        const { dealerId, warehouseId, orderSource, products } = req.body; // products: [{ productId, quantity, price }]

        const dealer = await Dealer.findById(dealerId);
        if (!dealer) {
            return res.status(404).json({ message: "Dealer not found" });
        }

        let totalValue = 0;
        const itemizedProducts = [];

        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }
            const price = Number(item.price) || product.price;
            const quantity = Number(item.quantity) || 1;
            totalValue += price * quantity;

            itemizedProducts.push({
                productId: item.productId,
                quantity,
                price
            });
        }

        const orderNumber = `ORD-2026-${Date.now().toString().slice(-6)}`;

        const isOwnStock = orderSource === "Own Stock";
        const initialStage = "PO Upload";
        const initialProgress = 10;

        // For Own Stock, we might eventually skip some middle stages or allow faster approval

        const newOrder = new Order({
            orderNumber,
            dealerId,
            warehouseId: isOwnStock ? undefined : warehouseId,
            orderSource: orderSource || "Warehouse",
            assignedDistributorId: dealer.distributorId,
            createdBy: req.user._id,
            metadata: {
                DealerName: dealer.companyName,
                DistributorName: dealer.metadata?.DistributorName
            },
            products: itemizedProducts,
            totalValue,
            currentStage: initialStage,
            stageProgress: initialProgress,
            activityLog: [{
                action: "Order Created",
                note: `Order created (${orderSource || "Warehouse"}). Total Value: ₹${totalValue}`,
                performedBy: req.user?.name || "System"
            }]
        });

        await newOrder.save();
        const populatedOrder = await Order.findById(newOrder._id)
            .populate("dealerId", "companyName ownerName code")
            .populate("products.productId", "name price sku");

        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Error creating order", error: error.message });
    }
};

// Get all orders
export const getOrders = async (req, res) => {
    try {
        const user = req.user;
        let query = {};

        if (user.role === "Dealer") {
            query = { dealerId: user.dealerId };
        } else if (user.role === "Distributor") {
            const dealers = await Dealer.find({ distributorId: user._id });
            const dealerIds = dealers.map(d => d._id);
            query = { dealerId: { $in: dealerIds } };
        }

        const orders = await Order.find(query)
            .populate("dealerId", "companyName ownerName code")
            .populate("products.productId", "name price sku")
            .sort({ createdAt: -1 });
        res.json(orders);
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
            .populate("dealerId", "companyName ownerName code contact email address region")
            .populate("products.productId", "name price sku category description");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Security: Role-based access control for specific order
        if (user.role === "Dealer" && String(order.dealerId?._id || order.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized access to this order." });
        }

        let readOnly = false;

        if (user.role === "Distributor") {
            const dealer = await Dealer.findOne({ _id: order.dealerId, distributorId: user._id });
            if (!dealer) {
                return res.status(403).json({ message: "Unauthorized access to this order (not your dealer)." });
            }
            // Distributors get read-only unless they are the creator
            if (!order.createdBy || String(order.createdBy) !== String(user._id)) {
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

        // Permission check: Super Admin or the concerned Dealer
        const isDealer = req.user.role === "Dealer";
        if (isDealer && String(order.dealerId) !== String(req.user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized: You can only approve payments for your own orders." });
        }

        order.paymentStatus = "Paid";
        order.currentStage = "Order Approval";
        order.stageProgress = 40; // End of Circle 3

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

        // Permission check: Super Admin or the concerned Dealer (if Own Stock)
        const isDealer = req.user.role === "Dealer";
        if (isDealer && String(order.dealerId) !== String(req.user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized." });
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

        // Advancing to the next circle: Delivery
        order.currentStage = "Delivery";
        order.stageProgress = 75;

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

        try {
            // Trigger Stock Deduction
            await deductStockFromOrder(order._id);
            order.activityLog.push({
                action: "Stock Deducted",
                note: `Inventory successfully updated for ${order.orderSource} sources.`,
                performedBy: "System"
            });
        } catch (stockError) {
            console.error("Stock deduction failed during dispatch:", stockError);
            return res.status(400).json({ message: `Dispatch failed: ${stockError.message}` });
        }

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

        const { machineSerialNumber, engineNumber, warrantyStartDate, warrantyEndDate } = req.body;

        order.warrantyDetails = {
            machineSerialNumber,
            engineNumber,
            warrantyStartDate: warrantyStartDate ? new Date(warrantyStartDate) : new Date(),
            warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null
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
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error registering warranty", error: error.message });
    }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Only allow cancellation if not already closed/delivered/cancelled?
        // For now, let's allow it if it's not "Closure"
        if (order.currentStage === "Closure") {
            return res.status(400).json({ message: "Cannot cancel a closed order" });
        }

        order.currentStage = "Cancelled";
        order.paymentStatus = "Cancelled";
        order.deliveryStatus = "Cancelled";
        order.stageProgress = 0;

        order.activityLog.push({
            action: "Order Cancelled",
            note: `Order was cancelled by ${req.user?.name || "User"}`,
            performedBy: req.user?.name || "User"
        });

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error cancelling order", error: error.message });
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
// Create order from a lead (Conversion)
export const createOrderFromLead = async (req, res) => {
    try {
        const { leadId, warehouseId, orderSource } = req.body;
        const lead = await Lead.findById(leadId);
        if (!lead) return res.status(404).json({ message: "Lead not found" });

        const dealer = await Dealer.findById(lead.dealerId);
        if (!dealer) return res.status(404).json({ message: "Dealer not found for this lead" });

        // Find product price if possible, or use a default
        const product = await Product.findOne({ name: lead.product });
        const price = product?.price || lead.value || 0;

        const itemizedProducts = [{
            productId: product?._id,
            quantity: 1,
            price: price
        }];

        const orderNumber = `ORD-LEAD-${Date.now().toString().slice(-6)}`;
        const isOwnStock = (orderSource || "Warehouse") === "Own Stock";

        const newOrder = new Order({
            orderNumber,
            dealerId: lead.dealerId,
            warehouseId: isOwnStock ? undefined : warehouseId,
            orderSource: orderSource || "Warehouse",
            assignedDistributorId: dealer.distributorId,
            createdBy: req.user._id,
            metadata: {
                DealerName: dealer.companyName,
                DistributorName: dealer.metadata?.DistributorName
            },
            products: itemizedProducts,
            totalValue: price,
            currentStage: "PO Upload",
            stageProgress: 10,
            activityLog: [{
                action: "Order Created from Lead",
                note: `Converted from Lead ID: ${leadId}`,
                performedBy: req.user.name
            }]
        });

        await newOrder.save();

        // Update lead status
        lead.status = "Won";
        lead.activityLog.push({
            action: "Converted to Order",
            note: `Order ${orderNumber} created.`,
            performedBy: req.user.name,
            timestamp: new Date()
        });
        await lead.save();

        res.status(201).json(newOrder);
    } catch (error) {
        console.error("Error converting lead to order:", error);
        res.status(500).json({ message: "Conversion failed", error: error.message });
    }
};
