import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "lovol_dms_super_secret_key_2024";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Invalid token - User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized", error });
    }
};

export const auth = authMiddleware;

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "Admin") {
        next();
    } else {
        res.status(403).json({ message: "Admin access required" });
    }
};
