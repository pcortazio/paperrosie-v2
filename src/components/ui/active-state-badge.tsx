import { Badge } from "@/components/ui/badge";

type ActiveStateBadgeProps = {
  active: boolean;
};

export function ActiveStateBadge({ active }: ActiveStateBadgeProps) {
  return active ? <Badge tone="neutral">On</Badge> : <Badge tone="warning">Off</Badge>;
}
