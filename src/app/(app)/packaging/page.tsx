import Link from "next/link";

import { ActiveStateForm } from "@/components/forms/active-state-form";
import { setPackagingActiveStateAction } from "@/app/(app)/packaging/actions";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ShowInactiveToggle } from "@/components/tables/show-inactive-toggle";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageThumb } from "@/components/ui/image-thumb";
import { PageHeader } from "@/components/ui/page-header";
import { calculateSuggestedPrice } from "@/lib/calculations/pricing";
import { formatCurrency } from "@/lib/formatting/currency";
import { buildPackagingPrice } from "@/lib/pricing/build";
import { parsePricingDefaults } from "@/lib/pricing/settings";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import { listPr2Packaging } from "@/lib/supabase/queries/packaging";
import { getPr2Setting } from "@/lib/supabase/queries/settings";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Material, Pr2Packaging, Pr2PackagingMaterial } from "@/types/database";

type PackagingRow = Pr2Packaging & {
  materials: Array<Pr2PackagingMaterial & { material: Pr2Material | null }>;
};

type PackagingPageProps = { searchParams: PageSearchParams };

export default async function PackagingPage({ searchParams }: PackagingPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search) ?? "";
  const activeState = firstParam(params.activeState) ?? "active";
  const client = await createClient();
  const [{ data, error }, { data: pricingSetting }] = await Promise.all([
    listPr2Packaging(client, { activeState: activeState as "active" | "inactive" | "all", search }),
    getPr2Setting(client, "pricing_defaults"),
  ]);
  if (error) throw new Error(error.message);
  const defaults = parsePricingDefaults(pricingSetting?.value);
  const packaging = (data ?? []) as unknown as PackagingRow[];

  return (
    <div className="space-y-5">
      <PageHeader actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/packaging/new">New packaging</Link>} title="Packaging" />
      <form>
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search packaging" />
          <ShowInactiveToggle defaultChecked={activeState === "all"} />
          <Button type="submit" variant="secondary">Apply</Button>
        </FilterBar>
      </form>
      {packaging.length ? (
        <DataTable columns={["Image", "Packaging", "Suggested price", "State", "Actions"]}>
          {packaging.map((item) => {
            const packagingCost = buildPackagingPrice(item, item.materials);
            const suggested = calculateSuggestedPrice({
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
              <tr key={item.id}>
                <td className="px-4 py-3"><div className="size-12 overflow-hidden rounded-md border border-border bg-zinc-50"><ImageThumb imageUrl={item.image_url} /></div></td>
                <td className="px-4 py-3 font-medium"><Link className="hover:text-accent" href={`/packaging/${item.id}`}>{item.name}</Link></td>
                <td className="px-4 py-3 text-muted">{formatCurrency(suggested.finalPrice)}</td>
                <td className="px-4 py-3"><ActiveStateBadge active={item.active} /></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2">
                  <Link className="text-sm font-medium text-accent hover:underline" href={`/packaging/${item.id}`}>View</Link>
                  <ActiveStateForm action={setPackagingActiveStateAction} active={item.active} id={item.id} />
                </div></td>
              </tr>
            );
          })}
        </DataTable>
      ) : <EmptyState title="No packaging found" />}
    </div>
  );
}
