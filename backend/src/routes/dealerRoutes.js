import express from "express";
import { getDealers, onboardDealer, approveDealer } from "../controllers/dealerController.js";

const router = express.Router();

router.get("/", getDealers);
router.post("/onboard", onboardDealer);
router.put("/:id/approve", approveDealer);

export default router;
