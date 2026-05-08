import { notFound } from "next/navigation";

import { updateSupplierAction } from "@/app/(app)/suppliers/actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { getPr2Supplier } from "@/lib/supabase/queries/lookups";

type EditSupplierPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const { id } = await params;
  const client = await createClient();
  const { data: supplier, error } = await getPr2Supplier(client, id);

  if (error || !supplier) {
    notFound();
  }

  const action = updateSupplierAction.bind(null, supplier.id);

  return (
    <div className="space-y-5">
      <PageHeader actions={<ActiveStateBadge active={supplier.active} />} title="Edit supplier" />
      <SupplierForm action={action} supplier={supplier} />
    </div>
  );
}
