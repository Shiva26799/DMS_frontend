import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";

/**
 * Middleware: Ensures the requesting user is either the Super Admin,
 * or the creator (owner) of the order.
 * Distributors who did NOT create the order get read-only access (blocked on mutations).
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

        // Check if the current user is the creator of this order
        if (order.createdBy && String(order.createdBy) === String(user._id)) {
            return next();
        }

        // Dealer who is linked to this order (legacy orders without createdBy)
        if (user.role === "Dealer" && String(order.dealerId) === String(user.dealerId)) {
            return next();
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
