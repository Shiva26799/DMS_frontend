import express from "express";
import { checkJWTToken } from "../middleware/index.js";
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
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.get("/", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), getLeads);
router.post("/", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), createLead);
router.get("/:id", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), getLeadById);
router.put("/:id", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), updateLead);
router.put("/:id/assign", checkJWTToken, authorize("Super Admin", "Distributor"), assignLead);
router.put("/:id/status", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), updateLeadStatus);
router.post("/:id/followup", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), addLeadFollowUp);
router.patch("/:id/followup/:followUpId/complete", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), markFollowUpCompleted);
router.post("/:id/convert", checkJWTToken, authorize("Super Admin", "Distributor", "Dealer"), convertLeadToCustomer);
router.delete("/:id", checkJWTToken, authorize("Super Admin", "Distributor"), deleteLead);

export default router;
