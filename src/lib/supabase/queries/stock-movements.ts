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
