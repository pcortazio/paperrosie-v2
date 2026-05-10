import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { formatQuantity } from "@/lib/formatting/currency";
import type { OrderReadinessLine } from "@/lib/orders/stock-readiness";

type StockReadinessCardProps = {
  lines: OrderReadinessLine[];
};

export function StockReadinessCard({ lines }: StockReadinessCardProps) {
  return (
    <Card className="space-y-3">
      <h2 className="text-base font-medium">Stock readiness</h2>
      {lines.length ? (
        <DataTable columns={["Material", "Current", "Needed", "Remaining", "Missing", "Status"]}>
          {lines.map((line) => (
            <tr key={line.materialId}>
              <td className="px-4 py-3">{line.materialName}</td>
              <td className="px-4 py-3">{formatQuantity(line.currentStock)}</td>
              <td className="px-4 py-3">{formatQuantity(line.requiredQuantity)}</td>
              <td className="px-4 py-3">{formatQuantity(line.remainingStock)}</td>
              <td className="px-4 py-3 text-amber-800">{formatQuantity(line.missingQuantity)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {line.missingQuantity > 0 ? <Badge tone="warning">Short</Badge> : <Badge tone="neutral">Ready</Badge>}
                  {line.inactiveRequired ? <Badge tone="warning">Inactive</Badge> : null}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <p className="text-sm text-muted">No active materials required.</p>
      )}
    </Card>
  );
}
