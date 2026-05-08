import { Badge } from "@/components/ui/badge";

type ActiveStateBadgeProps = {
  active: boolean;
};

export function ActiveStateBadge({ active }: ActiveStateBadgeProps) {
  return active ? <Badge tone="accent">Active</Badge> : <Badge tone="warning">Inactive</Badge>;
}
