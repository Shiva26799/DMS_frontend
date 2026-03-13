import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadProductImage } from "../middleware/s3Upload.js";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    bulkCreateProducts
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", authMiddleware, getProducts);
router.post("/", authMiddleware, uploadProductImage.single("image"), createProduct);
router.post("/bulk", authMiddleware, bulkCreateProducts);
router.put("/:id", authMiddleware, uploadProductImage.single("image"), updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);
router.get("/:id", authMiddleware, getProductById);

export default router;
