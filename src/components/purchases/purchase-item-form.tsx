import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Pr2Material, Pr2PurchaseItem, Pr2Unit } from "@/types/database";

type PurchaseItemFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  item?: Pr2PurchaseItem;
  materials: Pr2Material[];
  units: Pr2Unit[];
};

export function PurchaseItemForm({ action, item, materials, units }: PurchaseItemFormProps) {
  return (
    <form action={action} className="grid gap-3 rounded-md border border-border bg-zinc-50 p-3 lg:grid-cols-8">
      <Select className="lg:col-span-2" defaultValue={item?.material_id ?? ""} name="material_id" required>
        <option value="" disabled>
          Material
        </option>
        {materials.map((material) => (
          <option key={material.id} value={material.id}>
            {material.name}
          </option>
        ))}
      </Select>
      <Input defaultValue={item?.quantity ?? ""} min="0.001" name="quantity" placeholder="Qty" step="0.001" type="number" />
      <Select defaultValue={item?.unit_id ?? ""} name="unit_id" required>
        <option value="" disabled>
          Unit
        </option>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.abbreviation}
          </option>
        ))}
      </Select>
      <Input defaultValue={item?.subtotal ?? ""} min="0" name="subtotal" placeholder="Subtotal" step="0.01" type="number" />
      <Input defaultValue={item?.tax ?? ""} min="0" name="tax" placeholder="Tax" step="0.01" type="number" />
      <Input
        defaultValue={item?.shipping_allocated ?? ""}
        min="0"
        name="shipping_allocated"
        placeholder="Shipping"
        step="0.01"
        type="number"
      />
      <SubmitButton>{item ? "Save" : "Add"}</SubmitButton>
    </form>
  );
}
