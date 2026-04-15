import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    note: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
    performedBy: { type: String },
}, { _id: true });

const activitySchema = new mongoose.Schema({
    action: { type: String, required: true },
    note: { type: String },
    performedBy: { type: String },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });

const leadSchema = new mongoose.Schema(
    {   customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
        distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        metadata: {
            DistributorName: { type: String },
            DealerName: { type: String }
        },
        customerName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        source: { type: String, required: true },
        product: { type: String, required: true },
        region: { type: String, required: true },
        city: { type: String },
        value: { type: Number, required: true },
        inquiryType: { type: String, enum: ["Walk-in", "Field", "Campaign / Activity", "Digital/Web"], default: "Walk-in" },
        rating: { type: String, enum: ["Hot 🔥", "Warm 🌤️", "Cold ❄️"], default: "Warm 🌤️" },
        status: { type: String, enum: ["New", "Assigned", "Discussion", "Negotiation", "Won", "Lost"], default: "New" },
        lossReason: { type: String },
        lossNotes: { type: String },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: { type: String },
        assignedDate: { type: Date },
        followUps: [followUpSchema],
        stage: { type: String, enum: ["Lead", "Customer"], default: "Lead" },
        activityLog: [activitySchema],
    },
    { timestamps: true }
);

export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
