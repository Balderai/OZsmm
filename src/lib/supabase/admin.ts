import { createClient } from "@supabase/supabase-js";
import { assertServerSecret } from "@/lib/config";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL");
  }

  return createClient(url, assertServerSecret("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
