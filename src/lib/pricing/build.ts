import {
  calculatePackagingCost,
  calculateProductMaterialCost,
  calculateSuggestedPrice,
  type PriceBreakdown,
  type PricingDefaults,
} from "@/lib/calculations/pricing";
import type { Pr2Material, Pr2Packaging, Pr2PackagingMaterial, Pr2Product, Pr2ProductMaterial } from "@/types/database";

type ProductMaterialLine = Pr2ProductMaterial & { material: Pr2Material | null };
type PackagingMaterialLine = Pr2PackagingMaterial & { material: Pr2Material | null };

export function buildPackagingPrice(packaging: Pr2Packaging, materials: PackagingMaterialLine[]) {
  const lines = materials
    .filter((line) => line.active && line.material)
    .map((line) => ({
      quantity: line.quantity,
      referenceCostPerUnit: line.material?.reference_cost_per_unit ?? 0,
    }));

  return calculatePackagingCost(lines, packaging.margin_percent);
}

export function buildProductPrice(
  product: Pr2Product,
  productMaterials: ProductMaterialLine[],
  packaging: (Pr2Packaging & { materials?: PackagingMaterialLine[] }) | null,
  defaults: PricingDefaults,
): PriceBreakdown {
  const materialCost = calculateProductMaterialCost(
    productMaterials
      .filter((line) => line.active && !line.variant_id && line.material)
      .map((line) => ({
        quantity: line.quantity,
        referenceCostPerUnit: line.material?.reference_cost_per_unit ?? 0,
      })),
  );
  const packagingCost = packaging?.materials
    ? buildPackagingPrice(packaging, packaging.materials).finalCost
    : 0;

  return calculateSuggestedPrice({
    extraCost: product.extra_cost_fixed,
    laborCost: product.labor_cost_fixed,
    marginPercent: product.default_margin_percent || defaults.defaultProductMarginPercent,
    materialCost,
    packagingCost,
    platformFeeFixed: defaults.platformFeeFixed,
    platformFeePercent: defaults.platformFeePercent,
    roundingIncrement: defaults.roundingIncrement,
  });
}
