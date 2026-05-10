import { notFound } from "next/navigation";

import { updateCustomerAction } from "@/app/(app)/customers/actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/ui/page-header";
import { getPr2Customer } from "@/lib/supabase/queries/customers";
import { createClient } from "@/lib/supabase/server";

type EditCustomerPageProps = { params: Promise<{ id: string }> };

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const client = await createClient();
  const { data, error } = await getPr2Customer(client, id);
  if (error || !data) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title="Edit customer" />
      <CustomerForm action={updateCustomerAction.bind(null, id)} customer={data} />
    </div>
  );
}
