import express from "express";
import { checkJWTToken, authorize } from "../middleware/index.js";
import {
    getLeads,
    createLead,
    getLeadById,
    updateLead,
    assignLead,
    updateLeadStatus,
    addLeadFollowUp,
    markFollowUpCompleted,
    convertLeadToCustomer,
    deleteLead
} from "../controllers/lead.controller.js";

const router = express.Router();

router.get("/", checkJWTToken, authorize("Admin", "Dealer"), getLeads);
router.post("/", checkJWTToken, authorize("Admin", "Dealer"), createLead);
router.get("/:id", checkJWTToken, authorize("Admin", "Dealer"), getLeadById);
router.put("/:id", checkJWTToken, authorize("Admin", "Dealer"), updateLead);
router.put("/:id/assign", checkJWTToken, authorize("Admin"), assignLead);
router.put("/:id/status", checkJWTToken, authorize("Admin", "Dealer"), updateLeadStatus);
router.post("/:id/followup", checkJWTToken, authorize("Admin", "Dealer"), addLeadFollowUp);
router.patch("/:id/followup/:followUpId/complete", checkJWTToken, authorize("Admin", "Dealer"), markFollowUpCompleted);
router.post("/:id/convert", checkJWTToken, authorize("Admin", "Dealer"), convertLeadToCustomer);
router.delete("/:id", checkJWTToken, authorize("Admin", "Dealer"), deleteLead);

export default router;
