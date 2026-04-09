import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        role: { type: String, enum: ["Super Admin", "Distributor", "Dealer"], default: "Super Admin" },
        lastLogin: { type: Date },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
        // Warehouse visibility for Distributors
        assignedWarehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }],
        // Warehouse visibility for Dealers under this Distributor
        dealerViewWarehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }],
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
