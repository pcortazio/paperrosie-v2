import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function createAuthenticatedClient() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return client;
}
