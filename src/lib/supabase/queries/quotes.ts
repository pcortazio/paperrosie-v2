import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Pr2ActiveStateFilter } from "@/lib/supabase/queries/materials";

type Pr2Client = SupabaseClient<Database>;

export type Pr2QuoteStatusFilter = "draft" | "approved" | "cancelled" | "all";

export async function listPr2Quotes(
  client: Pr2Client,
  options: {
    activeState?: Pr2ActiveStateFilter;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    status?: Pr2QuoteStatusFilter;
  } = {},
) {
  let query = client
    .from("pr2_quotes")
    .select("*, customer:pr2_customers(*)")
    .order("created_at", { ascending: false });
  if (options.activeState === "active" || !options.activeState) query = query.eq("active", true);
  if (options.activeState === "inactive") query = query.eq("active", false);
  if (options.customerId) query = query.eq("customer_id", options.customerId);
  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.search) query = query.ilike("quote_number", `%${options.search}%`);
  if (options.dateFrom) query = query.gte("created_at", `${options.dateFrom}T00:00:00`);
  if (options.dateTo) query = query.lte("created_at", `${options.dateTo}T23:59:59`);
  return query;
}

export async function getPr2Quote(client: Pr2Client, id: string) {
  return client
    .from("pr2_quotes")
    .select("*, customer:pr2_customers(*), items:pr2_quote_items(*, product:pr2_products(*), variant:pr2_product_variants(*), packaging:pr2_packaging(*))")
    .eq("id", id)
    .single();
}
