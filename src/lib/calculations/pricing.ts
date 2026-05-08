export type PricingMaterialLine = {
  quantity: number;
  referenceCostPerUnit: number;
};

export type PricingDefaults = {
  defaultPackagingMarginPercent: number;
  defaultProductMarginPercent: number;
  platformFeeFixed: number;
  platformFeePercent: number;
  roundingIncrement: number;
};

export type VariantOverridesInput = {
  productLaborCost: number;
  productMarginPercent: number;
  variantLaborCost?: number | null;
  variantMarginPercent?: number | null;
};

export type Pr2SuggestedPriceInput = {
  materialCost: number;
  packagingCost: number;
  laborCost: number;
  extraCost: number;
  marginPercent: number;
  platformFeePercent: number;
  platformFeeFixed: number;
  roundingIncrement: number;
};

export type PriceBreakdown = {
  materialCost: number;
  packagingCost: number;
  laborCost: number;
  extraCost: number;
  markupProfit: number;
  platformFee: number;
  rawPrice: number;
  finalPrice: number;
};

export const fallbackPricingDefaults: PricingDefaults = {
  defaultPackagingMarginPercent: 40,
  defaultProductMarginPercent: 40,
  platformFeeFixed: 0.25,
  platformFeePercent: 25,
  roundingIncrement: 0.25,
};

export function calculateMaterialReferenceCost(unitCosts: number[]) {
  return Math.max(0, ...unitCosts.slice(0, 5));
}

export function calculateProductMaterialCost(lines: PricingMaterialLine[]) {
  return lines.reduce(
    (sum, line) => sum + line.quantity * line.referenceCostPerUnit,
    0,
  );
}

export function calculatePackagingCost(lines: PricingMaterialLine[], marginPercent = 0) {
  const materialCost = calculateProductMaterialCost(lines);
  const markupProfit = materialCost * (marginPercent / 100);

  return {
    finalCost: materialCost + markupProfit,
    materialCost,
    markupProfit,
  };
}

export function calculateVariantOverrides(input: VariantOverridesInput) {
  return {
    laborCost: input.variantLaborCost ?? input.productLaborCost,
    marginPercent: input.variantMarginPercent ?? input.productMarginPercent,
  };
}

export function calculateSuggestedPrice(input: Pr2SuggestedPriceInput): PriceBreakdown {
  const markupProfit = input.materialCost * (input.marginPercent / 100);
  const subtotalBeforeFee =
    input.materialCost +
    input.packagingCost +
    input.laborCost +
    input.extraCost +
    markupProfit;
  const platformFee = subtotalBeforeFee * (input.platformFeePercent / 100) + input.platformFeeFixed;
  const rawPrice = subtotalBeforeFee + platformFee;

  return {
    extraCost: input.extraCost,
    finalPrice: roundUpToIncrement(rawPrice, input.roundingIncrement),
    laborCost: input.laborCost,
    markupProfit,
    materialCost: input.materialCost,
    packagingCost: input.packagingCost,
    platformFee,
    rawPrice,
  };
}

export function roundUpToIncrement(value: number, increment: number) {
  const safeIncrement = increment > 0 ? increment : 0.25;
  return Math.ceil(value / safeIncrement) * safeIncrement;
}

export function roundUpToNearestQuarter(value: number) {
  return roundUpToIncrement(value, 0.25);
}
