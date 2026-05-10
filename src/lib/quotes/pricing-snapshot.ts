import {
  calculateSuggestedPrice,
  calculateVariantOverrides,
  type PricingDefaults,
} from "@/lib/calculations/pricing";
import { buildPackagingPrice } from "@/lib/pricing/build";
import type {
  Json,
  Pr2Material,
  Pr2Packaging,
  Pr2PackagingMaterial,
  Pr2Product,
  Pr2ProductMaterial,
  Pr2ProductVariant,
} from "@/types/database";

type ProductForSnapshot = Pr2Product & {
  materials: Array<Pr2ProductMaterial & { material: Pr2Material | null }>;
};

type PackagingForSnapshot =
  | (Pr2Packaging & {
      materials: Array<Pr2PackagingMaterial & { material: Pr2Material | null }>;
    })
  | null;

export function buildQuoteItemPricingSnapshot(input: {
  defaults: PricingDefaults;
  packaging: PackagingForSnapshot;
  product: ProductForSnapshot;
  quantity: number;
  unitPriceOverride?: number | null;
  variant?: Pr2ProductVariant | null;
}) {
  const overrides = calculateVariantOverrides({
    productLaborCost: input.product.labor_cost_fixed,
    productMarginPercent: input.product.default_margin_percent,
    variantLaborCost: input.variant?.labor_cost_fixed,
    variantMarginPercent: input.variant?.margin_percent,
  });
  const materialLines = input.product.materials.filter(
    (line) =>
      line.active &&
      line.material &&
      (line.variant_id === null || line.variant_id === input.variant?.id),
  );
  const materialCost = materialLines.reduce(
    (sum, line) => sum + line.quantity * (line.material?.reference_cost_per_unit ?? 0),
    0,
  );
  const packagingCost = input.packaging
    ? buildPackagingPrice(input.packaging, input.packaging.materials).finalCost
    : 0;
  const breakdown = calculateSuggestedPrice({
    extraCost: input.product.extra_cost_fixed,
    laborCost: overrides.laborCost,
    marginPercent: overrides.marginPercent,
    materialCost,
    packagingCost,
    platformFeeFixed: input.defaults.platformFeeFixed,
    platformFeePercent: input.defaults.platformFeePercent,
    roundingIncrement: input.defaults.roundingIncrement,
  });
  const finalUnitPrice = input.unitPriceOverride ?? breakdown.finalPrice;

  const snapshot = {
    created_at: new Date().toISOString(),
    extra_cost: input.product.extra_cost_fixed,
    final_unit_price: finalUnitPrice,
    labor_cost: overrides.laborCost,
    margin_percent: overrides.marginPercent,
    material_cost: materialCost,
    materials: materialLines.map((line) => ({
      material_id: line.material_id,
      material_name: line.material?.name,
      quantity: line.quantity,
      reference_cost_per_unit: line.material?.reference_cost_per_unit ?? 0,
      total_cost: line.quantity * (line.material?.reference_cost_per_unit ?? 0),
    })),
    packaging_cost: packagingCost,
    packaging_id: input.packaging?.id ?? null,
    packaging_name: input.packaging?.name ?? null,
    platform_fee: breakdown.platformFee,
    product_id: input.product.id,
    product_name: input.product.name,
    quantity: input.quantity,
    suggested_price: breakdown.finalPrice,
    variant_id: input.variant?.id ?? null,
    variant_name: input.variant?.name ?? null,
  } satisfies Record<string, unknown>;

  return {
    snapshot: snapshot as Json,
    totalPrice: finalUnitPrice * input.quantity,
    unitPrice: finalUnitPrice,
  };
}
