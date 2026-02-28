import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const statusConfig: Record<
  string,
  { variant: "default" | "destructive" | "outline" | "secondary"; className: string }
> = {
  // Lead statuses
  new: { variant: "default", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  assigned: { variant: "secondary", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  discussion: { variant: "secondary", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  negotiation: { variant: "secondary", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  won: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  lost: { variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" },

  // Order statuses
  pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  approved: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  "in-progress": { variant: "default", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  completed: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  cancelled: { variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  delivered: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },

  // Warranty statuses
  submitted: { variant: "default", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  "under-review": { variant: "secondary", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  dispatch: { variant: "secondary", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  installed: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  closed: { variant: "secondary", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  rejected: { variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" },

  // Stock statuses
  normal: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  low: { variant: "secondary", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  critical: { variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  "out-of-stock": { variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" },

  // Payment statuses
  paid: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  unpaid: { variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  partial: { variant: "secondary", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },

  // Dealer statuses
  active: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  inactive: { variant: "secondary", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  suspended: { variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/ /g, "-");
  const config = statusConfig[normalizedStatus] || {
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}
