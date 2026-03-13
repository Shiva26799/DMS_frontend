import express from "express";
import { uploadLogo } from "../middleware/s3Upload.js";
import {
    getCompanyInfo, updateCompanyInfo, uploadCompanyLogo,
    getUsers, createUser, updateUser, deleteUser,
    getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse
} from "../controllers/settingsController.js";

const router = express.Router();

router.get("/company", getCompanyInfo);
router.put("/company", updateCompanyInfo);
router.put("/company/logo", uploadLogo.single("logo"), uploadCompanyLogo);

router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/warehouses", getWarehouses);
router.post("/warehouses", createWarehouse);
router.put("/warehouses/:id", updateWarehouse);
router.delete("/warehouses/:id", deleteWarehouse);

export default router;
