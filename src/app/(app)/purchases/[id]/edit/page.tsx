import { notFound } from "next/navigation";

import { updatePurchaseAction } from "@/app/(app)/purchases/actions";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { PageHeader } from "@/components/ui/page-header";
import { WarningCallout } from "@/components/ui/warning-callout";
import { listPr2Suppliers } from "@/lib/supabase/queries/lookups";
import { getPr2Purchase } from "@/lib/supabase/queries/purchases";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Purchase } from "@/types/database";

type EditPurchasePageProps = { params: Promise<{ id: string }> };

export default async function EditPurchasePage({ params }: EditPurchasePageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data: purchase, error }, { data: suppliers }] = await Promise.all([
    getPr2Purchase(client, id),
    listPr2Suppliers(client),
  ]);

  if (error || !purchase) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title={`Edit ${purchase.purchase_number}`} />
      {purchase.status === "received" ? (
        <WarningCallout>
          Editing a received purchase can affect stock and reference costs. Item edits require explicit save and trigger recalculation.
        </WarningCallout>
      ) : null}
      <PurchaseForm
        action={updatePurchaseAction.bind(null, purchase.id)}
        purchase={purchase as unknown as Pr2Purchase}
        suppliers={suppliers ?? []}
      />
    </div>
  );
}
