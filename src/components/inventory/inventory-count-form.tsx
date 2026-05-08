import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InventoryCountFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function InventoryCountForm({ action }: InventoryCountFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormSection title="Inventory session">
        <div className="grid gap-4">
          <label className="space-y-2 text-sm font-medium">
            <span>Count date</span>
            <Input defaultValue={today} name="counted_at" required type="date" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Notes</span>
            <Textarea name="notes" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>Create session</SubmitButton>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-zinc-50"
          href="/inventory"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
