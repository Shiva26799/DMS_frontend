import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Route imports
import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import dealerRoutes from "./routes/dealerRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic requirement check for Vercel
if (process.env.VERCEL && !process.env.MONGODB_URI) {
    console.error("❌ CRITICAL: MONGODB_URI is missing in Vercel Environment Variables!");
}

// Global Diagnostics & Logging
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/public", express.static(path.join(__dirname, "../public")));

// Diagnostic health check
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "Backend is reachable",
        timestamp: new Date().toISOString(),
        vercel: !!process.env.VERCEL,
        env: process.env.NODE_ENV
    });
});

// Routes - Support both /api/path and /path for Vercel flexibility
const mountRoutes = (prefix = "") => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/leads`, leadRoutes);
    app.use(`${prefix}/dealers`, dealerRoutes);
    app.use(`${prefix}/settings`, settingsRoutes);
    app.use(`${prefix}/products`, productRoutes);
    app.use(`${prefix}/warehouses`, warehouseRoutes);
};

mountRoutes("/api");
mountRoutes(""); // Fallback for direct function calls if Vercel rewrites strip /api

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lovol_dms";

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("✅ [DB] Connected to MongoDB");
        // Only listen in local development
        if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
            app.listen(PORT, () => {
                console.log(`🚀 [Local Server] Running on port ${PORT}`);
            });
        }
    })
    .catch((err) => {
        console.error("❌ [DB] Connection error:", err);
    });

export default app;
