import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, required: true, unique: true },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer", required: true },
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

        poDocument: {
            url: { type: String },
            uploadedAt: { type: Date }
        },
        paymentDocument: {
            url: { type: String },
            uploadedAt: { type: Date }
        },
        lovolInvoiceDocument: {
            url: { type: String },
            uploadedAt: { type: Date }
        },
        dealerInvoiceDocument: {
            url: { type: String },
            uploadedAt: { type: Date }
        },

        warrantyDetails: {
            machineSerialNumber: { type: String },
            engineNumber: { type: String },
            warrantyStartDate: { type: Date },
            warrantyEndDate: { type: Date },
            warrantyMonths: { type: Number },
            maintenanceMonths: { type: Number },
            warrantyDocument: {
                url: { type: String },
                uploadedAt: { type: Date }
            }
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
