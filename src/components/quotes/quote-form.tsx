import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2Customer, Pr2Quote } from "@/types/database";

type QuoteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  customers: Pr2Customer[];
  quote?: Pr2Quote;
};

export function QuoteForm({ action, customers, quote }: QuoteFormProps) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormSection title="Quote">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            <span>Customer</span>
            <Select defaultValue={quote?.customer_id ?? ""} name="customer_id" required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Language</span>
            <Select defaultValue={quote?.language_preference ?? "en"} name="language_preference">
              <option value="en">English</option>
              <option value="pt">Portuguese</option>
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Status</span>
            <Select defaultValue={quote?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Discount CAD</span>
            <Input defaultValue={quote?.discount ?? 0} min="0" name="discount" step="0.01" type="number" />
          </label>
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Notes</span>
            <Textarea defaultValue={quote?.notes ?? ""} name="notes" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{quote ? "Save quote" : "Create quote"}</SubmitButton>
        <Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={quote ? `/quotes/${quote.id}` : "/quotes"}>Cancel</Link>
      </div>
    </form>
  );
}
