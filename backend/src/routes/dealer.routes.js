import express from "express";
import { checkJWTToken, adminOnly } from "../middleware/index.js";
import { getDealers, getDealerById, onboardDealer, approveDealer } from "../controllers/dealer.controller.js";

const router = express.Router();

router.get("/", checkJWTToken, getDealers);
router.get("/:id", checkJWTToken, getDealerById);
router.post("/onboard", checkJWTToken, adminOnly, onboardDealer);
router.patch("/:id/approve", checkJWTToken, adminOnly, approveDealer);

export default router;
