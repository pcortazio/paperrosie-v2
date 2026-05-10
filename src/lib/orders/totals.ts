import type { Pr2OrderItem } from "@/types/database";

export function calculateOrderSubtotal(items: Pick<Pr2OrderItem, "active" | "total_price">[]) {
  return items.filter((item) => item.active).reduce((sum, item) => sum + item.total_price, 0);
}
