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
import inventoryRoutes from "./routes/inventory.routes.js";
import rolePermissionRoutes from "./routes/permission.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

import path from "path";
import { fileURLToPath } from "url";

import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/public", express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/warranty", warrantyRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/permissions", rolePermissionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/analytics", analyticsRoutes);

// Database connection
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log(`Connected to MongoDB in ${process.env.NODE_ENV || "development"} mode`);
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

export default app;
