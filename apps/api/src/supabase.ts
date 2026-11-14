import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/** Server-side client. Uses the service role key: keep it inside apps/api. */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
