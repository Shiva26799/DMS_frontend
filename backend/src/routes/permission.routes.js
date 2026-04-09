import express from "express";
import { getPermissions, updateRolePermissions } from "../controllers/permissionController.js";
import { checkJWTToken } from "../middleware/index.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// All permission routes require authentication
router.use(checkJWTToken);

// GET all permissions (Anyone logged in can view the overview)
router.get("/", getPermissions);

// PUT update permissions for a specific role (Super Admin only)
router.put("/:role", authorize("Super Admin"), updateRolePermissions);

export default router;
