import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addPackagingMaterialAction,
  setPackagingMaterialActiveStateAction,
} from "@/app/(app)/packaging/actions";
import { MaterialCompositionForm } from "@/components/products/material-composition-form";
import { PriceBreakdown } from "@/components/pricing/price-breakdown";
import { DataTable } from "@/components/tables/data-table";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageThumb } from "@/components/ui/image-thumb";
import { PageHeader } from "@/components/ui/page-header";
import { calculateSuggestedPrice } from "@/lib/calculations/pricing";
import { formatCurrency, formatQuantity } from "@/lib/formatting/currency";
import { buildPackagingPrice } from "@/lib/pricing/build";
import { parsePricingDefaults } from "@/lib/pricing/settings";
import { listActivePr2Materials } from "@/lib/supabase/queries/materials";
import { listPr2Units } from "@/lib/supabase/queries/lookups";
import { getPr2Packaging } from "@/lib/supabase/queries/packaging";
import { getPr2Setting } from "@/lib/supabase/queries/settings";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Material, Pr2Packaging, Pr2PackagingMaterial, Pr2Unit } from "@/types/database";

type PackagingDetailRow = Pr2Packaging & {
  materials: Array<Pr2PackagingMaterial & { material: Pr2Material | null; unit: Pr2Unit | null }>;
};

type PackagingDetailPageProps = { params: Promise<{ id: string }> };

export default async function PackagingDetailPage({ params }: PackagingDetailPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data, error }, { data: materials }, { data: units }, { data: pricingSetting }] = await Promise.all([
    getPr2Packaging(client, id),
    listActivePr2Materials(client),
    listPr2Units(client),
    getPr2Setting(client, "pricing_defaults"),
  ]);
  if (error || !data) notFound();

  const packaging = data as unknown as PackagingDetailRow;
  const defaults = parsePricingDefaults(pricingSetting?.value);
  const packagingCost = buildPackagingPrice(packaging, packaging.materials);
  const breakdown = calculateSuggestedPrice({
    extraCost: 0,
    laborCost: 0,
    marginPercent: 0,
    materialCost: 0,
    packagingCost: packagingCost.finalCost,
    platformFeeFixed: defaults.platformFeeFixed,
    platformFeePercent: defaults.platformFeePercent,
    roundingIncrement: defaults.roundingIncrement,
  });

  return (
    <div className="space-y-5">
      <PageHeader actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={`/packaging/${packaging.id}/edit`}>Edit</Link>} title={packaging.name} />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex items-start gap-4">
            <div className="size-20 overflow-hidden rounded-md border border-border bg-zinc-50">
              <ImageThumb imageUrl={packaging.image_url} />
            </div>
            <div className="space-y-2 text-sm">
              <ActiveStateBadge active={packaging.active} />
              <p className="text-muted">{packaging.description || "-"}</p>
              <p>Margin {packaging.margin_percent}%</p>
            </div>
          </div>
        </Card>
        <PriceBreakdown breakdown={breakdown} />
      </div>
      <MaterialCompositionForm action={addPackagingMaterialAction.bind(null, packaging.id)} materials={materials ?? []} units={units ?? []} />
      {packaging.materials.length ? (
        <DataTable columns={["Material", "Quantity", "Unit", "Cost", "Active", "Action"]}>
          {packaging.materials.map((line) => (
            <tr key={line.id}>
              <td className="px-4 py-3">{line.material?.name ?? "-"}</td>
              <td className="px-4 py-3">{formatQuantity(line.quantity)}</td>
              <td className="px-4 py-3">{line.unit?.abbreviation ?? "-"}</td>
              <td className="px-4 py-3">{formatCurrency(line.quantity * (line.material?.reference_cost_per_unit ?? 0))}</td>
              <td className="px-4 py-3"><ActiveStateBadge active={line.active} /></td>
              <td className="px-4 py-3">
                <form action={setPackagingMaterialActiveStateAction}>
                  <input name="id" type="hidden" value={line.id} />
                  <input name="packaging_id" type="hidden" value={packaging.id} />
                  <input name="active" type="hidden" value={line.active ? "false" : "true"} />
                  <button className="text-sm font-medium text-accent" type="submit">{line.active ? "Deactivate" : "Reactivate"}</button>
                </form>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : <EmptyState title="No materials added" />}
    </div>
  );
}
