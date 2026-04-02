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
    },
    { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
