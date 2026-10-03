import { createBrowserClient } from "@supabase/ssr";
import { getSanitizedSupabaseUrl, getSanitizedSupabaseKey } from "./url";

export function createClient() {
  const supabaseUrl = getSanitizedSupabaseUrl();
  const supabaseAnonKey = getSanitizedSupabaseKey();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
