import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { uploadLogo } from "../middleware/s3-upload.middleware.js";
import {
    getCompanyInfo, updateCompanyInfo, uploadCompanyLogo,
    getUsers, createUser, updateUser, deleteUser,
    getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse
} from "../controllers/settings.controller.js";

const router = express.Router();

router.get("/company", checkJWTToken, getCompanyInfo);
router.put("/company", checkJWTToken, updateCompanyInfo);
router.put("/company/logo", checkJWTToken, uploadLogo.single("logo"), uploadCompanyLogo);

router.get("/users", checkJWTToken, getUsers);
router.post("/users", checkJWTToken, createUser);
router.put("/users/:id", checkJWTToken, updateUser);
router.delete("/users/:id", checkJWTToken, deleteUser);

router.get("/warehouses", checkJWTToken, getWarehouses);
router.post("/warehouses", checkJWTToken, createWarehouse);
router.put("/warehouses/:id", checkJWTToken, updateWarehouse);
router.delete("/warehouses/:id", checkJWTToken, deleteWarehouse);

export default router;
