import Link from "next/link";
import { notFound } from "next/navigation";

import { addOrderItemAction, completeOrderAction, setOrderItemActiveStateAction } from "@/app/(app)/orders/actions";
import { CompletedOrderWarning } from "@/components/orders/completed-order-warning";
import { MissingMaterialsList } from "@/components/orders/missing-materials-list";
import { OrderItemEditor } from "@/components/orders/order-item-editor";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTotalsCard } from "@/components/orders/order-totals-card";
import { StockReadinessCard } from "@/components/orders/stock-readiness-card";
import { DataTable } from "@/components/tables/data-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { formatCurrency } from "@/lib/formatting/currency";
import { calculateOrderStockReadiness } from "@/lib/orders/stock-readiness";
import { listActivePr2Packaging } from "@/lib/supabase/queries/packaging";
import { listActivePr2ProductsForQuotes } from "@/lib/supabase/queries/products";
import { getPr2Order } from "@/lib/supabase/queries/orders";
import { listPr2StockMovementsForSource } from "@/lib/supabase/queries/stock-movements";
import { listPr2PackagingMaterialsForOrderItems, listPr2ProductMaterialsForOrderItems } from "@/lib/supabase/queries/order-readiness";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Customer, Pr2Material, Pr2Order, Pr2OrderItem, Pr2Packaging, Pr2PackagingMaterial, Pr2Product, Pr2ProductMaterial, Pr2ProductVariant, Pr2Quote, Pr2StockMovement } from "@/types/database";

type OrderDetailRow = Pr2Order & {
  customer: Pr2Customer | null;
  quote: Pr2Quote | null;
  items: Array<Pr2OrderItem & { packaging: Pr2Packaging | null; product: Pr2Product | null; variant: Pr2ProductVariant | null }>;
};

type OrderStockMovementRow = Pr2StockMovement & { material: Pr2Material | null };

type OrderDetailPageProps = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data, error }, { data: products }, { data: packaging }] = await Promise.all([
    getPr2Order(client, id),
    listActivePr2ProductsForQuotes(client),
    listActivePr2Packaging(client),
  ]);
  if (error || !data) notFound();
  const order = data as unknown as OrderDetailRow;
  const productIds = Array.from(new Set(order.items.map((item) => item.product_id)));
  const packagingIds = Array.from(new Set(order.items.map((item) => item.packaging_id).filter(Boolean))) as string[];
  const [{ data: productMaterials }, { data: packagingMaterials }] = await Promise.all([
    listPr2ProductMaterialsForOrderItems(client, productIds),
    listPr2PackagingMaterialsForOrderItems(client, packagingIds),
  ]);
  const readiness = calculateOrderStockReadiness({
    order,
    packagingMaterials: (packagingMaterials ?? []) as unknown as Array<Pr2PackagingMaterial & { material: never }>,
    productMaterials: (productMaterials ?? []) as unknown as Array<Pr2ProductMaterial & { material: never }>,
  });
  const { data: movementData } = await listPr2StockMovementsForSource(client, "order", order.id);
  const movements = (movementData ?? []) as unknown as OrderStockMovementRow[];

  return (
    <div className="space-y-5">
      <PageHeader actions={<Link className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={`/orders/${order.id}/edit`}>Edit</Link>} title={order.order_number} />
      {order.status === "completed" ? <CompletedOrderWarning /> : null}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div><p className="text-muted">Customer</p><p>{order.customer?.name ?? "-"}</p></div>
            <div><p className="text-muted">Status</p><OrderStatusBadge status={order.status} /></div>
            <div><p className="text-muted">Source quote</p><p>{order.quote ? <Link className="text-accent" href={`/quotes/${order.quote.id}`}>{order.quote.quote_number}</Link> : "-"}</p></div>
          </div>
        </Card>
        <OrderTotalsCard discount={order.discount} subtotal={order.subtotal} total={order.total} />
      </div>
      {order.status !== "completed" && order.status !== "cancelled" ? (
        <OrderItemEditor action={addOrderItemAction.bind(null, order.id)} packaging={packaging ?? []} products={(products ?? []) as unknown as Array<Pr2Product & { variants: Pr2ProductVariant[] }>} />
      ) : null}
      <DataTable columns={["Product", "Variant", "Packaging", "Qty", "Unit", "Total", "Active", "Action"]}>
        {order.items.map((item) => {
          const inactive = !item.product?.active || (item.variant && !item.variant.active) || (item.packaging && !item.packaging.active);
          return (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.product?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.variant?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.packaging?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.quantity}</td>
              <td className="px-4 py-3">{formatCurrency(item.unit_price)}</td>
              <td className="px-4 py-3">{formatCurrency(item.total_price)}</td>
              <td className="px-4 py-3"><ActiveStateBadge active={item.active && !inactive} /></td>
              <td className="px-4 py-3">
                {order.status !== "completed" ? (
                  <form action={setOrderItemActiveStateAction}>
                    <input name="id" type="hidden" value={item.id} />
                    <input name="order_id" type="hidden" value={order.id} />
                    <input name="active" type="hidden" value={item.active ? "false" : "true"} />
                    <button className="text-sm font-medium text-accent" type="submit">{item.active ? "Deactivate" : "Reactivate"}</button>
                  </form>
                ) : "-"}
                {inactive ? <p className="mt-2 text-xs text-amber-700">This item is inactive. It remains here for history, but you may want to replace it.</p> : null}
              </td>
            </tr>
          );
        })}
      </DataTable>
      <StockReadinessCard lines={readiness.lines} />
      <MissingMaterialsList lines={readiness.lines} />
      {order.status === "in_progress" && readiness.canComplete ? (
        <form action={completeOrderAction}>
          <input name="id" type="hidden" value={order.id} />
          <button className="h-10 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white" type="submit">Complete order</button>
        </form>
      ) : null}
      {movements.length ? (
        <DataTable columns={["Date", "Material", "Change", "Previous", "New"]}>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="px-4 py-3">{new Date(movement.created_at).toLocaleDateString("en-CA")}</td>
              <td className="px-4 py-3">{movement.material?.name ?? movement.material_id}</td>
              <td className="px-4 py-3">{movement.quantity_change}</td>
              <td className="px-4 py-3">{movement.previous_quantity}</td>
              <td className="px-4 py-3">{movement.new_quantity}</td>
            </tr>
          ))}
        </DataTable>
      ) : null}
      <Card><p className="whitespace-pre-wrap text-sm text-muted">{order.notes || "-"}</p></Card>
    </div>
  );
}
