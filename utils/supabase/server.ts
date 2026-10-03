import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSanitizedSupabaseUrl, getSanitizedSupabaseKey } from "./url";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSanitizedSupabaseUrl(),
    getSanitizedSupabaseKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can occur if called from a Server Component without mutation context
          }
        },
      },
    }
  );
}
