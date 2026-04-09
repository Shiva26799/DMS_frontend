import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, required: true, unique: true },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer", required: true },
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
        orderSource: { 
            type: String, 
            enum: ["Warehouse", "Own Stock"], 
            default: "Warehouse" 
        },
        assignedDistributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        metadata: {
            DistributorName: { type: String },
            DealerName: { type: String }
        },
        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true }
            }
        ],
        totalValue: { type: Number, required: true },

        currentStage: { type: String, default: "PO Upload" },
        stageProgress: { type: Number, default: 10 },
        paymentStatus: { type: String, default: "Pending Payment" },
        deliveryStatus: { type: String, default: "Processing" },
        deliveryDetails: {
            transportName: { type: String },
            trackingId: { type: String },
            estimatedDeliveryDate: { type: Date }
        },

        documents: {
            po: { url: { type: String }, uploadedAt: { type: Date } },
            payment: { url: { type: String }, uploadedAt: { type: Date } },
            lovolInvoice: { url: { type: String }, uploadedAt: { type: Date } },
            dealerInvoice: { url: { type: String }, uploadedAt: { type: Date } },
            warranty: { url: { type: String }, uploadedAt: { type: Date } },
            additional: [
                {
                    name: { type: String },
                    url: { type: String },
                    uploadedAt: { type: Date, default: Date.now }
                }
            ]
        },

        warrantyDetails: {
            machineSerialNumber: { type: String },
            engineNumber: { type: String },
            warrantyStartDate: { type: Date },
            warrantyEndDate: { type: Date },
            warrantyMonths: { type: Number },
            maintenanceMonths: { type: Number }
        },

        activityLog: [
            {
                action: { type: String },
                note: { type: String },
                performedBy: { type: String },
                timestamp: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
