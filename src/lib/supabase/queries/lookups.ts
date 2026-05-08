import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function listPr2Units(client: Pr2Client) {
  return client.from("pr2_units").select("*").order("name");
}

export async function listActivePr2Units(client: Pr2Client) {
  return client.from("pr2_units").select("*").eq("active", true).order("name");
}

export async function listPr2MaterialCategories(client: Pr2Client) {
  return client.from("pr2_material_categories").select("*").order("name");
}

export async function listActivePr2MaterialCategories(client: Pr2Client) {
  return client.from("pr2_material_categories").select("*").eq("active", true).order("name");
}

export async function listPr2ProductCategories(client: Pr2Client) {
  return client.from("pr2_product_categories").select("*").order("name");
}

export async function listActivePr2ProductCategories(client: Pr2Client) {
  return client.from("pr2_product_categories").select("*").eq("active", true).order("name");
}

export async function listPr2Suppliers(client: Pr2Client) {
  return client.from("pr2_suppliers").select("*").order("name");
}

export async function listActivePr2Suppliers(client: Pr2Client) {
  return client.from("pr2_suppliers").select("*").eq("active", true).order("name");
}

export async function getPr2Supplier(client: Pr2Client, id: string) {
  return client.from("pr2_suppliers").select("*").eq("id", id).single();
}
