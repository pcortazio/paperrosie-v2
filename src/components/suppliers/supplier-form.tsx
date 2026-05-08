import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2Supplier } from "@/types/database";

type SupplierFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  supplier?: Pr2Supplier;
};

export function SupplierForm({ action, supplier }: SupplierFormProps) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormSection title="Supplier">
        <div className="grid gap-4">
          <label className="space-y-2 text-sm font-medium">
            <span>Name</span>
            <Input defaultValue={supplier?.name} name="name" required />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Website</span>
            <Input defaultValue={supplier?.website ?? ""} name="website" type="url" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Notes</span>
            <Textarea defaultValue={supplier?.notes ?? ""} name="notes" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{supplier ? "Save supplier" : "Create supplier"}</SubmitButton>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-zinc-50"
          href="/suppliers"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
