import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2Customer } from "@/types/database";

type CustomerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  customer?: Pr2Customer;
};

export function CustomerForm({ action, customer }: CustomerFormProps) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormSection title="Customer">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            <span>Name</span>
            <Input defaultValue={customer?.name} name="name" required />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Company</span>
            <Input defaultValue={customer?.company ?? ""} name="company" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Email</span>
            <Input defaultValue={customer?.email ?? ""} name="email" type="email" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Phone</span>
            <Input defaultValue={customer?.phone ?? ""} name="phone" />
          </label>
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Notes</span>
            <Textarea defaultValue={customer?.notes ?? ""} name="notes" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{customer ? "Save customer" : "Create customer"}</SubmitButton>
        <Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href="/customers">Cancel</Link>
      </div>
    </form>
  );
}
