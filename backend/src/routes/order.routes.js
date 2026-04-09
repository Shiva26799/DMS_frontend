import express from "express";
import { checkJWTToken, checkPermission } from "../middleware/index.js";
import { authorize } from "../middleware/authorize.js";
import { isOrderOwnerOrAdmin } from "../middleware/orderRBAC.middleware.js";
import { uploadOrderDocument } from "../middleware/s3-upload.middleware.js";
import {
    createOrder,
    createOrderFromLead,
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
    updateOrderStatus,
    uploadAdditionalDocument,
    deleteAdditionalDocument,
    deletePrimaryDocument,
    requestDocument
} from "../controllers/order.controller.js";

const router = express.Router();

// All order routes strictly require authentication
router.use(checkJWTToken);

// --- CRUD (All authenticated roles can create & view) ---
router.post("/", checkPermission("orders", "create"), createOrder);
router.post("/from-lead", checkPermission("orders", "create"), createOrderFromLead);
router.get("/", checkPermission("orders", "view"), getOrders);
router.get("/:id", checkPermission("orders", "view"), getOrderById);

// --- Creator-only actions (Super Admin OR the person who created the order) ---
router.patch("/:id/upload-po", isOrderOwnerOrAdmin, uploadOrderDocument.single("poDocument"), uploadPODocument);
router.patch("/:id/upload-payment", isOrderOwnerOrAdmin, uploadOrderDocument.single("paymentDocument"), uploadPaymentDocument);
router.patch("/:id/upload-dealer-invoice", isOrderOwnerOrAdmin, uploadOrderDocument.single("dealerInvoice"), uploadDealerInvoice);
router.patch("/:id/delivery-status", isOrderOwnerOrAdmin, updateDeliveryStatus);
router.patch("/:id/receive-order", isOrderOwnerOrAdmin, markOrderAsReceived);
router.patch("/:id/complete-installation", isOrderOwnerOrAdmin, markInstallationComplete);
router.patch("/:id/register-warranty", isOrderOwnerOrAdmin, uploadOrderDocument.single("warrantyDocument"), registerWarranty);
router.patch("/:id/cancel", isOrderOwnerOrAdmin, cancelOrder);
router.post("/:id/additional-docs", isOrderOwnerOrAdmin, uploadOrderDocument.single("document"), uploadAdditionalDocument);

// --- Approval actions (Super Admin OR the person who created the order) ---
router.patch("/:id/approve-payment", isOrderOwnerOrAdmin, approveOrder);
router.patch("/:id/approve-order", isOrderOwnerOrAdmin, finalizeOrderApproval);
router.patch("/:id/upload-lovol-invoice", checkPermission("orders", "uploadLovolInvoice"), uploadOrderDocument.single("lovolInvoice"), uploadLovolInvoice);
router.patch("/:id/status", checkPermission("orders", "statusOverride"), updateOrderStatus);
router.patch("/:id/request-doc", checkPermission("orders", "requestDocs"), requestDocument);
router.delete("/:id/additional-docs/:name", checkPermission("orders", "statusOverride"), deleteAdditionalDocument);
router.delete("/:id/primary-docs/:type", checkPermission("orders", "statusOverride"), deletePrimaryDocument);

export default router;
