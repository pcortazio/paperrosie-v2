import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

export type ListPr2ProductsOptions = {
  activeState?: Pr2ActiveStateFilter;
  categoryId?: string;
  search?: string;
};

export async function listPr2Products(client: Pr2Client, options: ListPr2ProductsOptions = {}) {
  let query = client
    .from("pr2_products")
    .select("*, category:pr2_product_categories(*), packaging:pr2_packaging(*), materials:pr2_product_materials(*, material:pr2_materials(*))")
    .order("name");

  if (options.activeState === "active" || !options.activeState) query = query.eq("active", true);
  if (options.activeState === "inactive") query = query.eq("active", false);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.search) query = query.ilike("name", `%${options.search}%`);

  return query;
}

export async function listActivePr2ProductsForQuotes(client: Pr2Client) {
  return client
    .from("pr2_products")
    .select("*, variants:pr2_product_variants(*)")
    .eq("active", true)
    .order("name");
}

export async function getPr2Product(client: Pr2Client, id: string) {
  return client
    .from("pr2_products")
    .select("*, category:pr2_product_categories(*), packaging:pr2_packaging(*), variants:pr2_product_variants(*), materials:pr2_product_materials(*, material:pr2_materials(*), unit:pr2_units(*))")
    .eq("id", id)
    .single();
}

export async function listPr2ProductMaterialsForMaterial(client: Pr2Client, materialId: string) {
  return client
    .from("pr2_product_materials")
    .select("*, product:pr2_products(*), variant:pr2_product_variants(*), unit:pr2_units(*)")
    .eq("material_id", materialId)
    .eq("active", true)
    .order("created_at", { ascending: false });
}
