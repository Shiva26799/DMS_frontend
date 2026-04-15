import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { getDealers, onboardDealer, approveDealer, updateDealer, getAssignees } from "../controllers/dealer.controller.js";
import { uploadDealerKYC } from "../middleware/s3-upload.middleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.get("/", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), getDealers);
router.get("/assignees", checkJWTToken, authorize("Super Admin", "Distributor"), getAssignees);
router.post("/onboard", checkJWTToken, authorize("Super Admin", "Distributor"), uploadDealerKYC.any(), onboardDealer);
router.put("/:id/approve", checkJWTToken, authorize("Super Admin"), approveDealer);
router.patch("/:id", checkJWTToken, authorize("Super Admin", "Distributor"), updateDealer);

export default router;
