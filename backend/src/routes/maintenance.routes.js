import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import {
    getMaintenanceRecords,
    getMaintenanceById,
    completeService,
    scheduleService
} from "../controllers/maintenance.controller.js";
import { canManageMaintenance } from "../middleware/maintenanceRBAC.middleware.js";

const router = express.Router();

// All maintenance routes require authentication
router.use(checkJWTToken);

router.get("/", getMaintenanceRecords);
router.get("/:id", canManageMaintenance, getMaintenanceById);
router.patch("/:id/complete", canManageMaintenance, completeService);
router.post("/schedule", scheduleService);

export default router;
