import { StatusBadge } from "@/components/ui/status-badge";

type QuoteStatusBadgeProps = {
  status: "draft" | "approved" | "cancelled";
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  return (
    <StatusBadge tone={status === "approved" ? "accent" : status === "cancelled" ? "warning" : "neutral"}>
      {status}
    </StatusBadge>
  );
}
