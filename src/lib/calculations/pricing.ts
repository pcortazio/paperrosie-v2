export type Pr2SuggestedPriceInput = {
  materialCost: number;
  packagingCost: number;
  laborCost: number;
  extraCost: number;
  marginPercent: number;
  etsyFeePercent: number;
  etsyFeeFixed: number;
};

export function calculateMaterialReferenceCost(unitCosts: number[]) {
  return Math.max(0, ...unitCosts.slice(0, 5));
}

export function calculatePackagingCost() {
  throw new Error("calculatePackagingCost is a Phase 3 implementation placeholder.");
}

export function calculateProductMaterialCost() {
  throw new Error("calculateProductMaterialCost is a Phase 3 implementation placeholder.");
}

export function calculateSuggestedPrice(input: Pr2SuggestedPriceInput) {
  void input;
  throw new Error("calculateSuggestedPrice is a Phase 3 implementation placeholder.");
}

export function roundUpToNearestQuarter(value: number) {
  return Math.ceil(value * 4) / 4;
}
