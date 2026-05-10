import { SubmitButton } from "@/components/forms/submit-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Json } from "@/types/database";

type PricingDefaults = {
  default_packaging_margin_percent: number;
  default_product_margin_percent: number;
  platform_fee_fixed: number;
  platform_fee_percent: number;
  rounding_increment: number;
};

const defaults: PricingDefaults = {
  default_packaging_margin_percent: 40,
  default_product_margin_percent: 40,
  platform_fee_fixed: 0.25,
  platform_fee_percent: 25,
  rounding_increment: 0.25,
};

function readDefaults(value: Json | undefined): PricingDefaults {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults;
  }

  return {
    default_packaging_margin_percent:
      Number(value.default_packaging_margin_percent ?? value.default_margin_percent) || 40,
    default_product_margin_percent:
      Number(value.default_product_margin_percent ?? value.default_margin_percent) || 40,
    platform_fee_fixed: Number(value.platform_fee_fixed ?? value.etsy_fee_fixed) || 0.25,
    platform_fee_percent: Number(value.platform_fee_percent ?? value.etsy_fee_percent) || 25,
    rounding_increment: Number(value.rounding_increment) || 0.25,
  };
}

type PricingDefaultsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  value?: Json;
};

export function PricingDefaultsForm({ action, value }: PricingDefaultsFormProps) {
  const current = readDefaults(value);

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold">Pricing defaults</h2>
      <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        <label className="space-y-1.5">
          <span>Product margin %</span>
          <Input
            defaultValue={current.default_product_margin_percent}
            min="0"
            name="default_product_margin_percent"
            step="0.01"
            type="number"
          />
        </label>
        <label className="space-y-1.5">
          <span>Packaging margin %</span>
          <Input
            defaultValue={current.default_packaging_margin_percent}
            min="0"
            name="default_packaging_margin_percent"
            step="0.01"
            type="number"
          />
        </label>
        <label className="space-y-1.5">
          <span>Platform fee %</span>
          <Input
            defaultValue={current.platform_fee_percent}
            min="0"
            name="platform_fee_percent"
            step="0.01"
            type="number"
          />
        </label>
        <label className="space-y-1.5">
          <span>Fixed fee</span>
          <Input
            defaultValue={current.platform_fee_fixed}
            min="0"
            name="platform_fee_fixed"
            step="0.01"
            type="number"
          />
        </label>
        <label className="space-y-1.5">
          <span>Rounding</span>
          <Input
            defaultValue={current.rounding_increment}
            min="0.01"
            name="rounding_increment"
            step="0.01"
            type="number"
          />
        </label>
        <div className="self-end sm:col-span-2 lg:col-span-1">
          <SubmitButton variant="secondary">Save</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
