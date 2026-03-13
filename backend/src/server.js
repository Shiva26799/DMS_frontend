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

// Database connection helper
let cachedDb = null;
const connectToDatabase = async () => {
    if (cachedDb) return cachedDb;
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not defined in environment variables");
    }

    try {
        const db = await mongoose.connect(uri);
        console.log("✅ [DB] Connected to MongoDB");
        cachedDb = db;
        return db;
    } catch (err) {
        console.error("❌ [DB] Connection error:", err);
        throw err;
    }
};

// Middleware to ensure DB connection before processing requests
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        res.status(503).json({ 
            message: "Database connection failed", 
            error: process.env.NODE_ENV === "development" ? err.message : "Service Unavailable" 
        });
    }
});



// Diagnostic health check
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "Backend is reachable",
        timestamp: new Date().toISOString(),
        vercel: !!process.env.VERCEL,
        dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        dbState: mongoose.connection.readyState,
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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Global Error:", err);
    res.status(500).json({
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
    });
});


export default app;

