import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

export type Pr2PurchaseStatusFilter = "ordered" | "received" | "cancelled" | "all";

export type ListPr2PurchasesOptions = {
  activeState?: Pr2ActiveStateFilter;
  orderedFrom?: string;
  orderedTo?: string;
  receivedFrom?: string;
  receivedTo?: string;
  search?: string;
  status?: Pr2PurchaseStatusFilter;
  supplierId?: string;
};

export async function listPr2Purchases(client: Pr2Client, options: ListPr2PurchasesOptions = {}) {
  let query = client
    .from("pr2_purchases")
    .select("*, supplier:pr2_suppliers(*), items:pr2_purchase_items(total_cost)")
    .order("ordered_at", { ascending: false });

  if (options.activeState === "active" || !options.activeState) query = query.eq("active", true);
  if (options.activeState === "inactive") query = query.eq("active", false);
  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.supplierId) query = query.eq("supplier_id", options.supplierId);
  if (options.orderedFrom) query = query.gte("ordered_at", options.orderedFrom);
  if (options.orderedTo) query = query.lte("ordered_at", options.orderedTo);
  if (options.receivedFrom) query = query.gte("received_at", options.receivedFrom);
  if (options.receivedTo) query = query.lte("received_at", options.receivedTo);
  if (options.search) query = query.ilike("purchase_number", `%${options.search}%`);

  return query;
}

export async function getPr2Purchase(client: Pr2Client, id: string) {
  return client
    .from("pr2_purchases")
    .select("*, supplier:pr2_suppliers(*), items:pr2_purchase_items(*, material:pr2_materials(*), unit:pr2_units(*))")
    .eq("id", id)
    .single();
}

export async function listPr2PurchaseItemsForMaterial(client: Pr2Client, materialId: string) {
  return client
    .from("pr2_purchase_items")
    .select("*, purchase:pr2_purchases(*, supplier:pr2_suppliers(*))")
    .eq("material_id", materialId)
    .eq("active", true)
    .order("created_at", { ascending: false });
}
