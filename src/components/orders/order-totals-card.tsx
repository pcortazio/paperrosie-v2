import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatting/currency";

type OrderTotalsCardProps = {
  discount: number;
  subtotal: number;
  total: number;
};

export function OrderTotalsCard({ discount, subtotal, total }: OrderTotalsCardProps) {
  return (
    <Card>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>{formatCurrency(discount)}</dd></div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-medium"><dt>Total</dt><dd className="text-accent">{formatCurrency(total)}</dd></div>
      </dl>
    </Card>
  );
}
