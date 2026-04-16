import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { notificationService } from "../services/notificationService";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerId: string;
  dealerName: string;
}

const PRESETS = [
  {
    label: "General Update",
    title: "Update Regarding Your Account",
    message: "Hello, we have an update regarding your dealer account. Please check your portal for details.",
    type: "General"
  },
  {
    label: "New Order Notification",
    title: "New Order Placed",
    message: "A new order has been generated for your location. Please review and process the requirements.",
    type: "Order"
  },
  {
    label: "Pending Approval",
    title: "Document Approval Pending",
    message: "Some of your documents are pending approval. Please provide the necessary information to proceed.",
    type: "Approval"
  },
  {
    label: "Payment Reminder",
    title: "Payment Due Notification",
    message: "This is a reminder regarding a pending payment on your account. Please settle the outstanding amount.",
    type: "Payment"
  }
];

export function NotificationModal({ isOpen, onClose, dealerId, dealerName }: NotificationModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("General");
  const [isSending, setIsSending] = useState(false);

  const handleApplyPreset = (presetLabel: string) => {
    const preset = PRESETS.find(p => p.label === presetLabel);
    if (preset) {
      setTitle(preset.title);
      setMessage(preset.message);
      setType(preset.type);
    }
  };

  const handleSend = async () => {
    if (!title || !message) {
      toast.error("Please fill in both title and message");
      return;
    }

    try {
      setIsSending(true);
      await notificationService.sendNotification({
        recipientDealerId: dealerId,
        title,
        message,
        type
      });
      toast.success("Notification sent successfully to " + dealerName);
      onClose();
      // Reset form
      setTitle("");
      setMessage("");
      setType("General");
    } catch (error) {
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Send Notification to {dealerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7"
                  onClick={() => handleApplyPreset(preset.label)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Order">Order</SelectItem>
                <SelectItem value="Approval">Approval</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Subject / Title</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message Body</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              className="min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <p className="text-[11px] text-gray-500 italic">
            * This will be sent as an in-app notification and an email.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
            {isSending ? "Sending..." : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
