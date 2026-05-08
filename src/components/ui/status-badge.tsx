import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  children: string;
  tone?: "neutral" | "accent" | "warning";
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return <Badge tone={tone}>{children}</Badge>;
}
