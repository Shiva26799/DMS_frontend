import express from "express";
import { 
    getOwnInventory, 
    getWarehouseInventory, 
    getSubordinateDealerInventory, 
    getVisibleWarehouses,
    updateStock,
    bulkUpdateStock
} from "../controllers/inventory.controller.js";
import { checkJWTToken, checkPermission } from "../middleware/index.js";

const router = express.Router();

// All routes require authentication
router.use(checkJWTToken);

router.get("/own", checkPermission("inventory", "viewOwn"), getOwnInventory);
router.get("/warehouse", checkPermission("inventory", "viewWarehouses"), getWarehouseInventory);
router.get("/subordinate", checkPermission("inventory", "viewSubordinates"), getSubordinateDealerInventory);
router.get("/warehouses", getVisibleWarehouses); // Generic visible warehouses list
router.post("/update", checkPermission("inventory", "manage"), updateStock);
router.post("/bulk-update", checkPermission("inventory", "manage"), bulkUpdateStock);

export default router;
