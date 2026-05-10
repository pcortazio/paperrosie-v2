import { notFound } from "next/navigation";

import { updateQuoteAction } from "@/app/(app)/quotes/actions";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeader } from "@/components/ui/page-header";
import { listActivePr2Customers } from "@/lib/supabase/queries/customers";
import { getPr2Quote } from "@/lib/supabase/queries/quotes";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Quote } from "@/types/database";

type EditQuotePageProps = { params: Promise<{ id: string }> };

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data: quote, error }, { data: customers }] = await Promise.all([
    getPr2Quote(client, id),
    listActivePr2Customers(client),
  ]);
  if (error || !quote) notFound();
  return (
    <div className="space-y-5">
      <PageHeader title="Edit quote" />
      <QuoteForm action={updateQuoteAction.bind(null, id)} customers={customers ?? []} quote={quote as unknown as Pr2Quote} />
    </div>
  );
}
