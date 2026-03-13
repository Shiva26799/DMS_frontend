import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema(
    {
        companyName: { type: String, required: true },
        ownerName: { type: String, required: true },
        contact: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        address: { type: String, required: true },
        status: { type: String, enum: ["Pending", "Approved", "Rejected", "Suspended"], default: "Pending" },
        creditLimit: { type: Number, default: 0 },
        performanceScore: { type: Number, default: 0 },
        kycDocuments: [{ type: String }],
    },
    { timestamps: true }
);

export const Dealer = mongoose.model("Dealer", dealerSchema);
