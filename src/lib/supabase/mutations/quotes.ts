import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export type Pr2QuoteForm = {
  customer_id: string;
  discount: number;
  language_preference: string;
  notes: string | null;
  quote_number: string;
  status?: "draft" | "approved" | "cancelled";
};

export type Pr2QuoteItemForm = {
  packaging_id: string | null;
  pricing_snapshot: Json;
  product_id: string;
  quantity: number;
  quote_id: string;
  total_price: number;
  unit_price: number;
  variant_id: string | null;
};

export async function createPr2Quote(client: Pr2Client, form: Pr2QuoteForm) {
  return client.from("pr2_quotes").insert({ ...form, subtotal: 0, total: 0 }).select().single();
}

export async function updatePr2Quote(client: Pr2Client, id: string, form: Omit<Pr2QuoteForm, "quote_number">) {
  return client.from("pr2_quotes").update(form).eq("id", id).select().single();
}

export async function createPr2QuoteItem(client: Pr2Client, form: Pr2QuoteItemForm) {
  return client.from("pr2_quote_items").insert(form).select().single();
}

export async function updatePr2QuoteItem(client: Pr2Client, id: string, form: Omit<Pr2QuoteItemForm, "quote_id">) {
  return client.from("pr2_quote_items").update(form).eq("id", id).select().single();
}

export async function updatePr2QuoteTotals(client: Pr2Client, id: string, subtotal: number, discount: number) {
  return client
    .from("pr2_quotes")
    .update({ discount, subtotal, total: Math.max(subtotal - discount, 0) })
    .eq("id", id)
    .select()
    .single();
}
