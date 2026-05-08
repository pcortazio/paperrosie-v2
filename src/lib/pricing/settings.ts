import type { Json } from "@/types/database";
import { fallbackPricingDefaults, type PricingDefaults } from "@/lib/calculations/pricing";

export function parsePricingDefaults(value: Json | undefined): PricingDefaults {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallbackPricingDefaults;
  }

  return {
    defaultPackagingMarginPercent:
      Number(value.default_packaging_margin_percent ?? value.default_margin_percent) ||
      fallbackPricingDefaults.defaultPackagingMarginPercent,
    defaultProductMarginPercent:
      Number(value.default_product_margin_percent ?? value.default_margin_percent) ||
      fallbackPricingDefaults.defaultProductMarginPercent,
    platformFeeFixed:
      Number(value.platform_fee_fixed ?? value.etsy_fee_fixed) ||
      fallbackPricingDefaults.platformFeeFixed,
    platformFeePercent:
      Number(value.platform_fee_percent ?? value.etsy_fee_percent) ||
      fallbackPricingDefaults.platformFeePercent,
    roundingIncrement: Number(value.rounding_increment) || fallbackPricingDefaults.roundingIncrement,
  };
}
