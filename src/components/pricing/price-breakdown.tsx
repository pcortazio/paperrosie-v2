import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatting/currency";
import type { PriceBreakdown as PriceBreakdownValue } from "@/lib/calculations/pricing";

type PriceBreakdownProps = {
  breakdown: PriceBreakdownValue;
};

export function PriceBreakdown({ breakdown }: PriceBreakdownProps) {
  const rows = [
    ["Materials", breakdown.materialCost],
    ["Packaging", breakdown.packagingCost],
    ["Labor", breakdown.laborCost],
    ["Extra costs", breakdown.extraCost],
    ["Platform fee", breakdown.platformFee],
    ["Profit", breakdown.markupProfit],
  ] as const;

  return (
    <Card className="space-y-3">
      <h2 className="text-base font-medium">Pricing breakdown</h2>
      <dl className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between gap-3" key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="text-foreground">{formatCurrency(value)}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <dt className="font-medium text-foreground">Suggested price</dt>
          <dd className="text-lg font-medium text-accent">{formatCurrency(breakdown.finalPrice)}</dd>
        </div>
      </dl>
    </Card>
  );
}
