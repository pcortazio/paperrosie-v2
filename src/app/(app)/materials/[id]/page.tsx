import Link from "next/link";
import { notFound } from "next/navigation";

import { DataTable } from "@/components/tables/data-table";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { WarningCallout } from "@/components/ui/warning-callout";
import { calculateSupplierInsights } from "@/lib/calculations/suppliers";
import { formatCurrency, formatQuantity } from "@/lib/formatting/currency";
import { getPr2Material } from "@/lib/supabase/queries/materials";
import { listPr2PackagingMaterialsForMaterial } from "@/lib/supabase/queries/packaging";
import { listPr2ProductMaterialsForMaterial } from "@/lib/supabase/queries/products";
import { listPr2PurchaseItemsForMaterial } from "@/lib/supabase/queries/purchases";
import { listPr2StockMovementsForMaterial } from "@/lib/supabase/queries/stock-movements";
import { createClient } from "@/lib/supabase/server";
import type {
  Pr2Material,
  Pr2MaterialCategory,
  Pr2Packaging,
  Pr2PackagingMaterial,
  Pr2Purchase,
  Pr2PurchaseItem,
  Pr2Product,
  Pr2ProductMaterial,
  Pr2ProductVariant,
  Pr2StockMovement,
  Pr2Supplier,
  Pr2Unit,
} from "@/types/database";

type MaterialDetailRow = Pr2Material & {
  category: Pr2MaterialCategory | null;
  preferred_supplier: Pr2Supplier | null;
  unit: Pr2Unit | null;
};

type MaterialPurchaseItem = Pr2PurchaseItem & {
  purchase: (Pr2Purchase & { supplier: Pr2Supplier | null }) | null;
};

type MaterialProductLine = Pr2ProductMaterial & {
  product: Pr2Product | null;
  unit: Pr2Unit | null;
  variant: Pr2ProductVariant | null;
};

type MaterialPackagingLine = Pr2PackagingMaterial & {
  packaging: Pr2Packaging | null;
  unit: Pr2Unit | null;
};

type MaterialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [
    { data, error },
    { data: purchaseItems },
    { data: stockMovements },
    { data: productLines },
    { data: packagingLines },
  ] = await Promise.all([
    getPr2Material(client, id),
    listPr2PurchaseItemsForMaterial(client, id),
    listPr2StockMovementsForMaterial(client, id),
    listPr2ProductMaterialsForMaterial(client, id),
    listPr2PackagingMaterialsForMaterial(client, id),
  ]);

  if (error || !data) notFound();

  const material = data as unknown as MaterialDetailRow;
  const purchases = (purchaseItems ?? []) as unknown as MaterialPurchaseItem[];
  const movements = (stockMovements ?? []) as Pr2StockMovement[];
  const productUsage = (productLines ?? []) as unknown as MaterialProductLine[];
  const packagingUsage = (packagingLines ?? []) as unknown as MaterialPackagingLine[];
  const insights = calculateSupplierInsights(
    purchases
      .filter((item) => item.purchase?.status === "received" && item.purchase.supplier)
      .map((item) => ({
        orderedAt: item.purchase!.ordered_at,
        receivedAt: item.purchase!.received_at,
        supplierId: item.purchase!.supplier!.id,
        supplierName: item.purchase!.supplier!.name,
        unitCost: item.unit_cost,
      })),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-zinc-50"
            href={`/materials/${material.id}/edit`}
          >
            Edit
          </Link>
        }
        title={material.name}
      />
      {!material.active ? (
        <WarningCallout>
          This item is inactive. It remains here for history, but you may want to replace it.
        </WarningCallout>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium">Material info</h2>
            <ActiveStateBadge active={material.active} />
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Category</dt>
              <dd className="mt-1 text-foreground">{material.category?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted">Unit</dt>
              <dd className="mt-1 text-foreground">{material.unit?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted">Current stock</dt>
              <dd className="mt-1 text-foreground">{formatQuantity(material.current_stock)}</dd>
            </div>
            <div>
              <dt className="text-muted">Minimum stock</dt>
              <dd className="mt-1 text-foreground">{formatQuantity(material.minimum_stock)}</dd>
            </div>
            <div>
              <dt className="text-muted">Reference cost</dt>
              <dd className="mt-1 text-foreground">{formatCurrency(material.reference_cost_per_unit)}</dd>
            </div>
            <div>
              <dt className="text-muted">Preferred supplier</dt>
              <dd className="mt-1 text-foreground">{material.preferred_supplier?.name ?? "-"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap text-foreground">{material.notes || "-"}</dd>
            </div>
          </dl>
        </Card>
        <div className="grid gap-3">
          <Card>
            <p className="text-sm text-muted">Best price</p>
            <p className="mt-2 text-sm text-foreground">
              {insights.bestPrice
                ? `${insights.bestPrice.supplierName} - ${formatCurrency(insights.bestPrice.value)}`
                : "-"}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Fastest delivery</p>
            <p className="mt-2 text-sm text-foreground">
              {insights.fastestDelivery
                ? `${insights.fastestDelivery.supplierName} - ${insights.fastestDelivery.days} days`
                : "-"}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Average delivery</p>
            <p className="mt-2 text-sm text-foreground">
              {insights.averageDeliveryDays[0]
                ? `${insights.averageDeliveryDays[0].supplierName} - ${insights.averageDeliveryDays[0].days} days`
                : "-"}
            </p>
          </Card>
        </div>
      </div>
      {purchases.length ? (
        <DataTable columns={["Purchase", "Supplier", "Ordered", "Received", "Qty", "Unit cost", "Total"]}>
          {purchases.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.purchase?.purchase_number ?? "-"}</td>
              <td className="px-4 py-3">{item.purchase?.supplier?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.purchase?.ordered_at ?? "-"}</td>
              <td className="px-4 py-3">{item.purchase?.received_at ?? "-"}</td>
              <td className="px-4 py-3">{formatQuantity(item.quantity)}</td>
              <td className="px-4 py-3">{formatCurrency(item.unit_cost)}</td>
              <td className="px-4 py-3">{formatCurrency(item.total_cost)}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Purchase history" />
      )}
      {movements.length ? (
        <DataTable columns={["Date", "Type", "Change", "Previous", "New", "Source"]}>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="px-4 py-3">{new Date(movement.created_at).toLocaleDateString("en-CA")}</td>
              <td className="px-4 py-3">{movement.type}</td>
              <td className="px-4 py-3">{formatQuantity(movement.quantity_change)}</td>
              <td className="px-4 py-3">{formatQuantity(movement.previous_quantity)}</td>
              <td className="px-4 py-3">{formatQuantity(movement.new_quantity)}</td>
              <td className="px-4 py-3">{movement.source_type}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Stock movement history" />
      )}
      {productUsage.length ? (
        <DataTable columns={["Product", "Variant", "Quantity", "Unit"]}>
          {productUsage.map((line) => (
            <tr key={line.id}>
              <td className="px-4 py-3">{line.product?.name ?? "-"}</td>
              <td className="px-4 py-3">{line.variant?.name ?? "Base"}</td>
              <td className="px-4 py-3">{formatQuantity(line.quantity)}</td>
              <td className="px-4 py-3">{line.unit?.abbreviation ?? "-"}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Products using this material" />
      )}
      {packagingUsage.length ? (
        <DataTable columns={["Packaging", "Quantity", "Unit"]}>
          {packagingUsage.map((line) => (
            <tr key={line.id}>
              <td className="px-4 py-3">{line.packaging?.name ?? "-"}</td>
              <td className="px-4 py-3">{formatQuantity(line.quantity)}</td>
              <td className="px-4 py-3">{line.unit?.abbreviation ?? "-"}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Packaging using this material" />
      )}
    </div>
  );
}
