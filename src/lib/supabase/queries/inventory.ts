import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function listPr2InventoryCounts(client: Pr2Client) {
  return client.from("pr2_inventory_counts").select("*").order("created_at", { ascending: false });
}

export async function getPr2InventoryCount(client: Pr2Client, id: string) {
  return client
    .from("pr2_inventory_counts")
    .select("*, items:pr2_inventory_count_items(*, material:pr2_materials(*, unit:pr2_units(*)))")
    .eq("id", id)
    .single();
}
