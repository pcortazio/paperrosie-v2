import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2ProductVariant } from "@/types/database";

type ProductVariantFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  variant?: Pr2ProductVariant;
};

export function ProductVariantForm({ action, variant }: ProductVariantFormProps) {
  return (
    <form action={action} className="grid gap-3 rounded-md border border-border bg-zinc-50 p-3 sm:grid-cols-2">
      <Input defaultValue={variant?.name} name="name" placeholder="Variant name" required />
      <Input defaultValue={variant?.sku ?? ""} name="sku" placeholder="SKU" />
      <Input defaultValue={variant?.image_url ?? ""} name="image_url" placeholder="Image URL" />
      <Input defaultValue={variant?.margin_percent ?? ""} min="0" name="margin_percent" placeholder="Margin override %" step="0.01" type="number" />
      <Input defaultValue={variant?.labor_cost_fixed ?? ""} min="0" name="labor_cost_fixed" placeholder="Labor override" step="0.01" type="number" />
      <Textarea className="sm:col-span-2" defaultValue={variant?.description ?? ""} name="description" placeholder="Description" />
      <div className="sm:col-span-2">
        <SubmitButton>{variant ? "Save variant" : "Add variant"}</SubmitButton>
      </div>
    </form>
  );
}
