import express from "express";
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    sendNotification 
} from "../controllers/notification.controller.js";
import { checkJWTToken } from "../middleware/index.js";

const router = express.Router();

router.use(checkJWTToken);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.post("/read-all", markAllAsRead);
router.post("/send", sendNotification);

export default router;
