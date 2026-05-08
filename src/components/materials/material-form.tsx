import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  Pr2Material,
  Pr2MaterialCategory,
  Pr2Supplier,
  Pr2Unit,
} from "@/types/database";

type MaterialFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Pr2MaterialCategory[];
  material?: Pr2Material;
  suppliers: Pr2Supplier[];
  units: Pr2Unit[];
};

export function MaterialForm({
  action,
  categories,
  material,
  suppliers,
  units,
}: MaterialFormProps) {
  return (
    <form action={action} className="max-w-3xl space-y-5">
      <FormSection title="Material">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Name</span>
            <Input defaultValue={material?.name} name="name" required />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Category</span>
            <Select defaultValue={material?.category_id ?? ""} name="category_id">
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {!category.active ? " (inactive)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Unit</span>
            <Select defaultValue={material?.unit_id ?? ""} name="unit_id" required>
              <option value="" disabled>
                Select unit
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                  {!unit.active ? " (inactive)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Current stock</span>
            <Input
              defaultValue={material?.current_stock ?? 0}
              min="0"
              name="current_stock"
              step="0.001"
              type="number"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Minimum stock</span>
            <Input
              defaultValue={material?.minimum_stock ?? 0}
              min="0"
              name="minimum_stock"
              step="0.001"
              type="number"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Reference cost per unit</span>
            <Input
              defaultValue={material?.reference_cost_per_unit ?? 0}
              min="0"
              name="reference_cost_per_unit"
              step="0.0001"
              type="number"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Preferred supplier</span>
            <Select defaultValue={material?.preferred_supplier_id ?? ""} name="preferred_supplier_id">
              <option value="">None</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                  {!supplier.active ? " (inactive)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            <span>Notes</span>
            <Textarea defaultValue={material?.notes ?? ""} name="notes" />
          </label>
        </div>
      </FormSection>
      <div className="flex gap-2">
        <SubmitButton>{material ? "Save material" : "Create material"}</SubmitButton>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-zinc-50"
          href={material ? `/materials/${material.id}` : "/materials"}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
