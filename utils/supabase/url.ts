export function getSanitizedSupabaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  // Strip quotes if user pasted with quotes
  url = url.replace(/^["']|["']$/g, "");

  // If user pasted dashboard URL: https://supabase.com/dashboard/project/<ref>
  const dashMatch = url.match(/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashMatch) {
    return `https://${dashMatch[1]}.supabase.co`;
  }

  // Strip subpaths like /rest/v1 or /auth/v1 or /storage/v1
  url = url.replace(/\/(rest|auth|storage)\/v[0-9]+\/?$/i, "");

  // Strip all trailing slashes
  url = url.replace(/\/+$/, "");

  return url || "https://placeholder-project.supabase.co";
}

export function getSanitizedSupabaseKey(): string {
  let key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  return key.replace(/^["']|["']$/g, "") || "placeholder-anon-key";
}
