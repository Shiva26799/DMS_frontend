import { apiClient as api } from "../api/client";

export interface Notification {
    _id: string;
    recipient: string;
    sender: {
        _id: string;
        name: string;
        role: string;
    };
    title: string;
    message: string;
    type: "Order" | "Approval" | "Payment" | "General";
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export interface SendNotificationParams {
    recipientDealerId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
}

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get<Notification[]>("/notifications");
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.patch<Notification>(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.post("/notifications/read-all");
        return response.data;
    },

    sendNotification: async (params: SendNotificationParams) => {
        const response = await api.post("/notifications/send", params);
        return response.data;
    }
};
