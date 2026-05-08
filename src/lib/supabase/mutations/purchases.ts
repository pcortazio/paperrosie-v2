import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2PurchaseForm = {
  purchase_number: string;
  supplier_id: string;
  ordered_at: string;
  notes: string | null;
};

export type Pr2PurchaseItemForm = {
  purchase_id: string;
  material_id: string;
  quantity: number;
  unit_id: string;
  subtotal: number;
  tax: number;
  shipping_allocated: number;
  total_cost: number;
  unit_cost: number;
};

export async function createPr2Purchase(client: Pr2Client, form: Pr2PurchaseForm) {
  return client.from("pr2_purchases").insert(form).select().single();
}

export async function updatePr2Purchase(client: Pr2Client, id: string, form: Omit<Pr2PurchaseForm, "purchase_number">) {
  return client.from("pr2_purchases").update(form).eq("id", id).select().single();
}

export async function createPr2PurchaseItem(client: Pr2Client, form: Pr2PurchaseItemForm) {
  return client.from("pr2_purchase_items").insert(form).select().single();
}

export async function updatePr2PurchaseItem(
  client: Pr2Client,
  id: string,
  form: Omit<Pr2PurchaseItemForm, "purchase_id">,
) {
  return client.from("pr2_purchase_items").update(form).eq("id", id).select().single();
}

export async function receivePr2Purchase(client: Pr2Client, id: string, receivedAt: string) {
  return client.rpc("pr2_receive_purchase", { pr2_purchase_id: id, pr2_received_at: receivedAt });
}

export async function cancelPr2Purchase(client: Pr2Client, id: string) {
  return client.rpc("pr2_cancel_purchase", { pr2_purchase_id: id });
}

export async function recalculatePr2ReceivedPurchase(client: Pr2Client, id: string) {
  return client.rpc("pr2_recalculate_received_purchase", { pr2_purchase_id: id });
}
