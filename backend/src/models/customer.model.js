import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
        metadata: {
            DistributorName: { type: String },
            DealerName: { type: String }
        },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        region: { type: String },
        product: { type: String },
        value: { type: Number },
        notes: { type: String },
    },
    { timestamps: true }
);

export const Customer = mongoose.model("Customer", customerSchema);
