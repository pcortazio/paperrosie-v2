import type { Pr2QuoteItem } from "@/types/database";

export function calculateQuoteSubtotal(items: Pick<Pr2QuoteItem, "active" | "total_price">[]) {
  return items.filter((item) => item.active).reduce((sum, item) => sum + item.total_price, 0);
}

export function calculateQuoteTotal(subtotal: number, discount: number) {
  return Math.max(subtotal - discount, 0);
}
