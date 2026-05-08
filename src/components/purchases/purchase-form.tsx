import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2Purchase, Pr2Supplier } from "@/types/database";

type PurchaseFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  purchase?: Pr2Purchase;
  suppliers: Pr2Supplier[];
};

export function PurchaseForm({ action, purchase, suppliers }: PurchaseFormProps) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormSection title="Purchase">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            <span>Supplier</span>
            <Select defaultValue={purchase?.supplier_id ?? ""} name="supplier_id" required>
              <option value="" disabled>
                Select supplier
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                  {!supplier.active ? " (inactive)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Ordered date</span>
            <Input defaultValue={purchase?.ordered_at} name="ordered_at" required type="date" />
          </label>
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Notes</span>
            <Textarea defaultValue={purchase?.notes ?? ""} name="notes" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{purchase ? "Save purchase" : "Create purchase"}</SubmitButton>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-zinc-50"
          href={purchase ? `/purchases/${purchase.id}` : "/purchases"}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
