import { setSupplierActiveStateAction } from "@/app/(app)/suppliers/actions";
import {
  createMaterialCategoryAction,
  createProductCategoryAction,
  createUnitAction,
  setLookupActiveStateAction,
  updateMaterialCategoryAction,
  updatePricingDefaultsAction,
  updateProductCategoryAction,
  updateUnitAction,
} from "@/app/(app)/settings/actions";
import { LookupSection } from "@/components/settings/lookup-section";
import { PricingDefaultsForm } from "@/components/settings/pricing-defaults-form";
import { SuppliersSettingsSection } from "@/components/settings/suppliers-settings-section";
import { PageHeader } from "@/components/ui/page-header";
import {
  listPr2MaterialCategories,
  listPr2ProductCategories,
  listPr2Suppliers,
  listPr2Units,
} from "@/lib/supabase/queries/lookups";
import { getPr2Setting } from "@/lib/supabase/queries/settings";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const client = await createClient();
  const [
    { data: units },
    { data: materialCategories },
    { data: productCategories },
    { data: suppliers },
    { data: pricingDefaults },
  ] = await Promise.all([
    listPr2Units(client),
    listPr2MaterialCategories(client),
    listPr2ProductCategories(client),
    listPr2Suppliers(client),
    getPr2Setting(client, "pricing_defaults"),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" />
      <PricingDefaultsForm action={updatePricingDefaultsAction} value={pricingDefaults?.value} />
      <LookupSection
        activeAction={setLookupActiveStateAction}
        createAction={createUnitAction}
        items={units ?? []}
        table="pr2_units"
        title="Units"
        updateAction={updateUnitAction}
        withAbbreviation
      />
      <LookupSection
        activeAction={setLookupActiveStateAction}
        createAction={createMaterialCategoryAction}
        items={materialCategories ?? []}
        table="pr2_material_categories"
        title="Material categories"
        updateAction={updateMaterialCategoryAction}
      />
      <LookupSection
        activeAction={setLookupActiveStateAction}
        createAction={createProductCategoryAction}
        items={productCategories ?? []}
        table="pr2_product_categories"
        title="Product categories"
        updateAction={updateProductCategoryAction}
      />
      <SuppliersSettingsSection
        action={setSupplierActiveStateAction}
        suppliers={suppliers ?? []}
      />
    </div>
  );
}
