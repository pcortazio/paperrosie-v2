import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Pr2Packaging, Pr2Product, Pr2ProductCategory } from "@/types/database";

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Pr2ProductCategory[];
  packaging: Pr2Packaging[];
  product?: Pr2Product;
};

export function ProductForm({ action, categories, packaging, product }: ProductFormProps) {
  return (
    <form action={action} className="max-w-3xl space-y-5">
      <FormSection title="Product">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Name</span>
            <Input defaultValue={product?.name} name="name" required />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Category</span>
            <Select defaultValue={product?.category_id ?? ""} name="category_id">
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Default packaging</span>
            <Select defaultValue={product?.default_packaging_id ?? ""} name="default_packaging_id">
              <option value="">None</option>
              {packaging.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Image URL</span>
            <Input defaultValue={product?.image_url ?? ""} name="image_url" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Margin %</span>
            <Input defaultValue={product?.default_margin_percent ?? 40} min="0" name="default_margin_percent" step="0.01" type="number" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Labor fixed</span>
            <Input defaultValue={product?.labor_cost_fixed ?? 0} min="0" name="labor_cost_fixed" step="0.01" type="number" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Extra fixed</span>
            <Input defaultValue={product?.extra_cost_fixed ?? 0} min="0" name="extra_cost_fixed" step="0.01" type="number" />
          </label>
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Description</span>
            <Textarea defaultValue={product?.description ?? ""} name="description" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{product ? "Save product" : "Create product"}</SubmitButton>
        <Link className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={product ? `/products/${product.id}` : "/products"}>Cancel</Link>
      </div>
    </form>
  );
}
