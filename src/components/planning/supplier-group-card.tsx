import { ShoppingListTable } from "@/components/planning/shopping-list-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatQuantity } from "@/lib/formatting/currency";
import type { SupplierShoppingListGroup } from "@/lib/planning/materials";

type SupplierGroupCardProps = {
  group: SupplierShoppingListGroup;
};

export function SupplierGroupCard({ group }: SupplierGroupCardProps) {
  return (
    <Card className="p-0">
      <details open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="text-base font-medium">{group.supplierName}</h2>
            <p className="mt-1 text-sm text-muted">
              {group.items.length} material{group.items.length === 1 ? "" : "s"} needing purchase
            </p>
          </div>
          <Badge tone={group.supplierId ? "neutral" : "warning"}>
            {formatQuantity(group.totalShortageQuantity)} total shortage
          </Badge>
        </summary>
        <div className="border-t border-border p-3">
          <ShoppingListTable items={group.items} />
        </div>
      </details>
    </Card>
  );
}
