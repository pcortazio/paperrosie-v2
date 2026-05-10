import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2CustomerForm = {
  company: string | null;
  email: string | null;
  name: string;
  notes: string | null;
  phone: string | null;
};

export async function createPr2Customer(client: Pr2Client, form: Pr2CustomerForm) {
  return client.from("pr2_customers").insert(form).select().single();
}

export async function updatePr2Customer(client: Pr2Client, id: string, form: Pr2CustomerForm) {
  return client.from("pr2_customers").update(form).eq("id", id).select().single();
}
