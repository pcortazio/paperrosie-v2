import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2Packaging } from "@/types/database";

type PackagingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  packaging?: Pr2Packaging;
};

export function PackagingForm({ action, packaging }: PackagingFormProps) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormSection title="Packaging">
        <div className="grid gap-4">
          <label className="space-y-2 text-sm font-medium">
            <span>Name</span>
            <Input defaultValue={packaging?.name} name="name" required />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Image URL</span>
            <Input defaultValue={packaging?.image_url ?? ""} name="image_url" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Margin %</span>
            <Input defaultValue={packaging?.margin_percent ?? 40} min="0" name="margin_percent" step="0.01" type="number" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Description</span>
            <Textarea defaultValue={packaging?.description ?? ""} name="description" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{packaging ? "Save packaging" : "Create packaging"}</SubmitButton>
        <Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={packaging ? `/packaging/${packaging.id}` : "/packaging"}>Cancel</Link>
      </div>
    </form>
  );
}
