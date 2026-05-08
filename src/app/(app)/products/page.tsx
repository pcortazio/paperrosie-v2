import Link from "next/link";

import { ActiveStateForm } from "@/components/forms/active-state-form";
import { setProductActiveStateAction } from "@/app/(app)/products/actions";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageThumb } from "@/components/ui/image-thumb";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatting/currency";
import { buildProductPrice } from "@/lib/pricing/build";
import { parsePricingDefaults } from "@/lib/pricing/settings";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import { listPr2ProductCategories } from "@/lib/supabase/queries/lookups";
import { listPr2Products } from "@/lib/supabase/queries/products";
import { getPr2Setting } from "@/lib/supabase/queries/settings";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Material, Pr2Packaging, Pr2PackagingMaterial, Pr2Product, Pr2ProductCategory, Pr2ProductMaterial } from "@/types/database";

type ProductRow = Pr2Product & {
  category: Pr2ProductCategory | null;
  materials: Array<Pr2ProductMaterial & { material: Pr2Material | null }>;
  packaging: (Pr2Packaging & { materials?: Array<Pr2PackagingMaterial & { material: Pr2Material | null }> }) | null;
};

type ProductsPageProps = { searchParams: PageSearchParams };

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search) ?? "";
  const categoryId = firstParam(params.categoryId) ?? "";
  const activeState = firstParam(params.activeState) ?? "active";
  const client = await createClient();
  const [{ data, error }, { data: categories }, { data: pricingSetting }] = await Promise.all([
    listPr2Products(client, {
      activeState: activeState as "active" | "inactive" | "all",
      categoryId,
      search,
    }),
    listPr2ProductCategories(client),
    getPr2Setting(client, "pricing_defaults"),
  ]);
  if (error) throw new Error(error.message);
  const defaults = parsePricingDefaults(pricingSetting?.value);
  const products = (data ?? []) as unknown as ProductRow[];

  return (
    <div className="space-y-5">
      <PageHeader
        actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/products/new">New product</Link>}
        title="Products"
      />
      <form>
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search products" />
          <Select defaultValue={categoryId} name="categoryId">
            <option value="">All categories</option>
            {(categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select defaultValue={activeState} name="activeState">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </Select>
          <Button type="submit" variant="secondary">Apply</Button>
        </FilterBar>
      </form>
      {products.length ? (
        <DataTable columns={["Image", "Product", "Category", "Suggested price", "Active", "Actions"]}>
          {products.map((product) => {
            const price = buildProductPrice(product, product.materials, product.packaging, defaults);
            return (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <div className="size-12 overflow-hidden rounded-md border border-border bg-zinc-50">
                    <ImageThumb imageUrl={product.image_url} />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium"><Link className="hover:text-accent" href={`/products/${product.id}`}>{product.name}</Link></td>
                <td className="px-4 py-3 text-muted">{product.category?.name ?? "-"}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(price.finalPrice)}</td>
                <td className="px-4 py-3"><ActiveStateBadge active={product.active} /></td>
                <td className="flex gap-2 px-4 py-3">
                  <Link className="text-sm font-medium text-accent hover:underline" href={`/products/${product.id}`}>View</Link>
                  <ActiveStateForm action={setProductActiveStateAction} active={product.active} id={product.id} />
                </td>
              </tr>
            );
          })}
        </DataTable>
      ) : <EmptyState title="No products found" />}
    </div>
  );
}
