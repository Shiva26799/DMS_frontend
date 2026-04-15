import express from "express";
import { checkJWTToken, checkPermission } from "../middleware/index.js";
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
    deleteLead,
    searchLeads
} from "../controllers/lead.controller.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.get("/", checkJWTToken, checkPermission("leads", "view"), getLeads);
router.get("/search", checkJWTToken, searchLeads);
router.post("/", checkJWTToken, checkPermission("leads", "create"), createLead);
router.get("/:id", checkJWTToken, checkPermission("leads", "view"), getLeadById);
router.put("/:id", checkJWTToken, checkPermission("leads", "edit"), updateLead);
router.put("/:id/assign", checkJWTToken, checkPermission("leads", "assignToDealers"), assignLead);
router.put("/:id/status", checkJWTToken, checkPermission("leads", "updateStatus"), updateLeadStatus);
router.post("/:id/followup", checkJWTToken, checkPermission("leads", "addActivities"), addLeadFollowUp);
router.patch("/:id/followup/:followUpId/complete", checkJWTToken, checkPermission("leads", "addActivities"), markFollowUpCompleted);
router.post("/:id/convert", checkJWTToken, checkPermission("leads", "convertToOrder"), convertLeadToCustomer);
router.delete("/:id", checkJWTToken, checkPermission("leads", "delete"), deleteLead);

export default router;
