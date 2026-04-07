import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { getDealers, onboardDealer, approveDealer } from "../controllers/dealer.controller.js";
import { uploadDealerKYC } from "../middleware/s3-upload.middleware.js";

const router = express.Router();

router.get("/", checkJWTToken, getDealers);
router.post("/onboard", checkJWTToken, uploadDealerKYC.any(), onboardDealer);
router.put("/:id/approve", checkJWTToken, approveDealer);

export default router;
