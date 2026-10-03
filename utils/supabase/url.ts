const DEFAULT_SUPABASE_URL = "https://bmrkqohudimwhiuovxtg.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcmtxb2h1ZGltd2hpdW92eHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5ODI5NjcsImV4cCI6MjEwNjU1ODk2N30.aGO4wgNmVddd477C15grBYjAgUuxKZVQtQySbdFctPE";

export function isValidSupabaseAnonKey(rawKey: string): boolean {
  if (!rawKey || typeof rawKey !== "string") return false;
  const key = rawKey.trim().replace(/^["']|["']$/g, "");
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    if (payload.iss !== "supabase") return false;
    // Expected project ref is bmrkqohudimwhiuovxtg
    if (payload.ref !== "bmrkqohudimwhiuovxtg") return false;
    if (payload.exp && payload.exp < Date.now() / 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export function getSanitizedSupabaseUrl(): string {
  let url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
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

  if (!url || url.includes("placeholder") || !url.startsWith("http")) {
    return DEFAULT_SUPABASE_URL;
  }

  return url;
}

export function getSanitizedSupabaseKey(): string {
  let key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();
  key = key.replace(/^["']|["']$/g, "");

  if (!key || !isValidSupabaseAnonKey(key)) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }

  return key;
}
