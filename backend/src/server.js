import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import dealerRoutes from "./routes/dealer.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import productRoutes from "./routes/product.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import orderRoutes from "./routes/order.routes.js";
import warrantyRoutes from "./routes/warranty.routes.js";

import path from "path";
import { fileURLToPath } from "url";

import morgan from "morgan";

import connectDB from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware to ensure DB is connected before handling any requests (important for Serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Database connection middleware error:", err);
        res.status(500).json({ message: "Database connection failed", error: err.message });
    }
});

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/public", express.static(path.join(process.cwd(), "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/warranty", warrantyRoutes);

// Only listen if not being imported as a module (e.g., direct node execution)
if (import.meta.url === `file://${fileURLToPath(import.meta.url)}` && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
