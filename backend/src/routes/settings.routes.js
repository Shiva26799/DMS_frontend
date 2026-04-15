import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { uploadLogo } from "../middleware/s3-upload.middleware.js";
import {
    getCompanyInfo, updateCompanyInfo, uploadCompanyLogo,
    getUsers, createUser, updateUser, deleteUser
} from "../controllers/settings.controller.js";
import {
    getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse
} from "../controllers/warehouse.controller.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.get("/company", checkJWTToken, authorize("Super Admin"), getCompanyInfo);
router.put("/company", checkJWTToken, authorize("Super Admin"), updateCompanyInfo);
router.put("/company/logo", checkJWTToken, authorize("Super Admin"), uploadLogo.single("logo"), uploadCompanyLogo);

router.get("/users", checkJWTToken, authorize("Super Admin", "Distributor"), getUsers);
router.post("/users", checkJWTToken, authorize("Super Admin", "Distributor"), createUser);
router.put("/users/:id", checkJWTToken, authorize("Super Admin", "Distributor"), updateUser);
router.delete("/users/:id", checkJWTToken, authorize("Super Admin", "Distributor"), deleteUser);

router.get("/warehouses", checkJWTToken, authorize("Super Admin"), getWarehouses);
router.post("/warehouses", checkJWTToken, authorize("Super Admin"), createWarehouse);
router.put("/warehouses/:id", checkJWTToken, authorize("Super Admin"), updateWarehouse);
router.delete("/warehouses/:id", checkJWTToken, authorize("Super Admin"), deleteWarehouse);

export default router;
