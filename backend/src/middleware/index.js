import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the public key for RS256 verification
const PUBLIC_KEY_PATH = path.join(__dirname, "../../public_key.pem");

export const checkJWTToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        // Read public key for RS256 verification
        const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
        const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });

        // CRITICAL: Fetch the user from DB to ensure they still exist and have the correct role
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Invalid token - User not found" });
        }

        req.user = user;
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
