import { notFound } from "next/navigation";

import { updatePurchaseItemAction } from "@/app/(app)/purchases/actions";
import { PurchaseItemForm } from "@/components/purchases/purchase-item-form";
import { PageHeader } from "@/components/ui/page-header";
import { WarningCallout } from "@/components/ui/warning-callout";
import { getPr2Purchase, getPr2PurchaseItem } from "@/lib/supabase/queries/purchases";
import { listActivePr2Materials } from "@/lib/supabase/queries/materials";
import { listPr2Units } from "@/lib/supabase/queries/lookups";
import { createClient } from "@/lib/supabase/server";

type EditPurchaseItemPageProps = {
  params: Promise<{ id: string; itemId: string }>;
};

export default async function EditPurchaseItemPage({ params }: EditPurchaseItemPageProps) {
  const { id, itemId } = await params;
  const client = await createClient();
  const [{ data: purchase }, { data: item, error }, { data: materials }, { data: units }] =
    await Promise.all([
      getPr2Purchase(client, id),
      getPr2PurchaseItem(client, itemId),
      listActivePr2Materials(client),
      listPr2Units(client),
    ]);

  if (error || !item || !purchase) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title="Edit purchase item" />
      {purchase.status === "received" ? (
        <WarningCallout>
          Saving this item will reverse and reapply received stock movements for this purchase.
        </WarningCallout>
      ) : null}
      <PurchaseItemForm
        action={updatePurchaseItemAction.bind(null, id, item.id)}
        item={item}
        materials={materials ?? []}
        units={units ?? []}
      />
    </div>
  );
}
