import Link from "next/link";

import { setQuoteActiveStateAction } from "@/app/(app)/quotes/actions";
import { ActiveStateForm } from "@/components/forms/active-state-form";
import { CustomerSelector } from "@/components/quotes/customer-selector";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { SearchInput } from "@/components/tables/search-input";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatting/currency";
import { firstParam, type PageSearchParams } from "@/lib/routing/search-params";
import { listActivePr2Customers } from "@/lib/supabase/queries/customers";
import { listPr2Quotes } from "@/lib/supabase/queries/quotes";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Customer, Pr2Quote } from "@/types/database";

type QuoteRow = Pr2Quote & { customer: Pr2Customer | null };
type QuotesPageProps = { searchParams: PageSearchParams };

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search) ?? "";
  const customerId = firstParam(params.customerId) ?? "";
  const status = firstParam(params.status) ?? "all";
  const activeState = firstParam(params.activeState) ?? "active";
  const dateFrom = firstParam(params.dateFrom) ?? "";
  const dateTo = firstParam(params.dateTo) ?? "";
  const client = await createClient();
  const [{ data, error }, { data: customers }] = await Promise.all([
    listPr2Quotes(client, {
      activeState: activeState as "active" | "inactive" | "all",
      customerId,
      dateFrom,
      dateTo,
      search,
      status: status as "draft" | "approved" | "cancelled" | "all",
    }),
    listActivePr2Customers(client),
  ]);
  if (error) throw new Error(error.message);
  const quotes = (data ?? []) as unknown as QuoteRow[];

  return (
    <div className="space-y-5">
      <PageHeader actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/quotes/new">New quote</Link>} title="Quotes" />
      <form>
        <FilterBar>
          <SearchInput defaultValue={search} placeholder="Search quote #" />
          <CustomerSelector customers={customers ?? []} defaultValue={customerId} />
          <Select defaultValue={status} name="status">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select defaultValue={activeState} name="activeState">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </Select>
          <Button type="submit" variant="secondary">Apply</Button>
          <input defaultValue={dateFrom} name="dateFrom" type="date" />
          <input defaultValue={dateTo} name="dateTo" type="date" />
        </FilterBar>
      </form>
      {quotes.length ? (
        <DataTable columns={["Quote #", "Customer", "Status", "Total", "Created", "Active", "Actions"]}>
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td className="px-4 py-3 font-medium"><Link className="hover:text-accent" href={`/quotes/${quote.id}`}>{quote.quote_number}</Link></td>
              <td className="px-4 py-3 text-muted">{quote.customer?.name ?? "-"}</td>
              <td className="px-4 py-3"><QuoteStatusBadge status={quote.status} /></td>
              <td className="px-4 py-3 text-muted">{formatCurrency(quote.total)}</td>
              <td className="px-4 py-3 text-muted">{new Date(quote.created_at).toLocaleDateString("en-CA")}</td>
              <td className="px-4 py-3"><ActiveStateBadge active={quote.active} /></td>
              <td className="flex gap-2 px-4 py-3">
                <Link className="text-sm font-medium text-accent hover:underline" href={`/quotes/${quote.id}`}>View</Link>
                <ActiveStateForm action={setQuoteActiveStateAction} active={quote.active} id={quote.id} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : <EmptyState title="No quotes found" />}
    </div>
  );
}
