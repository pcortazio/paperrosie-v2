import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Pr2Packaging, Pr2Product, Pr2ProductVariant } from "@/types/database";

type QuoteItemEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  packaging: Pr2Packaging[];
  products: Array<Pr2Product & { variants?: Pr2ProductVariant[] }>;
};

export function QuoteItemEditor({ action, packaging, products }: QuoteItemEditorProps) {
  return (
    <form action={action} className="grid gap-3 rounded-md border border-border bg-zinc-50 p-3 lg:grid-cols-5">
      <Select name="product_id" required>
        <option value="">Product</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>{product.name}</option>
        ))}
      </Select>
      <Select name="variant_id">
        <option value="">No variant</option>
        {products.flatMap((product) => product.variants ?? []).map((variant) => (
          <option key={variant.id} value={variant.id}>{variant.name}</option>
        ))}
      </Select>
      <Select name="packaging_id">
        <option value="">Product default</option>
        {packaging.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </Select>
      <Input min="1" name="quantity" placeholder="Qty" required step="1" type="number" />
      <Input min="0" name="unit_price_override" placeholder="Override price" step="0.01" type="number" />
      <div className="lg:col-span-5">
        <SubmitButton>Add item</SubmitButton>
      </div>
    </form>
  );
}
