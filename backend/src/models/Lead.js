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
    {
        customerName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        source: { type: String, required: true },
        product: { type: String, required: true },
        region: { type: String, required: true },
        value: { type: Number, required: true },
        status: { type: String, enum: ["New", "Assigned", "Discussion", "Negotiation", "Won", "Lost"], default: "New" },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: { type: String },
        assignedDate: { type: String },
        followUps: [followUpSchema],
        activityLog: [activitySchema],
    },
    { timestamps: true }
);

export const Lead = mongoose.model("Lead", leadSchema);
