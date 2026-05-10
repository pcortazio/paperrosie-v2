import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

export async function listPr2PlanningMaterials(
  client: Pr2Client,
  activeState: Pr2ActiveStateFilter = "all",
) {
  let query = client
    .from("pr2_materials")
    .select("*, unit:pr2_units(*), preferred_supplier:pr2_suppliers(*)")
    .order("name");

  if (activeState === "active") query = query.eq("active", true);
  if (activeState === "inactive") query = query.eq("active", false);

  return query;
}

export async function listPr2PlanningOrders(client: Pr2Client) {
  return client
    .from("pr2_orders")
    .select("*, customer:pr2_customers(*), items:pr2_order_items(*)")
    .in("status", ["pending", "in_progress"])
    .eq("active", true)
    .order("created_at", { ascending: false });
}

export async function listPr2PlanningProductMaterials(client: Pr2Client, productIds: string[]) {
  return client
    .from("pr2_product_materials")
    .select("*, material:pr2_materials(*, unit:pr2_units(*), preferred_supplier:pr2_suppliers(*))")
    .in("product_id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("active", true);
}

export async function listPr2PlanningPackagingMaterials(client: Pr2Client, packagingIds: string[]) {
  return client
    .from("pr2_packaging_materials")
    .select("*, material:pr2_materials(*, unit:pr2_units(*), preferred_supplier:pr2_suppliers(*))")
    .in("packaging_id", packagingIds.length ? packagingIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("active", true);
}
