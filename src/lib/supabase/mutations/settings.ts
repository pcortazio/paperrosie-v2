import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function upsertPr2Setting(client: Pr2Client, key: string, value: Json) {
  return client
    .from("pr2_settings")
    .upsert({ key, value, active: true }, { onConflict: "key" })
    .select()
    .single();
}
