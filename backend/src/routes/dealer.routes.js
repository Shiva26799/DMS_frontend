import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { getDealers, onboardDealer, approveDealer } from "../controllers/dealer.controller.js";

const router = express.Router();

router.get("/", checkJWTToken, getDealers);
router.post("/onboard", checkJWTToken, onboardDealer);
router.put("/:id/approve", checkJWTToken, approveDealer);

export default router;
