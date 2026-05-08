import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function createPr2InventoryCount(client: Pr2Client, form: { counted_at: string; notes: string | null }) {
  return client.from("pr2_inventory_counts").insert(form).select().single();
}

export async function createPr2InventoryCountItems(client: Pr2Client, id: string) {
  return client.rpc("pr2_create_inventory_count_items", { pr2_inventory_count_id: id });
}

export async function updatePr2InventoryCountItem(client: Pr2Client, id: string, countedQuantity: number) {
  return client
    .from("pr2_inventory_count_items")
    .update({ counted_quantity: countedQuantity })
    .eq("id", id)
    .select()
    .single();
}

export async function finalizePr2InventoryCount(client: Pr2Client, id: string) {
  return client.rpc("pr2_finalize_inventory_count", { pr2_inventory_count_id: id });
}

export async function cancelPr2InventoryCount(client: Pr2Client, id: string) {
  return client.from("pr2_inventory_counts").update({ status: "cancelled" }).eq("id", id).select().single();
}
