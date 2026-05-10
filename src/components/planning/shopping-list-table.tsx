import Link from "next/link";

import { MaterialShortageBadge } from "@/components/planning/material-shortage-badge";
import { DataTable } from "@/components/tables/data-table";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { formatQuantity } from "@/lib/formatting/currency";
import type { ShoppingListItem } from "@/lib/planning/materials";

type ShoppingListTableProps = {
  items: ShoppingListItem[];
};

export function ShoppingListTable({ items }: ShoppingListTableProps) {
  return (
    <DataTable columns={["Material", "Current", "Minimum", "Required", "Shortage", "Unit", "Supplier", "Reason", "Status"]}>
      {items.map((item) => (
        <tr key={item.material.id}>
          <td className="px-4 py-3 font-medium">
            <Link className="hover:text-accent" href={`/materials/${item.material.id}`}>
              {item.material.name}
            </Link>
          </td>
          <td className="px-4 py-3">{formatQuantity(item.currentStock)}</td>
          <td className="px-4 py-3">{formatQuantity(item.minimumStock)}</td>
          <td className="px-4 py-3">{formatQuantity(item.orderRequiredQuantity)}</td>
          <td className="px-4 py-3 font-medium text-amber-800">{formatQuantity(item.shortageQuantity)}</td>
          <td className="px-4 py-3 text-muted">{item.material.unit?.abbreviation ?? "-"}</td>
          <td className="px-4 py-3 text-muted">{item.preferredSupplier?.name ?? "Unassigned Supplier"}</td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              <MaterialShortageBadge reasons={item.reasons} />
              {item.inactiveRequired ? <MaterialShortageBadge inactive reasons={item.reasons} /> : null}
            </div>
          </td>
          <td className="px-4 py-3"><ActiveStateBadge active={item.material.active} /></td>
        </tr>
      ))}
    </DataTable>
  );
}
