import { createQuoteAction } from "@/app/(app)/quotes/actions";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeader } from "@/components/ui/page-header";
import { listActivePr2Customers } from "@/lib/supabase/queries/customers";
import { createClient } from "@/lib/supabase/server";

export default async function NewQuotePage() {
  const client = await createClient();
  const { data: customers } = await listActivePr2Customers(client);
  return (
    <div className="space-y-5">
      <PageHeader title="New quote" />
      <QuoteForm action={createQuoteAction} customers={customers ?? []} />
    </div>
  );
}
