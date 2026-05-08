import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function getPr2Setting(client: Pr2Client, key: string) {
  return client.from("pr2_settings").select("*").eq("key", key).eq("active", true).maybeSingle();
}

export async function listPr2Settings(client: Pr2Client) {
  return client.from("pr2_settings").select("*").order("key");
}
