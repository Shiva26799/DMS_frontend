import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export const checkJWTToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        // Use symmetric secret for HS256 verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"]
        });

        // CRITICAL: Fetch the user from DB to ensure they still exist and have the correct role
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Invalid token - User not found" });
        }

        req.user = user;
        req.role = user.role; // For authorize middleware
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Unauthorized", error: error.message });
    }
};

// Simple admin check for now, can be moved to authorize.js later as per Senior Pattern step 2
export const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === "Super Admin") {
        next();
    } else {
        res.status(403).json({ message: "Super Admin access required" });
    }
};
export { checkPermission } from "./checkPermission.js";
