import mongoose from "mongoose";

const companyInfoSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        gstin: { type: String, required: true },
        pan: { type: String, required: true },
        address: { type: String, required: true },
        website: { type: String, required: true },
        contact: { type: String, required: true },
        email: { type: String, required: true },
        logoUrl: { type: String },
    },
    { timestamps: true }
);

export const CompanyInfo = mongoose.models.CompanyInfo || mongoose.model("CompanyInfo", companyInfoSchema);
