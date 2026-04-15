import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
        dealerName: { type: String },
        productSerial: { type: String, required: true },
        productName: { type: String, required: true },
        serviceType: {
            type: String,
            enum: ["500h", "1000h"],
            required: true
        },
        dueDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ["Upcoming", "Overdue", "Completed"],
            default: "Upcoming"
        },
        completedDate: { type: Date },
        technicianNotes: { type: String },
        serviceHistory: [
            {
                serviceType: { type: String },
                completedDate: { type: Date },
                technicianNotes: { type: String },
                performedBy: { type: String },
                timestamp: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

export const Maintenance = mongoose.models.Maintenance || mongoose.model("Maintenance", maintenanceSchema);
