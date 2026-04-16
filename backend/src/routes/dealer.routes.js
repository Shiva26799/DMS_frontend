import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { getDealers, onboardDealer, approveDealer, updateDealer, getAssignees } from "../controllers/dealer.controller.js";
import { uploadDealerKYC } from "../middleware/s3-upload.middleware.js";
import { authorize } from "../middleware/authorize.js";
import { checkPermission } from "../middleware/checkPermission.js";

const router = express.Router();

router.get("/", checkJWTToken, checkPermission("dealers", "view"), getDealers);
router.get("/assignees", checkJWTToken, authorize("Super Admin", "Distributor"), getAssignees);
router.post("/onboard", checkJWTToken, checkPermission("dealers", "create"), uploadDealerKYC.any(), onboardDealer);
router.put("/:id/approve", checkJWTToken, checkPermission("dealers", "update"), approveDealer);
router.patch("/:id", checkJWTToken, checkPermission("dealers", "update"), updateDealer);

export default router;
