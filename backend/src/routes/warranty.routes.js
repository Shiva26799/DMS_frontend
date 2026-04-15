import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { 
    createClaim, 
    getClaims, 
    getClaimById, 
    updateClaimStatus, 
    addMedia,
    getCustomerProducts
} from "../controllers/warranty.controller.js";
import { uploadWarrantyMedia } from "../middleware/s3-upload.middleware.js";
import { canManageClaim, isHOApprover } from "../middleware/warrantyRBAC.middleware.js";

const router = express.Router();

// All warranty routes require authentication
router.use(checkJWTToken);

router.post("/", createClaim);
router.get("/", getClaims);
router.get("/customer-products", getCustomerProducts);
router.get("/:id", canManageClaim, getClaimById);
router.patch("/:id/status", canManageClaim, isHOApprover, updateClaimStatus);
router.post("/:id/media", canManageClaim, uploadWarrantyMedia.single("media"), addMedia);

export default router;
