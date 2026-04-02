import { WarrantyClaim } from "../models/warranty.model.js";
import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Product } from "../models/product.model.js";

// Create a new warranty claim
export const createClaim = async (req, res) => {
    try {
        const { dealerId, productId, machineSerialNumber, issueDescription } = req.body;

        const dealer = await Dealer.findById(dealerId);
        if (!dealer) return res.status(404).json({ message: "Dealer not found" });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Try to find the original order for this machine serial number to auto-propulate
        const originalOrder = await Order.findOne({ "warrantyDetails.machineSerialNumber": machineSerialNumber });
        
        const claimNumber = `WC-2026-${Date.now().toString().slice(-6)}`;

        const newClaim = new WarrantyClaim({
            claimNumber,
            orderId: originalOrder?._id,
            dealerId,
            productId,
            machineSerialNumber,
            engineNumber: originalOrder?.warrantyDetails?.engineNumber,
            issueDescription,
            status: "Complaint Received",
            stageProgress: 10,
            activityLog: [{
                action: "Claim Created",
                note: `Claim initiated for SN: ${machineSerialNumber} by ${dealer.companyName}`,
                performedBy: req.user?.name || "System"
            }]
        });

        await newClaim.save();
        res.status(201).json(newClaim);
    } catch (error) {
        console.error("Error creating warranty claim:", error);
        res.status(500).json({ message: "Error creating claim", error: error.message });
    }
};

// Get all claims
export const getClaims = async (req, res) => {
    try {
        const claims = await WarrantyClaim.find()
            .populate("dealerId", "companyName ownerName code")
            .populate("productId", "name sku")
            .sort({ createdAt: -1 });
        res.json(claims);
    } catch (error) {
        res.status(500).json({ message: "Error fetching claims", error: error.message });
    }
};

// Get claim by ID
export const getClaimById = async (req, res) => {
    try {
        const claim = await WarrantyClaim.findById(req.params.id)
            .populate("dealerId", "companyName ownerName code contact email address region")
            .populate("productId", "name sku category description");

        if (!claim) return res.status(404).json({ message: "Claim not found" });
        res.json(claim);
    } catch (error) {
        res.status(500).json({ message: "Error fetching claim", error: error.message });
    }
};

// Update claim status (Advance to next stage)
export const updateClaimStatus = async (req, res) => {
    try {
        const { status, note, extraData } = req.body;
        const claim = await WarrantyClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        const STAGES = [
            "Complaint Received",
            "Technician Assigned",
            "Initial Inspection",
            "LOVOL Review",
            "HO Review",
            "Claim Approved",
            "Parts Processing",
            "Parts Dispatched",
            "Repair & Collection",
            "Closed"
        ];

        if (status && STAGES.includes(status)) {
            claim.status = status;
            // Update progress based on stage index
            const index = STAGES.indexOf(status);
            claim.stageProgress = (index + 1) * 10;
        }

        // Handle specific stage data
        if (extraData) {
            if (status === "Technician Assigned") {
                claim.technicianName = extraData.technicianName;
            } else if (status === "Initial Inspection") {
                claim.inspectionNotes = extraData.inspectionNotes;
            } else if (status === "LOVOL Review") {
                claim.evaluationNotes = extraData.evaluationNotes;
            } else if (status === "HO Review") {
                claim.hoApproval = {
                    ...claim.hoApproval,
                    notes: extraData.hoNotes
                };
            } else if (status === "Claim Approved") {
                claim.hoApproval = {
                    status: "Approved",
                    approvedBy: req.user?.name || "HO User",
                    approvedAt: new Date(),
                    notes: extraData.approvalNotes
                };
            } else if (status === "Parts Processing") {
                claim.partsRequested = extraData.parts; // Array: [{ partName, partNumber, quantity }]
            } else if (status === "Parts Dispatched") {
                claim.dispatchDetails = {
                    transportName: extraData.transportName,
                    trackingId: extraData.trackingId,
                    dispatchedAt: new Date()
                };
                // Auto-advance parts status
                claim.partsRequested = claim.partsRequested.map(p => ({ ...p, status: "Dispatched" }));
            } else if (status === "Repair & Collection") {
                claim.installationNotes = extraData.installationNotes;
                claim.damagedPartsCollected = extraData.damagedPartsCollected;
                // Auto-advance parts status
                claim.partsRequested = claim.partsRequested.map(p => ({ ...p, status: "Received" }));
            }
        }

        claim.activityLog.push({
            action: status || "Status Updated",
            note: note || `Claim status updated to ${status}`,
            performedBy: req.user?.name || "System"
        });

        await claim.save();
        res.json(claim);
    } catch (error) {
        console.error("Error updating claim status:", error);
        res.status(500).json({ message: "Error updating claim", error: error.message });
    }
};

// Add Media
export const addMedia = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const claim = await WarrantyClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        claim.media.push({
            url: req.file.location,
            type: req.file.mimetype.startsWith("image") ? "image" : "video",
            uploadedAt: new Date()
        });

        claim.activityLog.push({
            action: "Media Uploaded",
            note: `New ${req.file.mimetype.startsWith("image") ? "image" : "video"} uploaded`,
            performedBy: req.user?.name || "User"
        });

        await claim.save();
        res.json(claim);
    } catch (error) {
        res.status(500).json({ message: "Error uploading media", error: error.message });
    }
};
