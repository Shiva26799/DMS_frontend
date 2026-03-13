import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import dealerRoutes from "./routes/dealerRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
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

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lovol_dms";

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
          app.listen(PORT, () => {
              console.log(`Server is running on port ${PORT}`);
          });
        }
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

export default app;
