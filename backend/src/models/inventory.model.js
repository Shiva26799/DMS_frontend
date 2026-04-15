import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
    {
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Product", 
            required: true 
        },
        ownerType: { 
            type: String, 
            enum: ["Warehouse", "Distributor", "Dealer", "Warehouse Admin", "Super Admin"], 
            required: true 
        },
        ownerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true,
            refPath: "ownerType"
        },
        quantity: { 
            type: Number, 
            default: 0, 
            min: 0 
        },
        minStockLevel: { 
            type: Number, 
            default: 0 
        },
        binLocation: {
            type: String,
            default: ""
        },
    },
    { timestamps: true }
);

// Compound index to ensure unique inventory record per product per owner
inventorySchema.index({ productId: 1, ownerType: 1, ownerId: 1 }, { unique: true });

export const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);
