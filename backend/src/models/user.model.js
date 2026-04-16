import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        role: { type: String, enum: ["Super Admin", "Distributor", "Dealer", "Warehouse Admin"], default: "Super Admin" },
        lastLogin: { type: Date },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
        // Linked Warehouse for Warehouse Admin
        managedWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
        // Warehouse visibility for Distributors
        assignedWarehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }],
        // Warehouse visibility for Dealers under this Distributor
        dealerViewWarehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }],
        logoUrl: { type: String },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);

// Proxies for refPath resolution matching Inventory.ownerType exact strings
export const DistributorProxy = mongoose.models.Distributor || mongoose.model("Distributor", userSchema, "users");
export const SuperAdminProxy = mongoose.models["Super Admin"] || mongoose.model("Super Admin", userSchema, "users");
export const WarehouseAdminProxy = mongoose.models["Warehouse Admin"] || mongoose.model("Warehouse Admin", userSchema, "users");
