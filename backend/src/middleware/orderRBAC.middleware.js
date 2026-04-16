import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";

/**
 * Middleware: Ensures the requesting user is either the Super Admin,
 * the creator (owner) of the order, or the linked dealer/distributor.
 * Uses Safe ID extraction to handle populated Mongoose objects.
 */
export const isOrderOwnerOrAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized - User not found" });
        }

        // Super Admin bypasses all ownership checks
        if (user.role === "Super Admin") {
            return next();
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Safe ID extraction (handles both raw ObjectId and populated objects)
        const userId = String(user._id?._id || user._id);
        const userDealerId = user.dealerId ? String(user.dealerId._id || user.dealerId) : null;
        const orderDealerId = String(order.dealerId?._id || order.dealerId);
        const orderCreatedBy = order.createdBy ? String(order.createdBy?._id || order.createdBy) : null;

        // Check if the current user is the creator of this order
        if (orderCreatedBy && orderCreatedBy === userId) {
            return next();
        }

        // Dealer who is linked to this order
        if (user.role === "Dealer" && userDealerId && orderDealerId === userDealerId) {
            return next();
        }

        // Distributor: allow if order belongs to one of their dealers or assigned to them
        if (user.role === "Distributor") {
            // Check if distributor is the buyer
            if (orderDealerId === userId) {
                return next();
            }
            // Check if the order's dealer belongs to this distributor
            const isOwnDealer = await Dealer.findOne({ _id: order.dealerId, distributorId: user._id });
            if (isOwnDealer) {
                return next();
            }
            // Check assignedDistributorId
            const orderDistId = order.assignedDistributorId ? String(order.assignedDistributorId?._id || order.assignedDistributorId) : null;
            if (orderDistId && orderDistId === userId) {
                return next();
            }
        }

        // If none of the above, the user is NOT the owner → read-only
        return res.status(403).json({
            message: "Access denied: You have read-only access to this order."
        });
    } catch (error) {
        console.error("Order RBAC middleware error:", error);
        return res.status(500).json({ message: "Server error in authorization check" });
    }
};
