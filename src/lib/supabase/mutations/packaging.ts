import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2PackagingForm = {
  description: string | null;
  image_url: string | null;
  margin_percent: number;
  name: string;
};

export type Pr2PackagingMaterialForm = {
  material_id: string;
  packaging_id: string;
  quantity: number;
  unit_id: string;
};

export async function createPr2Packaging(client: Pr2Client, form: Pr2PackagingForm) {
  return client.from("pr2_packaging").insert(form).select().single();
}

export async function updatePr2Packaging(client: Pr2Client, id: string, form: Pr2PackagingForm) {
  return client.from("pr2_packaging").update(form).eq("id", id).select().single();
}

export async function createPr2PackagingMaterial(client: Pr2Client, form: Pr2PackagingMaterialForm) {
  return client.from("pr2_packaging_materials").insert(form).select().single();
}
