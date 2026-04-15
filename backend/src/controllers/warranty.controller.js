import { WarrantyClaim } from "../models/warranty.model.js";
import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Product } from "../models/product.model.js";

// Create a new warranty claim
export const createClaim = async (req, res) => {
    try {
        const user = req.user;
        let { dealerId, productId, machineSerialNumber, issueDescription, customerName, buyerType } = req.body;

        // --- RBAC: Determine dealerId based on role ---
        if (user.role === "Dealer") {
            // Dealer can only file for their own dealership
            dealerId = user.dealerId;
            buyerType = "Dealer";
        } else if (user.role === "Distributor") {
            // Distributor can only file for their OWN network, effectively acting as "User"
            dealerId = user._id;
            buyerType = "User";
        } else if (user.role === "Super Admin") {
            // Super Admin can create for any dealer or distributor
            if (!dealerId) return res.status(400).json({ message: "Dealer/Distributor ID is required." });
            buyerType = buyerType || "Dealer"; // Default to Dealer if not provided
        } else {
            return res.status(403).json({ message: "You do not have permission to create warranty claims." });
        }
        // --- End RBAC ---

        let dealer;
        if (buyerType === "Dealer") {
            dealer = await Dealer.findById(dealerId);
        } else {
            // When buyerType is "User", it's a distributor
            dealer = await import('../models/user.model.js').then(m => m.User.findById(dealerId)); 
            // Mock a dealer-like object for metadata
            if (dealer) {
                dealer = {
                    companyName: dealer.name + " (Distributor)",
                    metadata: { DistributorName: "Self" }
                };
            }
        }
        if (!dealer) return res.status(404).json({ message: "Buyer not found" });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Try to find the original order for this machine serial number to auto-populate
        const originalOrder = await Order.findOne({ "warrantyDetails.machineSerialNumber": machineSerialNumber });

        const claimNumber = `WC-2026-${Date.now().toString().slice(-6)}`;

        const newClaim = new WarrantyClaim({
            claimNumber,
            orderId: originalOrder?._id,
            buyerType,
            dealerId,
            distributorId: buyerType === "Dealer" ? dealer.distributorId : dealerId,
            createdBy: user._id,
            customerName: customerName || "",
            metadata: {
                DealerName: dealer.companyName || dealer.name,
                DistributorName: dealer.metadata?.DistributorName
            },
            productId,
            machineSerialNumber,
            engineNumber: originalOrder?.warrantyDetails?.engineNumber,
            issueDescription,
            status: "Complaint Received",
            stageProgress: 10,
            activityLog: [{
                action: "Claim Created",
                note: `Claim initiated for SN: ${machineSerialNumber} by ${dealer.companyName || dealer.name}`,
                performedBy: user?.name || "System"
            }]
        });

        await newClaim.save();

        // Populate the new claim before returning to ensure frontend can display names immediately
        const populatedClaim = await WarrantyClaim.findById(newClaim._id)
            .populate("dealerId", "companyName ownerName code name")
            .populate("distributorId", "name")
            .populate("productId", "name sku");

        res.status(201).json(populatedClaim);
    } catch (error) {
        console.error("Error creating warranty claim:", error);
        res.status(500).json({ message: "Error creating claim", error: error.message });
    }
};

// Get all claims
export const getClaims = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        if (user.role === "Dealer") {
            query = { dealerId: user.dealerId, buyerType: "Dealer" };
        } else if (user.role === "Distributor") {
            const dealers = await Dealer.find({ distributorId: user._id });
            const dealerIds = dealers.map(d => d._id);
            // Distributor can see their own claims OR their dealers' claims
            query = {
                $or: [
                    { dealerId: user._id, buyerType: "User" },
                    { dealerId: { $in: dealerIds }, buyerType: "Dealer" }
                ]
            };
        }

        const claims = await WarrantyClaim.find(query)
            .populate("dealerId", "companyName ownerName code name")
            .populate("distributorId", "name")
            .populate("productId", "name sku")
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (error) {
        console.error("Fetch claims error:", error);
        res.status(500).json({ message: "Error fetching claims", error: error.message });
    }
};

// Get claim by ID
export const getClaimById = async (req, res) => {
    try {
        const user = req.user;
        const claim = await WarrantyClaim.findById(req.params.id)
            .populate("dealerId", "companyName ownerName code contact email address region name")
            .populate("distributorId", "name email")
            .populate("productId", "name sku category description");

        if (!claim) return res.status(404).json({ message: "Claim not found" });

        // Security: Role-based access control for specific claim
        if (user.role === "Dealer" && String(claim.dealerId?._id || claim.dealerId) !== String(user.dealerId)) {
            return res.status(403).json({ message: "Unauthorized access to this warranty claim." });
        }

        if (user.role === "Distributor") {
            if (claim.buyerType === "User" && String(claim.dealerId?._id || claim.dealerId) === String(user._id)) {
                // Distributor's own claim: OK
            } else if (claim.buyerType === "Dealer") {
                 const dealer = await Dealer.findOne({ _id: claim.dealerId?._id || claim.dealerId, distributorId: user._id });
                 if (!dealer) {
                     return res.status(403).json({ message: "Unauthorized access to this claim (not your dealer)." });
                 }
            } else {
                 return res.status(403).json({ message: "Unauthorized access to this claim." });
            }
        }

        res.json(claim);
    } catch (error) {
        console.error("Fetch claim by ID error:", error);
        res.status(500).json({ message: "Error fetching claim", error: error.message });
    }
};

// Update claim status (Advance to next stage)
export const updateClaimStatus = async (req, res) => {
    try {
        const { status, note, extraData } = req.body;
        const user = req.user;
        const claim = await WarrantyClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        // Security Check: Read-Only for Distributors on Dealer claims
        if (user.role === "Distributor") {
            if (claim.buyerType === "Dealer") {
                 return res.status(403).json({ message: "Read-only access: Distributors cannot modify claims originating from their dealers." });
            }
            if (String(claim.dealerId) !== String(user._id)) {
                 return res.status(403).json({ message: "Unauthorized to update this claim." });
            }
        }

        const STAGES = [
            "Complaint Received",
            "Technician Assigned",
            "Initial Inspection",
            "LOVOL Review",
            "HO Review",
            "Claim Approved",
            "Parts Processing",
            "Parts Dispatched",
            "Parts Received",
            "Repair & Collection",
            "Closed"
        ];

        // --- Stage-based RBAC Enforcements ---
        const isSuperAdminStage = ["LOVOL Review", "HO Review", "Claim Approved", "Parts Processing", "Parts Dispatched", "Repair & Collection"].includes(status);
        const isCreatorStage = ["Complaint Received", "Technician Assigned", "Initial Inspection", "Parts Received", "Closed"].includes(status);

        if (isSuperAdminStage && user.role !== "Super Admin") {
             return res.status(403).json({ message: "Only Super Admins can advance the claim to the " + status + " stage." });
        }

        if (isCreatorStage && !["Super Admin", "Admin"].includes(user.role)) {
             // If not an admin, they MUST be the person who created the claim
             // Handle legacy data: if createdBy is missing, we allow it (or check dealerId)
             if (claim.createdBy && String(claim.createdBy) !== String(user._id)) {
                 return res.status(403).json({ message: "Only the claim creator or an administrator can update this stage." });
             }
        }
        // --- End RBAC ---

        if (!STAGES.includes(status) && status !== "Rejected") {
            return res.status(400).json({ message: "Invalid status" });
        }

        if (status && STAGES.includes(status)) {
            claim.status = status;
            // Update progress based on stage index
            const index = STAGES.indexOf(status);
            claim.stageProgress = (index + 1) * 10;
        }

        // Handle specific stage data provided by frontend
        if (extraData) {
            if (extraData.technicianName) claim.technicianName = extraData.technicianName;
            
            if (extraData.inspectionNotes) claim.inspectionNotes = extraData.inspectionNotes;
            
            if (extraData.evaluationNotes) claim.evaluationNotes = extraData.evaluationNotes;
            
            if (extraData.hoNotes || status === "Claim Approved") {
                claim.hoApproval = {
                    ...claim.hoApproval,
                    status: status === "Claim Approved" ? "Approved" : claim.hoApproval?.status || "Pending",
                    notes: extraData.hoNotes || claim.hoApproval?.notes
                };
                if (status === "Claim Approved") {
                    claim.hoApproval.approvedBy = req.user?.name || "HO User";
                    claim.hoApproval.approvedAt = new Date();
                }
            }
            
            if (extraData.parts) {
                claim.partsRequested = extraData.parts;
            }
            
            if (extraData.transportName || extraData.trackingId) {
                claim.dispatchDetails = {
                    transportName: extraData.transportName || claim.dispatchDetails?.transportName,
                    trackingId: extraData.trackingId || claim.dispatchDetails?.trackingId,
                    dispatchedAt: new Date()
                };
                if (claim.partsRequested) {
                    claim.partsRequested = claim.partsRequested.map(p => ({ ...p, status: "Dispatched" }));
                }
            }
            
            if (extraData.installationNotes) claim.installationNotes = extraData.installationNotes;
            
            if (extraData.damagedPartsCollected !== undefined) {
                claim.damagedPartsCollected = extraData.damagedPartsCollected;
                if (claim.partsRequested) {
                    claim.partsRequested = claim.partsRequested.map(p => ({ ...p, status: "Received" }));
                }
            }
        }

        claim.activityLog.push({
            action: status || "Status Updated",
            note: note || `Claim status updated to ${status}`,
            performedBy: req.user?.name || "System"
        });

        await claim.save();

        const populatedClaim = await WarrantyClaim.findById(claim._id)
            .populate("dealerId", "companyName ownerName code contact email address region name")
            .populate("productId", "name sku category description");

        res.json(populatedClaim);
    } catch (error) {
        console.error("Error updating claim status:", error);
        res.status(500).json({ message: "Error updating claim", error: error.message });
    }
};

// Add Media
export const addMedia = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const { stage, notes } = req.body;
        const user = req.user;
        const claim = await WarrantyClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        // Security Check: Read-Only for Distributors on Dealer claims
        if (user.role === "Distributor") {
            if (claim.buyerType === "Dealer") {
                 return res.status(403).json({ message: "Read-only access: Distributors cannot modify claims originating from their dealers." });
            }
             if (String(claim.dealerId) !== String(user._id)) {
                 return res.status(403).json({ message: "Unauthorized to update this claim." });
            }
        }

        claim.media.push({
            url: req.file.location,
            type: req.file.mimetype.startsWith("video/") ? "video" : "image",
            stage: stage || claim.status,
            notes: notes || "",
            uploadedAt: new Date()
        });

        claim.activityLog.push({
            action: "Media Uploaded",
            note: `New media uploaded during stage: ${stage || claim.status}`,
            performedBy: req.user?.name || "System"
        });

        await claim.save();

        const populatedClaim = await WarrantyClaim.findById(claim._id)
            .populate("dealerId", "companyName ownerName code contact email address region name")
            .populate("productId", "name sku category description");

        res.json(populatedClaim);
    } catch (error) {
        console.error("Error uploading media:", error);
        res.status(500).json({ message: "Error uploading media", error: error.message });
    }
};

// Get products purchased by a dealer (from warranty-registered orders) with warranty days remaining
export const getCustomerProducts = async (req, res) => {
    try {
        let { dealerId, buyerType } = req.query;
        const user = req.user;

        let bType = buyerType || "Dealer";
        
        // --- RBAC Enforcements ---
        if (user.role === "Dealer") {
            dealerId = user.dealerId;
            bType = "Dealer";
        } else if (user.role === "Distributor") {
            if (!dealerId) {
                return res.status(400).json({ message: "dealerId is required for distributors" });
            }
            if (dealerId !== String(user._id)) {
                 const dealerCheck = await Dealer.findOne({ _id: dealerId, distributorId: user._id });
                 if (!dealerCheck) {
                     return res.status(403).json({ message: "Access denied: Cannot fetch products for a dealer outside your network." });
                 }
                 bType = "Dealer";
            } else {
                 bType = "User";
            }
        } else if (user.role === "Super Admin") {
            if (!dealerId) return res.status(400).json({ message: "dealerId is required" });
        } else {
            return res.status(403).json({ message: "Unauthorized." });
        }
        // --- End RBAC ---
        
        // Find all orders for this dealer/distributor that have warranty details registered
        const orders = await Order.find({
            dealerId,
            buyerType: bType,
            "warrantyDetails.machineSerialNumber": { $exists: true, $ne: null }
        }).populate("products.productId", "name sku category");

        const now = new Date();
        const results = orders.map(order => {
            const wd = order.warrantyDetails;
            const endDate = wd.warrantyEndDate ? new Date(wd.warrantyEndDate) : null;
            const daysRemaining = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;

            // Get product info from the order's products array
            const productInfo = order.products?.[0]?.productId;

            return {
                orderId: order._id,
                orderNumber: order.orderNumber,
                productId: productInfo?._id || order.products?.[0]?.productId,
                productName: productInfo?.name || "Unknown Product",
                sku: productInfo?.sku || "",
                machineSerialNumber: wd.machineSerialNumber,
                engineNumber: wd.engineNumber || "",
                warrantyStartDate: wd.warrantyStartDate,
                warrantyEndDate: wd.warrantyEndDate,
                warrantyMonths: wd.warrantyMonths,
                daysRemaining: daysRemaining,
                isExpired: daysRemaining !== null && daysRemaining <= 0
            };
        });

        res.json(results);
    } catch (error) {
        console.error("Error fetching customer products:", error);
        res.status(500).json({ message: "Error fetching customer products", error: error.message });
    }
};
