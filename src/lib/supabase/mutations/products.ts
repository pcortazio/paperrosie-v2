import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2ProductForm = {
  category_id: string | null;
  default_margin_percent: number;
  default_packaging_id: string | null;
  description: string | null;
  extra_cost_fixed: number;
  image_url: string | null;
  labor_cost_fixed: number;
  name: string;
};

export type Pr2ProductVariantForm = {
  description: string | null;
  image_url: string | null;
  labor_cost_fixed: number | null;
  margin_percent: number | null;
  name: string;
  product_id: string;
  sku: string | null;
};

export type Pr2ProductMaterialForm = {
  material_id: string;
  product_id: string;
  quantity: number;
  unit_id: string;
  variant_id: string | null;
};

export async function createPr2Product(client: Pr2Client, form: Pr2ProductForm) {
  return client.from("pr2_products").insert(form).select().single();
}

export async function updatePr2Product(client: Pr2Client, id: string, form: Pr2ProductForm) {
  return client.from("pr2_products").update(form).eq("id", id).select().single();
}

export async function createPr2ProductVariant(client: Pr2Client, form: Pr2ProductVariantForm) {
  return client.from("pr2_product_variants").insert(form).select().single();
}

export async function updatePr2ProductVariant(client: Pr2Client, id: string, form: Pr2ProductVariantForm) {
  return client.from("pr2_product_variants").update(form).eq("id", id).select().single();
}

export async function createPr2ProductMaterial(client: Pr2Client, form: Pr2ProductMaterialForm) {
  return client.from("pr2_product_materials").insert(form).select().single();
}
