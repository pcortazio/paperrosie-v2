export type SupplierInsightPurchase = {
  supplierId: string;
  supplierName: string;
  orderedAt: string;
  receivedAt: string | null;
  unitCost: number;
};

export type SupplierInsights = {
  averageDeliveryDays: Array<{ supplierName: string; days: number }>;
  bestPrice: { supplierName: string; value: number } | null;
  fastestDelivery: { supplierName: string; days: number } | null;
};

export function calculateDeliveryDays(orderedAt: string, receivedAt: string | null) {
  if (!receivedAt) return null;

  const ordered = new Date(`${orderedAt}T00:00:00`);
  const received = new Date(`${receivedAt}T00:00:00`);
  const days = Math.round((received.getTime() - ordered.getTime()) / 86_400_000);

  return Number.isFinite(days) ? Math.max(days, 0) : null;
}

export function calculateSupplierInsights(purchases: SupplierInsightPurchase[]): SupplierInsights {
  const received = purchases.filter((purchase) => purchase.receivedAt);
  const bestPrice = received.reduce<SupplierInsights["bestPrice"]>((best, purchase) => {
    if (!best || purchase.unitCost < best.value) {
      return { supplierName: purchase.supplierName, value: purchase.unitCost };
    }

    return best;
  }, null);

  const deliveryBySupplier = new Map<string, { count: number; days: number; supplierName: string }>();

  received.forEach((purchase) => {
    const days = calculateDeliveryDays(purchase.orderedAt, purchase.receivedAt);
    if (days === null) return;

    const current = deliveryBySupplier.get(purchase.supplierId) ?? {
      count: 0,
      days: 0,
      supplierName: purchase.supplierName,
    };

    deliveryBySupplier.set(purchase.supplierId, {
      ...current,
      count: current.count + 1,
      days: current.days + days,
    });
  });

  const averageDeliveryDays = Array.from(deliveryBySupplier.values()).map((supplier) => ({
    days: Math.round((supplier.days / supplier.count) * 10) / 10,
    supplierName: supplier.supplierName,
  }));

  const fastestDelivery = averageDeliveryDays.reduce<SupplierInsights["fastestDelivery"]>(
    (fastest, supplier) => {
      if (!fastest || supplier.days < fastest.days) return supplier;
      return fastest;
    },
    null,
  );

  return { averageDeliveryDays, bestPrice, fastestDelivery };
}
