import { Card } from "@/components/ui/card";

type PurchaseSuggestionCardProps = {
  label: string;
  value: string | number;
};

export function PurchaseSuggestionCard({ label, value }: PurchaseSuggestionCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-normal text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </Card>
  );
}
