import Link from "next/link";

import { ActiveStateForm } from "@/components/forms/active-state-form";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import { createClient } from "@/lib/supabase/server";
import { listPr2SuppliersFiltered } from "@/lib/supabase/queries/suppliers";
import { setSupplierActiveStateAction } from "@/app/(app)/suppliers/actions";

type SuppliersPageProps = {
  searchParams: PageSearchParams;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search) ?? "";
  const activeState = firstParam(params.activeState) ?? "active";
  const client = await createClient();
  const { data: suppliers, error } = await listPr2SuppliersFiltered(client, {
    activeState: activeState as "active" | "inactive" | "all",
    search,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#dc4f7c]"
            href="/suppliers/new"
          >
            New supplier
          </Link>
        }
        title="Suppliers"
      />
      <form className="space-y-3">
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search suppliers" />
          <Select defaultValue={activeState} name="activeState">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </Select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </FilterBar>
      </form>
      {suppliers && suppliers.length > 0 ? (
        <DataTable columns={["Name", "Website", "Status", "Actions"]}>
          {suppliers.map((supplier) => (
            <tr className="align-top" key={supplier.id}>
              <td className="px-4 py-3 font-medium text-foreground">{supplier.name}</td>
              <td className="px-4 py-3 text-muted">
                {supplier.website ? (
                  <a className="text-accent hover:underline" href={supplier.website}>
                    {supplier.website}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                <ActiveStateBadge active={supplier.active} />
              </td>
              <td className="flex gap-2 px-4 py-3">
                <Link className="text-sm font-medium text-accent hover:underline" href={`/suppliers/${supplier.id}/edit`}>
                  Edit
                </Link>
                <ActiveStateForm
                  action={setSupplierActiveStateAction}
                  active={supplier.active}
                  id={supplier.id}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No suppliers found" />
      )}
    </div>
  );
}
