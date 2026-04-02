import express from "express";
import { checkJWTToken } from "../middleware/index.js";
import { uploadOrderDocument } from "../middleware/s3-upload.middleware.js";
import {
    createOrder,
    getOrders,
    getOrderById,
    uploadPODocument,
    uploadPaymentDocument,
    approveOrder,
    finalizeOrderApproval,
    uploadLovolInvoice,
    uploadDealerInvoice,
    updateDeliveryStatus,
    markOrderAsReceived,
    markInstallationComplete,
    registerWarranty,
    cancelOrder,
    updateOrderStatus
} from "../controllers/order.controller.js";

const router = express.Router();

// All order routes strictly require authentication
router.use(checkJWTToken);

// Standard CRUD endpoints
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);

// Document upload endpoints configured with S3 middleware
router.patch("/:id/upload-po", uploadOrderDocument.single("poDocument"), uploadPODocument);
router.patch("/:id/upload-payment", uploadOrderDocument.single("paymentDocument"), uploadPaymentDocument);

// NEW Lifecycle endpoints
router.patch("/:id/approve-payment", approveOrder);
router.patch("/:id/approve-order", finalizeOrderApproval);
router.patch("/:id/upload-lovol-invoice", uploadOrderDocument.single("lovolInvoice"), uploadLovolInvoice);
router.patch("/:id/upload-dealer-invoice", uploadOrderDocument.single("dealerInvoice"), uploadDealerInvoice);
router.patch("/:id/delivery-status", updateDeliveryStatus);
router.patch("/:id/receive-order", markOrderAsReceived);
router.patch("/:id/complete-installation", markInstallationComplete);
router.patch("/:id/register-warranty", uploadOrderDocument.single("warrantyDocument"), registerWarranty);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id/status", updateOrderStatus);

export default router;
