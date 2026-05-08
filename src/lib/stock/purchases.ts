import type { SupabaseClient } from "@supabase/supabase-js";

import {
  cancelPr2Purchase,
  receivePr2Purchase,
  recalculatePr2ReceivedPurchase,
} from "@/lib/supabase/mutations/purchases";
import type { Database } from "@/types/database";

type Pr2Client = SupabaseClient<Database>;

export async function receivePurchase(client: Pr2Client, id: string, receivedAt: string) {
  return receivePr2Purchase(client, id, receivedAt);
}

export async function recalculateReceivedPurchase(client: Pr2Client, id: string) {
  return recalculatePr2ReceivedPurchase(client, id);
}

export async function cancelPurchase(client: Pr2Client, id: string) {
  return cancelPr2Purchase(client, id);
}
