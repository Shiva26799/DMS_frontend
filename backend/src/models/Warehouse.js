import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        adminName: { type: String, required: true },
        adminContact: { type: String, required: true },
        adminEmail: { type: String, required: true },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    },
    { timestamps: true }
);

export const Warehouse = mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);
