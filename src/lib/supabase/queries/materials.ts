import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2ActiveStateFilter = "active" | "inactive" | "all";

type ListPr2MaterialsOptions = {
  search?: string;
  activeState?: Pr2ActiveStateFilter;
  categoryId?: string;
  supplierId?: string;
  stockStatus?: "all" | "low" | "in_stock";
};

export async function listPr2Materials(client: Pr2Client, options: ListPr2MaterialsOptions = {}) {
  let query = client
    .from("pr2_materials")
    .select("*, category:pr2_material_categories(*), unit:pr2_units(*), preferred_supplier:pr2_suppliers(*)")
    .order("name");

  if (options.activeState === "active" || !options.activeState) {
    query = query.eq("active", true);
  }

  if (options.activeState === "inactive") {
    query = query.eq("active", false);
  }

  if (options.search) {
    query = query.ilike("name", `%${options.search}%`);
  }

  if (options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options.supplierId) {
    query = query.eq("preferred_supplier_id", options.supplierId);
  }

  return query;
}

export async function listPr2LowStockMaterials(client: Pr2Client) {
  return client.from("pr2_low_stock_materials_view").select("*").order("name");
}

export async function listActivePr2Materials(client: Pr2Client) {
  return client.from("pr2_materials").select("*").eq("active", true).order("name");
}

export async function getPr2Material(client: Pr2Client, id: string) {
  return client
    .from("pr2_materials")
    .select("*, category:pr2_material_categories(*), unit:pr2_units(*), preferred_supplier:pr2_suppliers(*)")
    .eq("id", id)
    .single();
}
