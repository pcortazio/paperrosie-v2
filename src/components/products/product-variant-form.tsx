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
    <form action={action} className="grid gap-3 rounded-xl border border-border/90 bg-zinc-50/70 p-3 sm:grid-cols-2">
      <label className="space-y-1.5">
        <span>Name</span>
        <Input defaultValue={variant?.name} name="name" placeholder="Variant name" required />
      </label>
      <label className="space-y-1.5">
        <span>SKU</span>
        <Input defaultValue={variant?.sku ?? ""} name="sku" placeholder="SKU" />
      </label>
      <label className="space-y-1.5">
        <span>Image URL</span>
        <Input defaultValue={variant?.image_url ?? ""} name="image_url" placeholder="Image URL" />
      </label>
      <label className="space-y-1.5">
        <span>Margin override</span>
        <Input defaultValue={variant?.margin_percent ?? ""} min="0" name="margin_percent" placeholder="Margin %" step="0.01" type="number" />
      </label>
      <label className="space-y-1.5">
        <span>Labor override</span>
        <Input defaultValue={variant?.labor_cost_fixed ?? ""} min="0" name="labor_cost_fixed" placeholder="Labor" step="0.01" type="number" />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span>Description</span>
        <Textarea defaultValue={variant?.description ?? ""} name="description" placeholder="Description" />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>{variant ? "Save variant" : "Add variant"}</SubmitButton>
      </div>
    </form>
  );
}
