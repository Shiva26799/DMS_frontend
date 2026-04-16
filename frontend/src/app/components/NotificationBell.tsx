import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Bell, Check, Clock, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { notificationService, Notification } from "../services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { cn } from "./ui/utils";
import { toast } from "sonner";

// Custom DropdownMenuHeader since it might not exist in UI components
const CustomDropdownMenuHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-2 border-b border-gray-100 font-semibold text-sm text-gray-900">
    {children}
  </div>
);

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors outline-none">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white border-2 border-white text-[10px]"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-gray-200">
        <CustomDropdownMenuHeader>
          <div className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </CustomDropdownMenuHeader>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-gray-50 p-3 rounded-full mb-3">
                <Bell className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-900">No notifications yet</p>
              <p className="text-xs text-gray-500 mt-1">We'll notify you when something important happens.</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-4 cursor-pointer border-b border-gray-50 last:border-0 transition-colors",
                    !notification.isRead ? "bg-blue-50/50 hover:bg-blue-100/50" : "hover:bg-gray-50"
                  )}
                  onClick={() => {
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <span className={cn(
                      "text-sm font-semibold",
                      !notification.isRead ? "text-blue-900" : "text-gray-900"
                    )}>
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        className="h-5 w-5 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between w-full mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1.5 h-4 font-normal text-gray-400 border-gray-200">
                      {notification.type}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 hover:text-gray-700">
              Clear History (Older than 30 days are auto-cleared)
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
