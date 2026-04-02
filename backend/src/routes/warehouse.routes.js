import express from "express";
import { checkJWTToken, superAdminOnly } from "../middleware/index.js";
import { getWarehouses, createWarehouse } from "../controllers/warehouse.controller.js";

const router = express.Router();

router.get("/", checkJWTToken, getWarehouses);
router.post("/", checkJWTToken, superAdminOnly, createWarehouse);

export default router;
