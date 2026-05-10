import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2OrderForm = {
  customer_id: string;
  discount: number;
  notes: string | null;
  order_number: string;
  quote_id?: string | null;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  subtotal?: number;
  total?: number;
};

export type Pr2OrderItemForm = {
  order_id: string;
  packaging_id: string | null;
  pricing_snapshot: Json;
  product_id: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  variant_id: string | null;
};

export async function createPr2Order(client: Pr2Client, form: Pr2OrderForm) {
  return client.from("pr2_orders").insert({ subtotal: 0, total: 0, ...form }).select().single();
}

export async function updatePr2Order(client: Pr2Client, id: string, form: Omit<Pr2OrderForm, "order_number" | "quote_id">) {
  return client.from("pr2_orders").update(form).eq("id", id).select().single();
}

export async function createPr2OrderItem(client: Pr2Client, form: Pr2OrderItemForm) {
  return client.from("pr2_order_items").insert(form).select().single();
}

export async function updatePr2OrderTotals(client: Pr2Client, id: string, subtotal: number, discount: number) {
  return client
    .from("pr2_orders")
    .update({ discount, subtotal, total: Math.max(subtotal - discount, 0) })
    .eq("id", id)
    .select()
    .single();
}

export async function completePr2Order(client: Pr2Client, id: string) {
  return client.rpc("pr2_complete_order", { pr2_order_id: id });
}
