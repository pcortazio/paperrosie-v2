import { Badge } from "@/components/ui/badge";
import type { ShoppingListReason } from "@/lib/planning/materials";

type MaterialShortageBadgeProps = {
  inactive?: boolean;
  reasons: ShoppingListReason[];
};

export function MaterialShortageBadge({ inactive, reasons }: MaterialShortageBadgeProps) {
  if (inactive) {
    return <Badge tone="warning">Inactive required</Badge>;
  }

  const hasLowStock = reasons.includes("low_stock");
  const hasOrders = reasons.includes("needed_for_orders");

  if (hasLowStock && hasOrders) {
    return <Badge tone="warning">Both</Badge>;
  }

  if (hasOrders) {
    return <Badge tone="accent">Needed for Orders</Badge>;
  }

  return <Badge tone="warning">Low Stock</Badge>;
}
