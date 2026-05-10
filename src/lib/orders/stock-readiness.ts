import {
  calculateOrderMaterialRequirements,
  type PlanningOrder,
  type PlanningPackagingMaterial,
  type PlanningProductMaterial,
} from "@/lib/planning/materials";

export type OrderReadinessLine = {
  currentStock: number;
  inactiveRequired: boolean;
  materialId: string;
  materialName: string;
  missingQuantity: number;
  remainingStock: number;
  requiredQuantity: number;
};

export function calculateOrderStockReadiness(input: {
  order: PlanningOrder;
  packagingMaterials: PlanningPackagingMaterial[];
  productMaterials: PlanningProductMaterial[];
}) {
  const orderRequirements = calculateOrderMaterialRequirements({
    orders: [input.order],
    packagingMaterials: input.packagingMaterials,
    productMaterials: input.productMaterials,
  });
  const lines = orderRequirements.map((requirement) => {
    return {
      currentStock: requirement.material.current_stock,
      inactiveRequired: !requirement.material.active,
      materialId: requirement.material.id,
      materialName: requirement.material.name,
      missingQuantity: Math.max(requirement.requiredQuantity - requirement.material.current_stock, 0),
      remainingStock: requirement.material.current_stock - requirement.requiredQuantity,
      requiredQuantity: requirement.requiredQuantity,
    };
  });

  return {
    canComplete: lines.every((line) => line.missingQuantity <= 0),
    lines,
  };
}
