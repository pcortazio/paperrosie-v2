import { PurchaseSuggestionCard } from "@/components/planning/purchase-suggestion-card";
import { ShoppingListGroup } from "@/components/planning/shopping-list-group";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ShowInactiveToggle } from "@/components/tables/show-inactive-toggle";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatQuantity } from "@/lib/formatting/currency";
import {
  calculateOrderMaterialRequirements,
  generateShoppingList,
  groupShoppingListBySupplier,
  type PlanningMaterial,
  type PlanningOrder,
  type PlanningPackagingMaterial,
  type PlanningProductMaterial,
  type ShoppingListItem,
} from "@/lib/planning/materials";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import { listPr2Suppliers } from "@/lib/supabase/queries/lookups";
import {
  listPr2PlanningMaterials,
  listPr2PlanningOrders,
  listPr2PlanningPackagingMaterials,
  listPr2PlanningProductMaterials,
} from "@/lib/supabase/queries/planning";
import { createClient } from "@/lib/supabase/server";

type ShoppingListPageProps = {
  searchParams: PageSearchParams;
};

type SourceFilter = "all" | "low" | "orders";
type ActiveFilter = "active" | "inactive" | "all";

export default async function ShoppingListPage({ searchParams }: ShoppingListPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search)?.toLowerCase() ?? "";
  const supplierId = firstParam(params.supplierId) ?? "";
  const source = (firstParam(params.source) ?? "all") as SourceFilter;
  const activeState = (firstParam(params.activeState) ?? "active") as ActiveFilter;
  const client = await createClient();

  const [{ data: materialsData, error: materialsError }, { data: ordersData }, { data: suppliers }] =
    await Promise.all([
      listPr2PlanningMaterials(client, "all"),
      listPr2PlanningOrders(client),
      listPr2Suppliers(client),
    ]);

  if (materialsError) {
    throw new Error(materialsError.message);
  }

  const orders = (ordersData ?? []) as unknown as PlanningOrder[];
  const productIds = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.product_id))));
  const packagingIds = Array.from(
    new Set(orders.flatMap((order) => order.items.map((item) => item.packaging_id).filter(Boolean))),
  ) as string[];
  const [{ data: productMaterialsData }, { data: packagingMaterialsData }] = await Promise.all([
    listPr2PlanningProductMaterials(client, productIds),
    listPr2PlanningPackagingMaterials(client, packagingIds),
  ]);
  const materials = (materialsData ?? []) as unknown as PlanningMaterial[];
  const productMaterials = (productMaterialsData ?? []) as unknown as PlanningProductMaterial[];
  const packagingMaterials = (packagingMaterialsData ?? []) as unknown as PlanningPackagingMaterial[];
  const orderRequirements = generateOrderRequirements(orders, productMaterials, packagingMaterials);
  const shoppingList = generateShoppingList({ materials, orderRequirements });
  const filteredItems = filterShoppingList(shoppingList, {
    activeState,
    search,
    source,
    supplierId,
  });
  const groups = groupShoppingListBySupplier(filteredItems);
  const orderBlockedIds = new Set(
    filteredItems
      .filter((item) => item.orderRequiredQuantity > item.currentStock)
      .flatMap((item) => item.orderIds),
  );
  const suppliersInvolved = new Set(filteredItems.map((item) => item.preferredSupplier?.id ?? "unassigned"));
  const totalShortageQuantity = filteredItems.reduce((sum, item) => sum + item.shortageQuantity, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Shopping List" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PurchaseSuggestionCard label="Materials needing purchase" value={filteredItems.length} />
        <PurchaseSuggestionCard label="Suppliers involved" value={suppliersInvolved.size} />
        <PurchaseSuggestionCard label="Orders blocked" value={orderBlockedIds.size} />
        <PurchaseSuggestionCard label="Estimated missing qty" value={formatQuantity(totalShortageQuantity)} />
      </div>
      <form>
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search materials" />
          <Select defaultValue={supplierId} name="supplierId">
            <option value="">All suppliers</option>
            <option value="unassigned">Unassigned Supplier</option>
            {(suppliers ?? []).map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={source} name="source">
            <option value="all">All reasons</option>
            <option value="low">Low stock only</option>
            <option value="orders">Orders only</option>
          </Select>
          <ShowInactiveToggle defaultChecked={activeState === "all"} />
          <Button type="submit" variant="secondary">Apply</Button>
        </FilterBar>
      </form>
      {groups.length ? <ShoppingListGroup groups={groups} /> : <EmptyState title="No materials need purchase" />}
    </div>
  );
}

function generateOrderRequirements(
  orders: PlanningOrder[],
  productMaterials: PlanningProductMaterial[],
  packagingMaterials: PlanningPackagingMaterial[],
) {
  return calculateOrderMaterialRequirements({
    orders,
    packagingMaterials,
    productMaterials,
  });
}

function filterShoppingList(
  items: ShoppingListItem[],
  filters: {
    activeState: ActiveFilter;
    search: string;
    source: SourceFilter;
    supplierId: string;
  },
) {
  return items.filter((item) => {
    const matchesSearch =
      !filters.search ||
      item.material.name.toLowerCase().includes(filters.search) ||
      item.preferredSupplier?.name.toLowerCase().includes(filters.search);
    const matchesSupplier =
      !filters.supplierId ||
      (filters.supplierId === "unassigned"
        ? !item.preferredSupplier
        : item.preferredSupplier?.id === filters.supplierId);
    const matchesSource =
      filters.source === "all" ||
      (filters.source === "low" && item.reasons.includes("low_stock")) ||
      (filters.source === "orders" && item.reasons.includes("needed_for_orders"));
    const matchesActive =
      filters.activeState === "all" ||
      (filters.activeState === "active" && (item.material.active || item.inactiveRequired)) ||
      (filters.activeState === "inactive" && !item.material.active);

    return matchesSearch && matchesSupplier && matchesSource && matchesActive;
  });
}
