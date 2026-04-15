import mongoose from "mongoose";

const warrantyClaimSchema = new mongoose.Schema(
    {
        claimNumber: { type: String, required: true, unique: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Optional link to original order
        buyerType: { type: String, enum: ["Dealer", "User"], default: "Dealer" },
        dealerId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "buyerType" },
        distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        customerName: { type: String },
        metadata: {
            DistributorName: { type: String },
            DealerName: { type: String }
        },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        machineSerialNumber: { type: String, required: true },
        engineNumber: { type: String },
        
        issueDescription: { type: String, required: true },
        technicianName: { type: String },
        inspectionNotes: { type: String },
        
        media: [
            {
                url: { type: String },
                type: { type: String, enum: ["image", "video"] },
                stage: { type: String },
                notes: { type: String },
                uploadedAt: { type: Date, default: Date.now }
            }
        ],
        
        evaluationNotes: { type: String },
        hoApproval: {
            status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
            approvedBy: { type: String },
            approvedAt: { type: Date },
            notes: { type: String }
        },
        
        partsRequested: [
            {
                partName: { type: String },
                partNumber: { type: String },
                quantity: { type: Number, default: 1 },
                status: { type: String, enum: ["Pending", "Dispatched", "Received"], default: "Pending" }
            }
        ],
        
        dispatchDetails: {
            transportName: { type: String },
            trackingId: { type: String },
            dispatchedAt: { type: Date }
        },
        
        installationNotes: { type: String },
        damagedPartsCollected: { type: Boolean, default: false },
        
        status: {
            type: String,
            enum: [
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
                "Closed",
                "Rejected"
            ],
            default: "Complaint Received"
        },
        
        stageProgress: { type: Number, default: 10 },
        
        activityLog: [
            {
                action: { type: String },
                note: { type: String },
                performedBy: { type: String },
                timestamp: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

export const WarrantyClaim = mongoose.models.WarrantyClaim || mongoose.model("WarrantyClaim", warrantyClaimSchema);
