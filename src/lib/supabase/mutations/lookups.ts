import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function createPr2Unit(client: Pr2Client, form: { name: string; abbreviation: string }) {
  return client.from("pr2_units").insert(form).select().single();
}

export async function updatePr2Unit(client: Pr2Client, id: string, form: { name: string; abbreviation: string }) {
  return client.from("pr2_units").update(form).eq("id", id).select().single();
}

export async function createPr2MaterialCategory(client: Pr2Client, form: { name: string }) {
  return client.from("pr2_material_categories").insert(form).select().single();
}

export async function updatePr2MaterialCategory(client: Pr2Client, id: string, form: { name: string }) {
  return client.from("pr2_material_categories").update(form).eq("id", id).select().single();
}

export async function createPr2ProductCategory(client: Pr2Client, form: { name: string }) {
  return client.from("pr2_product_categories").insert(form).select().single();
}

export async function updatePr2ProductCategory(client: Pr2Client, id: string, form: { name: string }) {
  return client.from("pr2_product_categories").update(form).eq("id", id).select().single();
}
