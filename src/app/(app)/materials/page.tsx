import Link from "next/link";

import { ActiveStateForm } from "@/components/forms/active-state-form";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ShowInactiveToggle } from "@/components/tables/show-inactive-toggle";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StockIndicator } from "@/components/ui/stock-indicator";
import { setMaterialActiveStateAction } from "@/app/(app)/materials/actions";
import { formatCurrency, formatQuantity } from "@/lib/formatting/currency";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import {
  listPr2MaterialCategories,
  listPr2Suppliers,
} from "@/lib/supabase/queries/lookups";
import { listPr2Materials } from "@/lib/supabase/queries/materials";
import { createClient } from "@/lib/supabase/server";
import type {
  Pr2Material,
  Pr2MaterialCategory,
  Pr2Supplier,
  Pr2Unit,
} from "@/types/database";

type MaterialListRow = Pr2Material & {
  category: Pr2MaterialCategory | null;
  preferred_supplier: Pr2Supplier | null;
  unit: Pr2Unit | null;
};

type MaterialsPageProps = {
  searchParams: PageSearchParams;
};

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search) ?? "";
  const activeState = firstParam(params.activeState) ?? "active";
  const categoryId = firstParam(params.categoryId) ?? "";
  const supplierId = firstParam(params.supplierId) ?? "";
  const stockStatus = firstParam(params.stockStatus) ?? "all";
  const client = await createClient();

  const [{ data, error }, { data: categories }, { data: suppliers }] = await Promise.all([
    listPr2Materials(client, {
      activeState: activeState as "active" | "inactive" | "all",
      categoryId: categoryId || undefined,
      search,
      supplierId: supplierId || undefined,
    }),
    listPr2MaterialCategories(client),
    listPr2Suppliers(client),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const materials = ((data ?? []) as unknown as MaterialListRow[]).filter((material) => {
    const lowStock = material.current_stock <= material.minimum_stock;

    if (stockStatus === "low") return lowStock;
    if (stockStatus === "in_stock") return !lowStock;
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#dc4f7c]"
            href="/materials/new"
          >
            New material
          </Link>
        }
        title="Materials"
      />
      <form className="space-y-3">
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search materials" />
          <Select defaultValue={categoryId} name="categoryId">
            <option value="">All categories</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={supplierId} name="supplierId">
            <option value="">All suppliers</option>
            {(suppliers ?? []).map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={stockStatus} name="stockStatus">
            <option value="all">All stock</option>
            <option value="low">Low stock</option>
            <option value="in_stock">In stock</option>
          </Select>
          <ShowInactiveToggle defaultChecked={activeState === "all"} />
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </FilterBar>
      </form>
      {materials.length > 0 ? (
        <DataTable
          columns={[
            "Name",
            "Category",
            "Stock",
            "Unit",
            "Reference cost",
            "Preferred supplier",
            "State",
            "Actions",
          ]}
        >
          {materials.map((material) => {
            const lowStock = material.current_stock <= material.minimum_stock;

            return (
              <tr className="align-top" key={material.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link className="hover:text-accent" href={`/materials/${material.id}`}>
                    {material.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{material.category?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{formatQuantity(material.current_stock)}</span>
                    <StockIndicator low={lowStock} />
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{material.unit?.abbreviation ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {formatCurrency(material.reference_cost_per_unit)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {material.preferred_supplier?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <ActiveStateBadge active={material.active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                  <Link className="text-sm font-medium text-accent hover:underline" href={`/materials/${material.id}`}>
                    View
                  </Link>
                  <Link
                    className="text-sm font-medium text-accent hover:underline"
                    href={`/materials/${material.id}/edit`}
                  >
                    Edit
                  </Link>
                  <ActiveStateForm
                    action={setMaterialActiveStateAction}
                    active={material.active}
                    id={material.id}
                  />
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      ) : (
        <EmptyState title="No materials found" />
      )}
    </div>
  );
}
