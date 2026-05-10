import Link from "next/link";

import { setCustomerActiveStateAction } from "@/app/(app)/customers/actions";
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
import { listPr2Customers } from "@/lib/supabase/queries/customers";
import { createClient } from "@/lib/supabase/server";

type CustomersPageProps = { searchParams: PageSearchParams };

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search) ?? "";
  const activeState = firstParam(params.activeState) ?? "active";
  const client = await createClient();
  const { data, error } = await listPr2Customers(client, {
    activeState: activeState as "active" | "inactive" | "all",
    search,
  });
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-5">
      <PageHeader actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/customers/new">New customer</Link>} title="Customers" />
      <form>
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search customers" />
          <Select defaultValue={activeState} name="activeState">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </Select>
          <Button type="submit" variant="secondary">Apply</Button>
        </FilterBar>
      </form>
      {data?.length ? (
        <DataTable columns={["Name", "Company", "Email", "Phone", "Active", "Actions"]}>
          {data.map((customer) => (
            <tr key={customer.id}>
              <td className="px-4 py-3 font-medium">{customer.name}</td>
              <td className="px-4 py-3 text-muted">{customer.company ?? "-"}</td>
              <td className="px-4 py-3 text-muted">{customer.email ?? "-"}</td>
              <td className="px-4 py-3 text-muted">{customer.phone ?? "-"}</td>
              <td className="px-4 py-3"><ActiveStateBadge active={customer.active} /></td>
              <td className="flex gap-2 px-4 py-3">
                <Link className="text-sm font-medium text-accent hover:underline" href={`/customers/${customer.id}/edit`}>Edit</Link>
                <ActiveStateForm action={setCustomerActiveStateAction} active={customer.active} id={customer.id} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : <EmptyState title="No customers found" />}
    </div>
  );
}
