import Link from "next/link";

import { PurchaseSuggestionCard } from "@/components/planning/purchase-suggestion-card";
import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatQuantity } from "@/lib/formatting/currency";
import {
  calculateOrderMaterialRequirements,
  generateShoppingList,
  type PlanningMaterial,
  type PlanningOrder,
  type PlanningPackagingMaterial,
  type PlanningProductMaterial,
} from "@/lib/planning/materials";
import {
  listPr2PlanningMaterials,
  listPr2PlanningOrders,
  listPr2PlanningPackagingMaterials,
  listPr2PlanningProductMaterials,
} from "@/lib/supabase/queries/planning";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const client = await createClient();
  const [{ data: materialsData }, { data: ordersData }] = await Promise.all([
    listPr2PlanningMaterials(client, "all"),
    listPr2PlanningOrders(client),
  ]);
  const orders = (ordersData ?? []) as unknown as PlanningOrder[];
  const productIds = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.product_id))));
  const packagingIds = Array.from(
    new Set(orders.flatMap((order) => order.items.map((item) => item.packaging_id).filter(Boolean))),
  ) as string[];
  const [{ data: productMaterialsData }, { data: packagingMaterialsData }] = await Promise.all([
    listPr2PlanningProductMaterials(client, productIds),
    listPr2PlanningPackagingMaterials(client, packagingIds),
  ]);
  const orderRequirements = calculateOrderMaterialRequirements({
    orders,
    packagingMaterials: (packagingMaterialsData ?? []) as unknown as PlanningPackagingMaterial[],
    productMaterials: (productMaterialsData ?? []) as unknown as PlanningProductMaterial[],
  });
  const shoppingList = generateShoppingList({
    materials: (materialsData ?? []) as unknown as PlanningMaterial[],
    orderRequirements,
  });
  const orderBlockedIds = new Set(
    shoppingList
      .filter((item) => item.orderRequiredQuantity > item.currentStock)
      .flatMap((item) => item.orderIds),
  );
  const lowStockItems = shoppingList.filter((item) => item.lowStockQuantity > 0);
  const orderShortItems = shoppingList.filter((item) => item.orderRequiredQuantity > item.currentStock);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link className="inline-flex h-10 items-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/shopping-list">
            Open shopping list
          </Link>
        }
        title="Dashboard"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PurchaseSuggestionCard label="Low stock materials" value={lowStockItems.length} />
        <PurchaseSuggestionCard label="Order shortages" value={orderShortItems.length} />
        <PurchaseSuggestionCard label="Orders blocked" value={orderBlockedIds.size} />
        <PurchaseSuggestionCard label="Open orders checked" value={orders.length} />
      </div>
      {shoppingList.length ? (
        <DataTable columns={["Material", "Current", "Needed for orders", "Shortage", "Reason"]}>
          {shoppingList.slice(0, 8).map((item) => (
            <tr key={item.material.id}>
              <td className="px-4 py-3">
                <Link className="font-medium hover:text-accent" href={`/materials/${item.material.id}`}>
                  {item.material.name}
                </Link>
              </td>
              <td className="px-4 py-3">{formatQuantity(item.currentStock)}</td>
              <td className="px-4 py-3">{formatQuantity(item.orderRequiredQuantity)}</td>
              <td className="px-4 py-3 text-amber-800">{formatQuantity(item.shortageQuantity)}</td>
              <td className="px-4 py-3">
                {item.reasons.includes("needed_for_orders") ? (
                  <StatusBadge tone="warning">Needed for Orders</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">Low Stock</StatusBadge>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No stock warnings" />
      )}
    </div>
  );
}
