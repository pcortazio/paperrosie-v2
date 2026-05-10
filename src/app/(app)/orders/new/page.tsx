import { createOrderAction } from "@/app/(app)/orders/actions";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/ui/page-header";
import { listActivePr2Customers } from "@/lib/supabase/queries/customers";
import { createClient } from "@/lib/supabase/server";

export default async function NewOrderPage() {
  const client = await createClient();
  const { data: customers } = await listActivePr2Customers(client);
  return (
    <div className="space-y-5">
      <PageHeader title="New order" />
      <OrderForm action={createOrderAction} customers={customers ?? []} />
    </div>
  );
}
