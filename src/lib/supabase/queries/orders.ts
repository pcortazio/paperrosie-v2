import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

export type Pr2OrderStatusFilter = "pending" | "in_progress" | "completed" | "cancelled" | "all";

export async function listPr2Orders(
  client: Pr2Client,
  options: {
    activeState?: Pr2ActiveStateFilter;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    status?: Pr2OrderStatusFilter;
  } = {},
) {
  let query = client
    .from("pr2_orders")
    .select("*, customer:pr2_customers(*), quote:pr2_quotes(*)")
    .order("created_at", { ascending: false });
  if (options.activeState === "active" || !options.activeState) query = query.eq("active", true);
  if (options.activeState === "inactive") query = query.eq("active", false);
  if (options.customerId) query = query.eq("customer_id", options.customerId);
  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.search) query = query.ilike("order_number", `%${options.search}%`);
  if (options.dateFrom) query = query.gte("created_at", `${options.dateFrom}T00:00:00`);
  if (options.dateTo) query = query.lte("created_at", `${options.dateTo}T23:59:59`);
  return query;
}

export async function getPr2Order(client: Pr2Client, id: string) {
  return client
    .from("pr2_orders")
    .select("*, customer:pr2_customers(*), quote:pr2_quotes(*), items:pr2_order_items(*, product:pr2_products(*), variant:pr2_product_variants(*), packaging:pr2_packaging(*))")
    .eq("id", id)
    .single();
}

export async function getPr2OrderForQuote(client: Pr2Client, quoteId: string) {
  return client.from("pr2_orders").select("*").eq("quote_id", quoteId).eq("active", true).maybeSingle();
}
