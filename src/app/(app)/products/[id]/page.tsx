import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addProductMaterialAction,
  createProductVariantAction,
  setProductMaterialActiveStateAction,
  setProductVariantActiveStateAction,
  updateProductVariantAction,
} from "@/app/(app)/products/actions";
import { ProductVariantForm } from "@/components/products/product-variant-form";
import { MaterialCompositionForm } from "@/components/products/material-composition-form";
import { PriceBreakdown } from "@/components/pricing/price-breakdown";
import { DataTable } from "@/components/tables/data-table";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageThumb } from "@/components/ui/image-thumb";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatQuantity } from "@/lib/formatting/currency";
import { buildProductPrice } from "@/lib/pricing/build";
import { parsePricingDefaults } from "@/lib/pricing/settings";
import { listActivePr2Materials } from "@/lib/supabase/queries/materials";
import { listPr2Units } from "@/lib/supabase/queries/lookups";
import { getPr2Product } from "@/lib/supabase/queries/products";
import { getPr2Setting } from "@/lib/supabase/queries/settings";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Material, Pr2Packaging, Pr2Product, Pr2ProductMaterial, Pr2ProductVariant, Pr2Unit } from "@/types/database";

type ProductDetailRow = Pr2Product & {
  materials: Array<Pr2ProductMaterial & { material: Pr2Material | null; unit: Pr2Unit | null }>;
  packaging: Pr2Packaging | null;
  variants: Pr2ProductVariant[];
};

type ProductDetailPageProps = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data, error }, { data: materials }, { data: units }, { data: pricingSetting }] = await Promise.all([
    getPr2Product(client, id),
    listActivePr2Materials(client),
    listPr2Units(client),
    getPr2Setting(client, "pricing_defaults"),
  ]);
  if (error || !data) notFound();

  const product = data as unknown as ProductDetailRow;
  const defaults = parsePricingDefaults(pricingSetting?.value);
  const breakdown = buildProductPrice(product, product.materials, product.packaging, defaults);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={`/products/${product.id}/edit`}>Edit</Link>}
        title={product.name}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex items-start gap-4">
            <div className="size-20 overflow-hidden rounded-md border border-border bg-zinc-50">
              <ImageThumb imageUrl={product.image_url} />
            </div>
            <div className="space-y-2 text-sm">
              <ActiveStateBadge active={product.active} />
              <p className="text-muted">{product.description || "-"}</p>
              <p>Labor {formatCurrency(product.labor_cost_fixed)} · Extra {formatCurrency(product.extra_cost_fixed)}</p>
            </div>
          </div>
        </Card>
        <PriceBreakdown breakdown={breakdown} />
      </div>
      <div className="space-y-4">
        <details className="rounded-lg border border-border bg-surface p-4" open>
          <summary className="cursor-pointer text-sm font-medium">Overview</summary>
          <div className="mt-4 text-sm text-muted">Default packaging: {product.packaging?.name ?? "-"}</div>
        </details>
        <details className="rounded-lg border border-border bg-surface p-4" open>
          <summary className="cursor-pointer text-sm font-medium">Variants</summary>
          <div className="mt-4 space-y-3">
            <ProductVariantForm action={createProductVariantAction.bind(null, product.id)} />
            {product.variants.map((variant) => (
              <details className="rounded-md border border-border p-3" key={variant.id}>
                <summary className="cursor-pointer text-sm font-medium">
                  {variant.name} {!variant.active ? "(inactive)" : ""}
                </summary>
                <div className="mt-3 space-y-3">
                  <ProductVariantForm action={updateProductVariantAction.bind(null, product.id, variant.id)} variant={variant} />
                  <form action={setProductVariantActiveStateAction}>
                    <input name="id" type="hidden" value={variant.id} />
                    <input name="product_id" type="hidden" value={product.id} />
                    <input name="active" type="hidden" value={variant.active ? "false" : "true"} />
                    <button className="text-sm font-medium text-accent" type="submit">{variant.active ? "Deactivate" : "Reactivate"}</button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </details>
        <details className="rounded-lg border border-border bg-surface p-4" open>
          <summary className="cursor-pointer text-sm font-medium">Materials</summary>
          <div className="mt-4 space-y-3">
            <MaterialCompositionForm action={addProductMaterialAction.bind(null, product.id)} materials={materials ?? []} units={units ?? []} variants={product.variants} />
            {product.materials.length ? (
              <DataTable columns={["Material", "Variant", "Quantity", "Unit", "Cost", "Active", "Action"]}>
                {product.materials.map((line) => {
                  const variant = product.variants.find((item) => item.id === line.variant_id);
                  return (
                    <tr key={line.id}>
                      <td className="px-4 py-3">{line.material?.name ?? "-"}</td>
                      <td className="px-4 py-3">{variant?.name ?? "Base"}</td>
                      <td className="px-4 py-3">{formatQuantity(line.quantity)}</td>
                      <td className="px-4 py-3">{line.unit?.abbreviation ?? "-"}</td>
                      <td className="px-4 py-3">{formatCurrency(line.quantity * (line.material?.reference_cost_per_unit ?? 0))}</td>
                      <td className="px-4 py-3"><ActiveStateBadge active={line.active} /></td>
                      <td className="px-4 py-3">
                        <form action={setProductMaterialActiveStateAction}>
                          <input name="id" type="hidden" value={line.id} />
                          <input name="product_id" type="hidden" value={product.id} />
                          <input name="active" type="hidden" value={line.active ? "false" : "true"} />
                          <button className="text-sm font-medium text-accent" type="submit">{line.active ? "Deactivate" : "Reactivate"}</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            ) : <EmptyState title="No materials added" />}
          </div>
        </details>
        <details className="rounded-lg border border-border bg-surface p-4" open>
          <summary className="cursor-pointer text-sm font-medium">Pricing</summary>
          <div className="mt-4 max-w-md"><PriceBreakdown breakdown={breakdown} /></div>
        </details>
        <details className="rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium">Packaging</summary>
          <div className="mt-4 text-sm text-muted">{product.packaging?.name ?? "No default packaging"}</div>
        </details>
      </div>
    </div>
  );
}
