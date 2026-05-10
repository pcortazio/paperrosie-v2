import { SupplierGroupCard } from "@/components/planning/supplier-group-card";
import type { SupplierShoppingListGroup } from "@/lib/planning/materials";

type ShoppingListGroupProps = {
  groups: SupplierShoppingListGroup[];
};

export function ShoppingListGroup({ groups }: ShoppingListGroupProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SupplierGroupCard group={group} key={group.supplierId ?? "unassigned"} />
      ))}
    </div>
  );
}
