import Link from "next/link";

import { setOrderActiveStateAction } from "@/app/(app)/orders/actions";
import { ActiveStateForm } from "@/components/forms/active-state-form";
import { CustomerSelector } from "@/components/quotes/customer-selector";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ShowInactiveToggle } from "@/components/tables/show-inactive-toggle";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatting/currency";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import { listActivePr2Customers } from "@/lib/supabase/queries/customers";
import { listPr2Orders } from "@/lib/supabase/queries/orders";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Customer, Pr2Order, Pr2Quote } from "@/types/database";

type OrderRow = Pr2Order & { customer: Pr2Customer | null; quote: Pr2Quote | null };
type OrdersPageProps = { searchParams: PageSearchParams };

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search) ?? "";
  const customerId = firstParam(params.customerId) ?? "";
  const status = firstParam(params.status) ?? "all";
  const activeState = firstParam(params.activeState) ?? "active";
  const dateFrom = firstParam(params.dateFrom) ?? "";
  const dateTo = firstParam(params.dateTo) ?? "";
  const client = await createClient();
  const [{ data, error }, { data: customers }] = await Promise.all([
    listPr2Orders(client, {
      activeState: activeState as "active" | "inactive" | "all",
      customerId,
      dateFrom,
      dateTo,
      search,
      status: status as "pending" | "in_progress" | "completed" | "cancelled" | "all",
    }),
    listActivePr2Customers(client),
  ]);
  if (error) throw new Error(error.message);
  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <div className="space-y-5">
      <PageHeader actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/orders/new">New order</Link>} title="Orders" />
      <form>
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search order #" />
          <CustomerSelector customers={customers ?? []} defaultValue={customerId} />
          <Select defaultValue={status} name="status">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <ShowInactiveToggle defaultChecked={activeState === "all"} />
          <Button type="submit" variant="secondary">Apply</Button>
          <input defaultValue={dateFrom} name="dateFrom" type="date" />
          <input defaultValue={dateTo} name="dateTo" type="date" />
        </FilterBar>
      </form>
      {orders.length ? (
        <DataTable columns={["Order #", "Customer", "Source quote", "Status", "Total", "Created", "State", "Actions"]}>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-medium"><Link className="hover:text-accent" href={`/orders/${order.id}`}>{order.order_number}</Link></td>
              <td className="px-4 py-3 text-muted">{order.customer?.name ?? "-"}</td>
              <td className="px-4 py-3 text-muted">{order.quote?.quote_number ?? "-"}</td>
              <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
              <td className="px-4 py-3 text-muted">{formatCurrency(order.total)}</td>
              <td className="px-4 py-3 text-muted">{new Date(order.created_at).toLocaleDateString("en-CA")}</td>
              <td className="px-4 py-3"><ActiveStateBadge active={order.active} /></td>
              <td className="px-4 py-3"><div className="flex items-center gap-2">
                <Link className="text-sm font-medium text-accent hover:underline" href={`/orders/${order.id}`}>View</Link>
                <ActiveStateForm action={setOrderActiveStateAction} active={order.active} id={order.id} />
              </div></td>
            </tr>
          ))}
        </DataTable>
      ) : <EmptyState title="No orders found" />}
    </div>
  );
}
