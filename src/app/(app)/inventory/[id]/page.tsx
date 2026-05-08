import { notFound } from "next/navigation";

import {
  cancelInventoryCountAction,
  finalizeInventoryCountAction,
  updateInventoryCountItemAction,
} from "@/app/(app)/inventory/actions";
import { DataTable } from "@/components/tables/data-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { WarningCallout } from "@/components/ui/warning-callout";
import { formatQuantity } from "@/lib/formatting/currency";
import { getPr2InventoryCount } from "@/lib/supabase/queries/inventory";
import { createClient } from "@/lib/supabase/server";
import type { Pr2InventoryCount, Pr2InventoryCountItem, Pr2Material, Pr2Unit } from "@/types/database";

type InventoryCountRow = Pr2InventoryCount & {
  items: Array<Pr2InventoryCountItem & { material: (Pr2Material & { unit: Pr2Unit | null }) | null }>;
};

type InventoryCountPageProps = { params: Promise<{ id: string }> };

export default async function InventoryCountPage({ params }: InventoryCountPageProps) {
  const { id } = await params;
  const client = await createClient();
  const { data, error } = await getPr2InventoryCount(client, id);

  if (error || !data) notFound();

  const count = data as unknown as InventoryCountRow;

  return (
    <div className="space-y-5">
      <PageHeader title={`Inventory ${count.counted_at}`} />
      {count.status === "draft" ? (
        <WarningCallout>Finalizing this count will update material stock and create inventory adjustment movements.</WarningCallout>
      ) : null}
      <Card>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted">Status</span>
          <StatusBadge tone={count.status === "completed" ? "accent" : count.status === "cancelled" ? "warning" : "neutral"}>{count.status}</StatusBadge>
          <span className="text-muted">Notes</span>
          <span>{count.notes || "—"}</span>
        </div>
      </Card>
      {count.status === "draft" ? (
        <div className="flex gap-2">
          <form action={finalizeInventoryCountAction}>
            <input name="id" type="hidden" value={count.id} />
            <button className="h-10 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white" type="submit">Finalize count</button>
          </form>
          <form action={cancelInventoryCountAction}>
            <input name="id" type="hidden" value={count.id} />
            <button className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm" type="submit">Cancel count</button>
          </form>
        </div>
      ) : null}
      <DataTable columns={["Material", "System", "Counted", "Difference", "Unit", "Action"]}>
        {count.items.map((item) => {
          const liveDifference = item.counted_quantity - item.expected_quantity;
          return (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium">{item.material?.name ?? "—"}</td>
              <td className="px-4 py-3">{formatQuantity(item.expected_quantity)}</td>
              <td className="px-4 py-3">{formatQuantity(item.counted_quantity)}</td>
              <td className="px-4 py-3">{formatQuantity(count.status === "draft" ? liveDifference : item.quantity_difference)}</td>
              <td className="px-4 py-3">{item.material?.unit?.abbreviation ?? "—"}</td>
              <td className="px-4 py-3">
                {count.status === "draft" ? (
                  <form action={updateInventoryCountItemAction} className="flex gap-2">
                    <input name="id" type="hidden" value={item.id} />
                    <input name="inventory_count_id" type="hidden" value={count.id} />
                    <input className="h-9 w-28 rounded-md border border-border px-2 text-sm" defaultValue={item.counted_quantity} min="0" name="counted_quantity" step="0.001" type="number" />
                    <button className="text-sm font-medium text-accent" type="submit">Save</button>
                  </form>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
