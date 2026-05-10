import { notFound } from "next/navigation";

import { updateOrderAction } from "@/app/(app)/orders/actions";
import { CompletedOrderWarning } from "@/components/orders/completed-order-warning";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/ui/page-header";
import { listActivePr2Customers } from "@/lib/supabase/queries/customers";
import { getPr2Order } from "@/lib/supabase/queries/orders";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Order } from "@/types/database";

type EditOrderPageProps = { params: Promise<{ id: string }> };

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data: order, error }, { data: customers }] = await Promise.all([
    getPr2Order(client, id),
    listActivePr2Customers(client),
  ]);
  if (error || !order) notFound();
  return (
    <div className="space-y-5">
      <PageHeader title="Edit order" />
      {order.status === "completed" ? <CompletedOrderWarning /> : null}
      <OrderForm action={updateOrderAction.bind(null, id)} customers={customers ?? []} order={order as unknown as Pr2Order} />
    </div>
  );
}
