import { TrendingDown } from "lucide-react";

type StockIndicatorProps = {
  low: boolean;
};

export function StockIndicator({ low }: StockIndicatorProps) {
  if (!low) return null;

  return (
    <span
      className="inline-flex size-5 items-center justify-center rounded-full bg-amber-50 text-amber-600"
      title="Low stock"
    >
      <TrendingDown aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
      <span className="sr-only">Low stock</span>
    </span>
  );
}
