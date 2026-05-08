import type { SupabaseClient } from "@supabase/supabase-js";

import { finalizePr2InventoryCount } from "@/lib/supabase/mutations/inventory";
import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function finalizeInventoryCount(client: Pr2Client, id: string) {
  return finalizePr2InventoryCount(client, id);
}
