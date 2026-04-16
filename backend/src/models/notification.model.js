import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        sender: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        title: { 
            type: String, 
            required: true 
        },
        message: { 
            type: String, 
            required: true 
        },
        type: { 
            type: String, 
            enum: ["Order", "Approval", "Payment", "General"], 
            default: "General" 
        },
        link: { 
            type: String 
        },
        isRead: { 
            type: Boolean, 
            default: false 
        }
    },
    { 
        timestamps: true 
    }
);

// Add TTL index for 30 days automatic expiry
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
