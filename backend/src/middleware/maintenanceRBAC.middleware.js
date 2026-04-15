import { Maintenance } from "../models/maintenance.model.js";
import { Dealer } from "../models/dealer.model.js";

/**
 * Middleware: Ensures the requesting user can view/manage a specific maintenance record.
 * - Super Admin: Full access.
 * - Distributor: Access only to records of their subordinate dealers, or their own (acting as dealer).
 * - Dealer: Access only to their own records.
 */
export const canManageMaintenance = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        if (user.role === "Super Admin") return next();

        const record = await Maintenance.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Maintenance record not found" });

        // Some maintenance records might just have dealerName but not dealerId, handle those or assume they need dealerId
        const recordDealerId = record.dealerId ? String(record.dealerId) : null;

        if (user.role === "Dealer") {
            // Dealer must own the record
            if (recordDealerId !== String(user.dealerId)) {
                return res.status(403).json({ message: "Access denied: This maintenance record does not belong to your dealership." });
            }
            return next();
        }

        if (user.role === "Distributor") {
            // Record might belong to Distributor acting as pseudo-dealer, or a dealer under the distributor
            if (recordDealerId === String(user._id)) {
                return next();
            }

            // Check if dealer belongs to this distributor
            if (recordDealerId) {
                const dealer = await Dealer.findOne({ _id: recordDealerId, distributorId: user._id });
                if (!dealer) {
                    return res.status(403).json({ message: "Access denied: This dealer is not under your distribution network." });
                }
                return next();
            } else {
                 return res.status(403).json({ message: "Access denied: Maintenance record lacks dealer association." });
            }
        }

        return res.status(403).json({ message: "Access denied." });
    } catch (error) {
        console.error("Maintenance RBAC middleware error:", error);
        return res.status(500).json({ message: "Server error in authorization check" });
    }
};
