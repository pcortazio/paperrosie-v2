import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2SupplierForm = {
  name: string;
  website: string | null;
  notes: string | null;
};

export async function createPr2Supplier(client: Pr2Client, form: Pr2SupplierForm) {
  return client.from("pr2_suppliers").insert(form).select().single();
}

export async function updatePr2Supplier(client: Pr2Client, id: string, form: Pr2SupplierForm) {
  return client.from("pr2_suppliers").update(form).eq("id", id).select().single();
}
