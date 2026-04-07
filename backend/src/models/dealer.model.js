import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema(
    {
        companyName: { type: String, required: true },
        ownerName: { type: String, required: true },
        contact: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        address: { type: String, required: true },
        region: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        status: { type: String, enum: ["Pending", "Approved", "Rejected", "Suspended"], default: "Pending" },
        creditLimit: { type: Number, default: 0 },
        performanceScore: { type: Number, default: 0 },
        companyType: { type: String, enum: ["LLP", "Pvt Ltd", "Proprietorship"], required: true },
        kycDocuments: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                uploadedAt: { type: Date, default: Date.now }
            }
        ],
        distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        metadata: {
            DistributorName: { type: String },
            DealerName: { type: String }
        },
    },
    { timestamps: true }
);

export const Dealer = mongoose.models.Dealer || mongoose.model("Dealer", dealerSchema);
