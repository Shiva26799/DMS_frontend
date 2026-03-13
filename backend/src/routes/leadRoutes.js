import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    getLeads,
    createLead,
    getLeadById,
    updateLead,
    assignLead,
    updateLeadStatus,
    addLeadFollowUp,
    convertLeadToCustomer
} from "../controllers/leadController.js";

const router = express.Router();

router.get("/", authMiddleware, getLeads);
router.post("/", authMiddleware, createLead);
router.get("/:id", authMiddleware, getLeadById);
router.put("/:id", authMiddleware, updateLead);
router.put("/:id/assign", authMiddleware, assignLead);
router.put("/:id/status", authMiddleware, updateLeadStatus);
router.post("/:id/follow-up", authMiddleware, addLeadFollowUp);
router.post("/:id/convert", authMiddleware, convertLeadToCustomer);

export default router;
