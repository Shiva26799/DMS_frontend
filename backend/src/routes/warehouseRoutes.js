import express from "express";
import { getWarehouses, createWarehouse } from "../controllers/warehouseController.js";
import { auth, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getWarehouses);
router.post("/", auth, adminOnly, createWarehouse);

export default router;
