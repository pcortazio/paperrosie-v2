import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addPurchaseItemAction,
  cancelPurchaseAction,
  receivePurchaseAction,
  setPurchaseItemActiveStateAction,
} from "@/app/(app)/purchases/actions";
import { PurchaseItemForm } from "@/components/purchases/purchase-item-form";
import { DataTable } from "@/components/tables/data-table";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { WarningCallout } from "@/components/ui/warning-callout";
import { formatCurrency, formatQuantity } from "@/lib/formatting/currency";
import { listActivePr2Materials } from "@/lib/supabase/queries/materials";
import { listPr2Units } from "@/lib/supabase/queries/lookups";
import { getPr2Purchase } from "@/lib/supabase/queries/purchases";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Material, Pr2Purchase, Pr2PurchaseItem, Pr2Supplier, Pr2Unit } from "@/types/database";

type PurchaseDetailRow = Pr2Purchase & {
  items: Array<Pr2PurchaseItem & { material: Pr2Material | null; unit: Pr2Unit | null }>;
  supplier: Pr2Supplier | null;
};

type PurchaseDetailPageProps = { params: Promise<{ id: string }> };

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data, error }, { data: materials }, { data: units }] = await Promise.all([
    getPr2Purchase(client, id),
    listActivePr2Materials(client),
    listPr2Units(client),
  ]);

  if (error || !data) notFound();

  const purchase = data as unknown as PurchaseDetailRow;
  const total = purchase.items.filter((item) => item.active).reduce((sum, item) => sum + item.total_cost, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={`/purchases/${purchase.id}/edit`}>
            Edit
          </Link>
        }
        title={purchase.purchase_number}
      />
      {purchase.status === "received" ? (
        <WarningCallout>
          This purchase is received. Editing items will reverse previous stock movements, reapply updated movements, and recalculate material reference costs.
        </WarningCallout>
      ) : null}
      <Card>
        <div className="grid gap-4 text-sm sm:grid-cols-4">
          <div><p className="text-muted">Supplier</p><p>{purchase.supplier?.name ?? "—"}</p></div>
          <div><p className="text-muted">Ordered</p><p>{purchase.ordered_at}</p></div>
          <div><p className="text-muted">Received</p><p>{purchase.received_at ?? "—"}</p></div>
          <div><p className="text-muted">Status</p><StatusBadge tone={purchase.status === "received" ? "accent" : purchase.status === "cancelled" ? "warning" : "neutral"}>{purchase.status}</StatusBadge></div>
          <div><p className="text-muted">Total</p><p>{formatCurrency(total)}</p></div>
          <div><p className="text-muted">Active</p><ActiveStateBadge active={purchase.active} /></div>
          <div className="sm:col-span-2"><p className="text-muted">Notes</p><p>{purchase.notes || "—"}</p></div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        {purchase.status !== "received" && purchase.status !== "cancelled" ? (
          <form action={receivePurchaseAction} className="flex gap-2">
            <input name="id" type="hidden" value={purchase.id} />
            <input className="h-10 rounded-md border border-border px-3 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="received_at" type="date" />
            <button className="h-10 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white" type="submit">Receive purchase</button>
          </form>
        ) : null}
        {purchase.status !== "cancelled" ? (
          <form action={cancelPurchaseAction}>
            <input name="id" type="hidden" value={purchase.id} />
            <button className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm" type="submit">Cancel purchase</button>
          </form>
        ) : null}
      </div>
      {purchase.status !== "cancelled" ? (
        <PurchaseItemForm action={addPurchaseItemAction.bind(null, purchase.id)} materials={materials ?? []} units={units ?? []} />
      ) : null}
      <DataTable columns={["Material", "Quantity", "Unit", "Subtotal", "Tax", "Shipping", "Total", "Unit cost", "Active", "Actions"]}>
        {purchase.items.map((item) => (
          <tr key={item.id} className="align-top">
            <td className="px-4 py-3">{item.material?.name ?? "—"}</td>
            <td className="px-4 py-3">{formatQuantity(item.quantity)}</td>
            <td className="px-4 py-3">{item.unit?.abbreviation ?? "—"}</td>
            <td className="px-4 py-3">{formatCurrency(item.subtotal)}</td>
            <td className="px-4 py-3">{formatCurrency(item.tax)}</td>
            <td className="px-4 py-3">{formatCurrency(item.shipping_allocated)}</td>
            <td className="px-4 py-3">{formatCurrency(item.total_cost)}</td>
            <td className="px-4 py-3">{formatCurrency(item.unit_cost)}</td>
            <td className="px-4 py-3"><ActiveStateBadge active={item.active} /></td>
            <td className="px-4 py-3">
              <Link className="mb-2 block text-sm font-medium text-accent hover:underline" href={`/purchases/${purchase.id}/items/${item.id}/edit`}>
                Edit
              </Link>
              <form action={setPurchaseItemActiveStateAction}>
                <input name="id" type="hidden" value={item.id} />
                <input name="purchase_id" type="hidden" value={purchase.id} />
                <input name="active" type="hidden" value={item.active ? "false" : "true"} />
                <button className="text-sm font-medium text-accent hover:underline" type="submit">
                  {item.active ? "Deactivate" : "Reactivate"}
                </button>
              </form>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
