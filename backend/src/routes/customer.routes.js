import express from "express";
import { checkJWTToken, checkPermission } from "../middleware/index.js";
import {
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/", checkJWTToken, checkPermission("customers", "view"), getCustomers);
router.get("/:id", checkJWTToken, checkPermission("customers", "view"), getCustomerById);
router.put("/:id", checkJWTToken, checkPermission("customers", "edit"), updateCustomer);
router.delete("/:id", checkJWTToken, checkPermission("customers", "delete"), deleteCustomer);

export default router;
