import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

type ListPr2SuppliersOptions = {
  search?: string;
  activeState?: Pr2ActiveStateFilter;
};

export async function listPr2SuppliersFiltered(
  client: Pr2Client,
  options: ListPr2SuppliersOptions = {},
) {
  let query = client.from("pr2_suppliers").select("*").order("name");

  if (options.activeState === "active" || !options.activeState) {
    query = query.eq("active", true);
  }

  if (options.activeState === "inactive") {
    query = query.eq("active", false);
  }

  if (options.search) {
    query = query.ilike("name", `%${options.search}%`);
  }

  return query;
}
