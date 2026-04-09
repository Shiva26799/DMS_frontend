import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { 
    createClaim, 
    getClaims, 
    getClaimById, 
    updateClaimStatus, 
    addMedia 
} from "../controllers/warranty.controller.js";
import { uploadWarrantyMedia } from "../middleware/s3-upload.middleware.js";

const router = express.Router();

// All warranty routes require authentication
router.use(checkJWTToken);

router.post("/", createClaim);
router.get("/", getClaims);
router.get("/:id", getClaimById);
router.patch("/:id/status", updateClaimStatus);
router.post("/:id/media", uploadWarrantyMedia.single("media"), addMedia);

export default router;
