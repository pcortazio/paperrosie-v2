import Link from "next/link";
import { notFound } from "next/navigation";

import { addQuoteItemAction, setQuoteItemActiveStateAction } from "@/app/(app)/quotes/actions";
import { PdfLanguageSelector } from "@/components/quotes/pdf-language-selector";
import { PricingSnapshotViewer } from "@/components/quotes/pricing-snapshot-viewer";
import { QuoteItemEditor } from "@/components/quotes/quote-item-editor";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { QuoteTotalsCard } from "@/components/quotes/quote-totals-card";
import { DataTable } from "@/components/tables/data-table";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { WarningCallout } from "@/components/ui/warning-callout";
import { formatCurrency } from "@/lib/formatting/currency";
import { listActivePr2Packaging } from "@/lib/supabase/queries/packaging";
import { listActivePr2ProductsForQuotes } from "@/lib/supabase/queries/products";
import { getPr2Quote } from "@/lib/supabase/queries/quotes";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Customer, Pr2Packaging, Pr2Product, Pr2ProductVariant, Pr2Quote, Pr2QuoteItem } from "@/types/database";

type QuoteDetailRow = Pr2Quote & {
  customer: Pr2Customer | null;
  items: Array<Pr2QuoteItem & {
    packaging: Pr2Packaging | null;
    product: Pr2Product | null;
    variant: Pr2ProductVariant | null;
  }>;
};

type QuoteDetailPageProps = { params: Promise<{ id: string }> };

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data, error }, { data: products }, { data: packaging }] = await Promise.all([
    getPr2Quote(client, id),
    listActivePr2ProductsForQuotes(client),
    listActivePr2Packaging(client),
  ]);
  if (error || !data) notFound();
  const quote = data as unknown as QuoteDetailRow;

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <PdfLanguageSelector quoteId={quote.id} />
            <Link className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={`/quotes/${quote.id}/edit`}>Edit</Link>
          </div>
        }
        title={quote.quote_number}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div><p className="text-muted">Customer</p><p>{quote.customer?.name ?? "-"}</p></div>
            <div><p className="text-muted">Status</p><QuoteStatusBadge status={quote.status} /></div>
            <div><p className="text-muted">Language</p><p>{quote.language_preference}</p></div>
            <div><p className="text-muted">Email</p><p>{quote.customer?.email ?? "-"}</p></div>
            <div><p className="text-muted">Phone</p><p>{quote.customer?.phone ?? "-"}</p></div>
            <div><p className="text-muted">Company</p><p>{quote.customer?.company ?? "-"}</p></div>
          </div>
        </Card>
        <QuoteTotalsCard discount={quote.discount} subtotal={quote.subtotal} total={quote.total} />
      </div>
      {quote.status === "cancelled" ? <WarningCallout>This quote is cancelled and remains visible for history.</WarningCallout> : null}
      <QuoteItemEditor action={addQuoteItemAction.bind(null, quote.id)} packaging={packaging ?? []} products={(products ?? []) as unknown as Array<Pr2Product & { variants: Pr2ProductVariant[] }>} />
      <DataTable columns={["Product", "Variant", "Packaging", "Qty", "Unit", "Total", "Active", "Action"]}>
        {quote.items.map((item) => {
          const inactive = !item.product?.active || (item.variant && !item.variant.active) || (item.packaging && !item.packaging.active);
          return (
            <tr key={item.id} className="align-top">
              <td className="px-4 py-3">{item.product?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.variant?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.packaging?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.quantity}</td>
              <td className="px-4 py-3">{formatCurrency(item.unit_price)}</td>
              <td className="px-4 py-3">{formatCurrency(item.total_price)}</td>
              <td className="px-4 py-3"><ActiveStateBadge active={item.active && !inactive} /></td>
              <td className="px-4 py-3">
                <form action={setQuoteItemActiveStateAction}>
                  <input name="id" type="hidden" value={item.id} />
                  <input name="quote_id" type="hidden" value={quote.id} />
                  <input name="active" type="hidden" value={item.active ? "false" : "true"} />
                  <button className="text-sm font-medium text-accent" type="submit">{item.active ? "Deactivate" : "Reactivate"}</button>
                </form>
                {inactive ? <p className="mt-2 text-xs text-amber-700">Inactive reference</p> : null}
              </td>
            </tr>
          );
        })}
      </DataTable>
      <Card>
        <h2 className="mb-3 text-base font-medium">Notes</h2>
        <p className="whitespace-pre-wrap text-sm text-muted">{quote.notes || "-"}</p>
      </Card>
      {quote.items[0] ? <PricingSnapshotViewer snapshot={quote.items[0].pricing_snapshot} /> : null}
      <button className="h-10 cursor-not-allowed rounded-md border border-border bg-zinc-50 px-4 text-sm text-muted" disabled type="button">
        Create order from quote - next phase
      </button>
    </div>
  );
}
