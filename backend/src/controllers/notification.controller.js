import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { Dealer } from "../models/dealer.model.js";
import { sendGenericNotificationEmail } from "../services/mail.service.js";

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        console.error("Fetch notifications error:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json(notification);
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ message: "Failed to mark notification as read" });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ message: "Failed to mark all as read" });
    }
};

export const sendNotification = async (req, res) => {
    try {
        const { recipientDealerId, title, message, type, link } = req.body;
        const sender = req.user;

        // 1. Find the dealer to get their email
        const dealer = await Dealer.findById(recipientDealerId);
        if (!dealer) {
            return res.status(404).json({ message: "Dealer not found" });
        }

        // 2. Find the associated User account for in-app notification
        // Try finding by dealerId first, then fallback to email if dealerId find fails
        let recipientUser = await User.findOne({ dealerId: recipientDealerId });
        
        if (!recipientUser && dealer.email) {
            recipientUser = await User.findOne({ email: dealer.email });
        }

        // 3. Create In-App Notification if user exists
        if (recipientUser) {
            console.log(`Creating in-app notification for user: ${recipientUser.email} (${recipientUser._id})`);
            const notification = new Notification({
                recipient: recipientUser._id,
                sender: sender._id,
                title,
                message,
                type: type || "General",
                link
            });
            await notification.save();
        } else {
            console.warn(`No user account found for dealer ${dealer.companyName} (${recipientDealerId}) to send in-app notification.`);
        }

        // 4. Send Email Notification
        try {
            await sendGenericNotificationEmail(
                dealer.email,
                title,
                title, // Template Subject
                message,
                sender.name,
                sender.role,
                link
            );
        } catch (emailError) {
            console.error("Email sending failed but notification saved:", emailError);
            // We don't fail the whole request because the in-app notification is saved
        }

        res.status(201).json({ 
            message: "Notification sent successfully",
            inApp: !!recipientUser,
            email: true
        });
    } catch (error) {
        console.error("Send notification error:", error);
        res.status(500).json({ message: "Failed to send notification" });
    }
};
