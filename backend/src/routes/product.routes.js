import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { uploadProductImage } from "../middleware/s3-upload.middleware.js";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    bulkCreateProducts
} from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", checkJWTToken, getProducts);
router.post("/", checkJWTToken, uploadProductImage.single("image"), createProduct);
router.post("/bulk", checkJWTToken, bulkCreateProducts);
router.put("/:id", checkJWTToken, uploadProductImage.single("image"), updateProduct);
router.delete("/:id", checkJWTToken, deleteProduct);
router.get("/:id", checkJWTToken, getProductById);

export default router;
