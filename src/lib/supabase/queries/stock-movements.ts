import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function listPr2StockMovementsForMaterial(client: Pr2Client, materialId: string) {
  return client
    .from("pr2_stock_movements")
    .select("*")
    .eq("material_id", materialId)
    .order("created_at", { ascending: false });
}

export async function listPr2StockMovementsForSource(
  client: Pr2Client,
  sourceType: string,
  sourceId: string,
) {
  return client
    .from("pr2_stock_movements")
    .select("*, material:pr2_materials(*)")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false });
}
