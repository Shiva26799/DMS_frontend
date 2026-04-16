import { WarrantyClaim } from "../models/warranty.model.js";
import { Dealer } from "../models/dealer.model.js";

/**
 * Middleware: Ensures the requesting user can manage a specific warranty claim.
 * Uses Safe ID extraction to handle populated Mongoose objects.
 * - Super Admin: Full access.
 * - Distributor: Access to claims from their subordinate dealers, or their own claims.
 * - Dealer: Access only to their own claims.
 */
export const canManageClaim = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        // Super Admin bypasses all checks
        if (user.role === "Super Admin") return next();

        const claim = await WarrantyClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        // Safe ID extraction
        const userId = String(user._id?._id || user._id);
        const userDealerId = user.dealerId ? String(user.dealerId._id || user.dealerId) : null;
        const claimDealerId = String(claim.dealerId?._id || claim.dealerId);

        if (user.role === "Dealer") {
            if (claimDealerId !== userDealerId) {
                return res.status(403).json({ message: "Access denied: This claim does not belong to your dealership." });
            }
            return next();
        }

        if (user.role === "Distributor") {
            // Distributor's own claim (buyerType === "User")
            if (claimDealerId === userId) {
                return next();
            }
            // Check if dealer belongs to this distributor
            const dealer = await Dealer.findOne({ _id: claim.dealerId?._id || claim.dealerId, distributorId: user._id?._id || user._id });
            if (dealer) {
                return next();
            }
            return res.status(403).json({ message: "Access denied: This dealer is not under your distribution network." });
        }

        return res.status(403).json({ message: "Access denied." });
    } catch (error) {
        console.error("Warranty RBAC middleware error:", error);
        return res.status(500).json({ message: "Server error in authorization check" });
    }
};

/**
 * Middleware: Restricts sensitive stage transitions to Super Admin only.
 * Stages: HO Review, Claim Approved, Rejected.
 */
export const isHOApprover = (req, res, next) => {
    const user = req.user;
    const { status } = req.body;

    const hoStages = ["HO Review", "Claim Approved", "Rejected"];

    if (hoStages.includes(status) && user.role !== "Super Admin") {
        return res.status(403).json({
            message: `Access denied: Only HO (Super Admin) can advance a claim to '${status}'.`
        });
    }

    next();
};
