export const MIN_UNIT_COST = 0.01;

export function calculateUnitCost(
  price: number | null | undefined,
  qty: number | null | undefined
) {
  if (price == null || qty == null || qty <= 0) return null;

  const rawCost = price / qty;
  if (rawCost <= 0) return 0;

  return Math.max(MIN_UNIT_COST, Math.round(rawCost * 100) / 100);
}
