import { SupplierForm } from "@/components/suppliers/supplier-form";
import { PageHeader } from "@/components/ui/page-header";
import { createSupplierAction } from "@/app/(app)/suppliers/actions";

export default function NewSupplierPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="New supplier" />
      <SupplierForm action={createSupplierAction} />
    </div>
  );
}
