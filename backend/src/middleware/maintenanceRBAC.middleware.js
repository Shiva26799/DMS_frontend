import { Maintenance } from "../models/maintenance.model.js";
import { Dealer } from "../models/dealer.model.js";

/**
 * Middleware: Ensures the requesting user can view/manage a specific maintenance record.
 * Uses Safe ID extraction to handle populated Mongoose objects.
 * - Super Admin: Full access.
 * - Distributor: Access to records of their subordinate dealers, or their own.
 * - Dealer: Access only to their own records.
 */
export const canManageMaintenance = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        if (user.role === "Super Admin") return next();

        const record = await Maintenance.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Maintenance record not found" });

        // Safe ID extraction
        const userId = String(user._id?._id || user._id);
        const userDealerId = user.dealerId ? String(user.dealerId._id || user.dealerId) : null;
        const recordDealerId = record.dealerId ? String(record.dealerId?._id || record.dealerId) : null;

        if (user.role === "Dealer") {
            if (!recordDealerId || recordDealerId !== userDealerId) {
                return res.status(403).json({ message: "Access denied: This maintenance record does not belong to your dealership." });
            }
            return next();
        }

        if (user.role === "Distributor") {
            // Record might belong to Distributor acting as pseudo-dealer
            if (recordDealerId === userId) {
                return next();
            }

            // Check if dealer belongs to this distributor
            if (recordDealerId) {
                const dealer = await Dealer.findOne({ _id: record.dealerId?._id || record.dealerId, distributorId: user._id?._id || user._id });
                if (dealer) {
                    return next();
                }
            }
            return res.status(403).json({ message: "Access denied: This dealer is not under your distribution network." });
        }

        return res.status(403).json({ message: "Access denied." });
    } catch (error) {
        console.error("Maintenance RBAC middleware error:", error);
        return res.status(500).json({ message: "Server error in authorization check" });
    }
};
