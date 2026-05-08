import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

export type ListPr2PackagingOptions = {
  activeState?: Pr2ActiveStateFilter;
  search?: string;
};

export async function listPr2Packaging(client: Pr2Client, options: ListPr2PackagingOptions = {}) {
  let query = client
    .from("pr2_packaging")
    .select("*, materials:pr2_packaging_materials(*, material:pr2_materials(*))")
    .order("name");

  if (options.activeState === "active" || !options.activeState) query = query.eq("active", true);
  if (options.activeState === "inactive") query = query.eq("active", false);
  if (options.search) query = query.ilike("name", `%${options.search}%`);

  return query;
}

export async function listActivePr2Packaging(client: Pr2Client) {
  return client.from("pr2_packaging").select("*").eq("active", true).order("name");
}

export async function getPr2Packaging(client: Pr2Client, id: string) {
  return client
    .from("pr2_packaging")
    .select("*, materials:pr2_packaging_materials(*, material:pr2_materials(*), unit:pr2_units(*))")
    .eq("id", id)
    .single();
}

export async function listPr2PackagingMaterialsForMaterial(client: Pr2Client, materialId: string) {
  return client
    .from("pr2_packaging_materials")
    .select("*, packaging:pr2_packaging(*), unit:pr2_units(*)")
    .eq("material_id", materialId)
    .eq("active", true)
    .order("created_at", { ascending: false });
}
