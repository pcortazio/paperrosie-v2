import { createInventoryCountAction } from "@/app/(app)/inventory/actions";
import { InventoryCountForm } from "@/components/inventory/inventory-count-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewInventoryCountPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="New inventory count" />
      <InventoryCountForm action={createInventoryCountAction} />
    </div>
  );
}
