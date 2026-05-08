import { createPurchaseAction } from "@/app/(app)/purchases/actions";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { PageHeader } from "@/components/ui/page-header";
import { listActivePr2Suppliers } from "@/lib/supabase/queries/lookups";
import { createClient } from "@/lib/supabase/server";

export default async function NewPurchasePage() {
  const client = await createClient();
  const { data: suppliers } = await listActivePr2Suppliers(client);

  return (
    <div className="space-y-5">
      <PageHeader title="New purchase" />
      <PurchaseForm action={createPurchaseAction} suppliers={suppliers ?? []} />
    </div>
  );
}
