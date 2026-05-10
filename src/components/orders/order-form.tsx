import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2Customer, Pr2Order } from "@/types/database";

type OrderFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  customers: Pr2Customer[];
  order?: Pr2Order;
};

export function OrderForm({ action, customers, order }: OrderFormProps) {
  const completed = order?.status === "completed";

  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormSection title="Order">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            <span>Customer</span>
            <Select defaultValue={order?.customer_id ?? ""} disabled={completed} name="customer_id" required>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </Select>
            {completed ? <input name="customer_id" type="hidden" value={order.customer_id} /> : null}
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Status</span>
            <Select defaultValue={order?.status ?? "pending"} disabled={completed} name="status">
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            {completed ? <input name="status" type="hidden" value={order.status} /> : null}
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Discount CAD</span>
            <Input defaultValue={order?.discount ?? 0} disabled={completed} min="0" name="discount" step="0.01" type="number" />
            {completed ? <input name="discount" type="hidden" value={order.discount} /> : null}
          </label>
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Notes</span>
            <Textarea defaultValue={order?.notes ?? ""} name="notes" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{order ? "Save order" : "Create order"}</SubmitButton>
        <Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={order ? `/orders/${order.id}` : "/orders"}>Cancel</Link>
      </div>
    </form>
  );
}
