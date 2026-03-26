import express from "express";
import { checkJWTToken, adminOnly } from "../middleware/index.js";
import { getWarehouses, createWarehouse } from "../controllers/warehouse.controller.js";

const router = express.Router();

router.get("/", checkJWTToken, getWarehouses);
router.post("/", checkJWTToken, adminOnly, createWarehouse);

export default router;
