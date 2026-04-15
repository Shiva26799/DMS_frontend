import express from "express";
import {
    getOverviewStats,
    getSalesTrend,
    getRegionalPerformance,
    getDealerRankings,
    getProductMix,
    getWarrantyStats,
    getInventoryStats,
    getLeadAnalytics
} from "../controllers/analytics.controller.js";
import { checkJWTToken } from "../middleware/index.js";

const router = express.Router();

router.get("/overview", checkJWTToken, getOverviewStats);
router.get("/sales-trend", checkJWTToken, getSalesTrend);
router.get("/regions", checkJWTToken, getRegionalPerformance);
router.get("/dealers", checkJWTToken, getDealerRankings);
router.get("/product-mix", checkJWTToken, getProductMix);
router.get("/warranty", checkJWTToken, getWarrantyStats);
router.get("/inventory-stats", checkJWTToken, getInventoryStats);
router.get("/leads", checkJWTToken, getLeadAnalytics);

export default router;
