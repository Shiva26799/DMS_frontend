import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        sku: { type: String },
        partNumber: { type: String },
        category: { type: String, enum: ["Harvester", "Spare Part"], required: true },
        description: { type: String },
        price: { type: Number, default: 0 },
        stockAvailable: { type: Number, default: 0 },
        warrantyPeriod: { type: String },
        reorderLevel: { type: Number, default: 5 },
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
        imageUrl: { type: String },
        specifications: { type: Map, of: String, default: {} },
    },
    { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
