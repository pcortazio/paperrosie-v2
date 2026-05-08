import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Pr2TableName } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

const pr2TablesWithActiveState = [
  "pr2_units",
  "pr2_material_categories",
  "pr2_product_categories",
  "pr2_suppliers",
  "pr2_customers",
  "pr2_settings",
  "pr2_materials",
  "pr2_purchases",
  "pr2_purchase_items",
  "pr2_products",
  "pr2_product_variants",
  "pr2_product_materials",
  "pr2_packaging",
  "pr2_packaging_materials",
  "pr2_quotes",
  "pr2_quote_items",
  "pr2_orders",
  "pr2_order_items",
  "pr2_inventory_counts",
  "pr2_inventory_count_items",
] satisfies Pr2TableName[];

export type Pr2TableWithActiveState = (typeof pr2TablesWithActiveState)[number];

export function isPr2TableWithActiveState(table: Pr2TableName): table is Pr2TableWithActiveState {
  return pr2TablesWithActiveState.includes(table as Pr2TableWithActiveState);
}

export async function setPr2ActiveState(
  client: Pr2Client,
  table: Pr2TableWithActiveState,
  id: string,
  active: boolean,
) {
  return client.from(table).update({ active }).eq("id", id).select().single();
}
