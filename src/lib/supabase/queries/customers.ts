import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

export async function listPr2Customers(
  client: Pr2Client,
  options: { activeState?: Pr2ActiveStateFilter; search?: string } = {},
) {
  let query = client.from("pr2_customers").select("*").order("name");
  if (options.activeState === "active" || !options.activeState) query = query.eq("active", true);
  if (options.activeState === "inactive") query = query.eq("active", false);
  if (options.search) query = query.ilike("name", `%${options.search}%`);
  return query;
}

export async function listActivePr2Customers(client: Pr2Client) {
  return client.from("pr2_customers").select("*").eq("active", true).order("name");
}

export async function getPr2Customer(client: Pr2Client, id: string) {
  return client.from("pr2_customers").select("*").eq("id", id).single();
}
