import { StatusBadge } from "@/components/ui/status-badge";

type OrderStatusBadgeProps = {
  status: "cancelled" | "completed" | "in_progress" | "pending";
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <StatusBadge tone={status === "completed" ? "accent" : status === "cancelled" ? "warning" : "neutral"}>
      {status}
    </StatusBadge>
  );
}
