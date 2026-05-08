import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2MaterialForm = {
  name: string;
  category_id: string | null;
  unit_id: string;
  current_stock: number;
  minimum_stock: number;
  reference_cost_per_unit: number;
  preferred_supplier_id: string | null;
  notes: string | null;
};

export async function createPr2Material(client: Pr2Client, form: Pr2MaterialForm) {
  return client.from("pr2_materials").insert(form).select().single();
}

export async function updatePr2Material(client: Pr2Client, id: string, form: Pr2MaterialForm) {
  return client.from("pr2_materials").update(form).eq("id", id).select().single();
}
