import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function listPr2ProductMaterialsForOrderItems(client: Pr2Client, productIds: string[]) {
  return client
    .from("pr2_product_materials")
    .select("*, material:pr2_materials(*)")
    .in("product_id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("active", true);
}

export async function listPr2PackagingMaterialsForOrderItems(client: Pr2Client, packagingIds: string[]) {
  return client
    .from("pr2_packaging_materials")
    .select("*, material:pr2_materials(*)")
    .in("packaging_id", packagingIds.length ? packagingIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("active", true);
}
