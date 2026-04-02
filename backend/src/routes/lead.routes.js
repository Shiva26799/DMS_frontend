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

const router = express.Router();

router.get("/", checkJWTToken, getLeads);
router.post("/", checkJWTToken, createLead);
router.get("/:id", checkJWTToken, getLeadById);
router.put("/:id", checkJWTToken, updateLead);
router.put("/:id/assign", checkJWTToken, assignLead);
router.put("/:id/status", checkJWTToken, updateLeadStatus);
router.post("/:id/followup", checkJWTToken, addLeadFollowUp);
router.patch("/:id/followup/:followUpId/complete", checkJWTToken, markFollowUpCompleted);
router.post("/:id/convert", checkJWTToken, convertLeadToCustomer);
router.delete("/:id", checkJWTToken, deleteLead);

export default router;
