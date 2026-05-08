import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Pr2Material, Pr2ProductVariant, Pr2Unit } from "@/types/database";

type MaterialCompositionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  materials: Pr2Material[];
  units: Pr2Unit[];
  variants?: Pr2ProductVariant[];
};

export function MaterialCompositionForm({ action, materials, units, variants }: MaterialCompositionFormProps) {
  return (
    <form action={action} className="grid gap-3 rounded-md border border-border bg-zinc-50 p-3 lg:grid-cols-5">
      <Select name="material_id" required>
        <option value="">Material</option>
        {materials.map((material) => (
          <option key={material.id} value={material.id}>{material.name}</option>
        ))}
      </Select>
      {variants ? (
        <Select name="variant_id">
          <option value="">Base product</option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>{variant.name}</option>
          ))}
        </Select>
      ) : null}
      <Input min="0.001" name="quantity" placeholder="Quantity" required step="0.001" type="number" />
      <Select name="unit_id" required>
        <option value="">Unit</option>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>{unit.abbreviation}</option>
        ))}
      </Select>
      <SubmitButton>Add material</SubmitButton>
    </form>
  );
}
