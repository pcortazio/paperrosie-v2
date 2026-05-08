import Link from "next/link";

import { ActiveStateForm } from "@/components/forms/active-state-form";
import { setPurchaseActiveStateAction } from "@/app/(app)/purchases/actions";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatting/currency";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import { listPr2Suppliers } from "@/lib/supabase/queries/lookups";
import { listPr2Purchases } from "@/lib/supabase/queries/purchases";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Purchase, Pr2PurchaseItem, Pr2Supplier } from "@/types/database";

type PurchaseRow = Pr2Purchase & {
  items: Pick<Pr2PurchaseItem, "total_cost">[];
  supplier: Pr2Supplier | null;
};

type PurchasesPageProps = {
  searchParams: PageSearchParams;
};

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
  const params = await searchParams;
  const client = await createClient();
  const search = firstParam(params.search) ?? "";
  const status = firstParam(params.status) ?? "all";
  const activeState = firstParam(params.activeState) ?? "active";
  const supplierId = firstParam(params.supplierId) ?? "";
  const orderedFrom = firstParam(params.orderedFrom) ?? "";
  const orderedTo = firstParam(params.orderedTo) ?? "";
  const receivedFrom = firstParam(params.receivedFrom) ?? "";
  const receivedTo = firstParam(params.receivedTo) ?? "";

  const [{ data, error }, { data: suppliers }] = await Promise.all([
    listPr2Purchases(client, {
      activeState: activeState as "active" | "inactive" | "all",
      orderedFrom,
      orderedTo,
      receivedFrom,
      receivedTo,
      search,
      status: status as "ordered" | "received" | "cancelled" | "all",
      supplierId,
    }),
    listPr2Suppliers(client),
  ]);

  if (error) throw new Error(error.message);

  const purchases = (data ?? []) as unknown as PurchaseRow[];

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/purchases/new">
            New purchase
          </Link>
        }
        title="Purchases"
      />
      <form>
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search purchase #" />
          <Select defaultValue={supplierId} name="supplierId">
            <option value="">All suppliers</option>
            {(suppliers ?? []).map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </Select>
          <Select defaultValue={status} name="status">
            <option value="all">All statuses</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select defaultValue={activeState} name="activeState">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </Select>
          <Button type="submit" variant="secondary">Apply</Button>
          <input defaultValue={orderedFrom} name="orderedFrom" type="date" />
          <input defaultValue={orderedTo} name="orderedTo" type="date" />
          <input defaultValue={receivedFrom} name="receivedFrom" type="date" />
          <input defaultValue={receivedTo} name="receivedTo" type="date" />
        </FilterBar>
      </form>
      {purchases.length ? (
        <DataTable columns={["Purchase #", "Supplier", "Ordered", "Received", "Status", "Total", "Active", "Actions"]}>
          {purchases.map((purchase) => {
            const total = purchase.items.reduce((sum, item) => sum + item.total_cost, 0);
            return (
              <tr key={purchase.id}>
                <td className="px-4 py-3 font-medium">
                  <Link className="hover:text-accent" href={`/purchases/${purchase.id}`}>{purchase.purchase_number}</Link>
                </td>
                <td className="px-4 py-3 text-muted">{purchase.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{purchase.ordered_at}</td>
                <td className="px-4 py-3 text-muted">{purchase.received_at ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge tone={purchase.status === "cancelled" ? "warning" : purchase.status === "received" ? "accent" : "neutral"}>{purchase.status}</StatusBadge></td>
                <td className="px-4 py-3 text-muted">{formatCurrency(total)}</td>
                <td className="px-4 py-3"><ActiveStateBadge active={purchase.active} /></td>
                <td className="flex gap-2 px-4 py-3">
                  <Link className="text-sm font-medium text-accent hover:underline" href={`/purchases/${purchase.id}`}>View</Link>
                  <ActiveStateForm action={setPurchaseActiveStateAction} active={purchase.active} id={purchase.id} />
                </td>
              </tr>
            );
          })}
        </DataTable>
      ) : (
        <EmptyState title="No purchases found" />
      )}
    </div>
  );
}
