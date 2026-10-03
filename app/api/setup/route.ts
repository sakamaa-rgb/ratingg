import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_PROJECT_REF = "djblyzmsyajkqowzjfdt";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqYmx5em1zeWFqa3Fvd3pqZmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5OTg2ODUsImV4cCI6MjEwNjU3NDY4NX0.4GAdjE2KigymvwM5SKOM1AukoQR5m0Pbz-rxM3F41k8";

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqYmx5em1zeWFqa3Fvd3pqZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDk5ODY4NSwiZXhwIjoyMTA2NTc0Njg1fQ.-YpgOLrKJunoVo990wOZOfbgSOp3sL5sZ2fotKLWRIM";

// SQL statements split into individual atomic statements
const SETUP_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS public.movies (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    tagline TEXT,
    overview TEXT NOT NULL,
    poster_path TEXT NOT NULL DEFAULT '',
    backdrop_path TEXT,
    release_date TEXT,
    vote_average NUMERIC DEFAULT 7.5,
    vote_count INTEGER DEFAULT 1,
    category TEXT DEFAULT 'popular',
    runtime INTEGER DEFAULT 120,
    genres JSONB DEFAULT '[]'::jsonb,
    youtube_video_id TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    movie_title TEXT NOT NULL,
    movie_poster TEXT,
    author TEXT NOT NULL DEFAULT 'anonymous',
    rating NUMERIC NOT NULL DEFAULT 5,
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS public.users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  )`,
  `ALTER TABLE public.movies DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.users DISABLE ROW LEVEL SECURITY`,
  `GRANT ALL ON TABLE public.movies TO anon`,
  `GRANT ALL ON TABLE public.movies TO authenticated`,
  `GRANT ALL ON TABLE public.reviews TO anon`,
  `GRANT ALL ON TABLE public.reviews TO authenticated`,
  `GRANT ALL ON TABLE public.users TO anon`,
  `GRANT ALL ON TABLE public.users TO authenticated`,
];

async function runSqlViaRpc(sql: string, key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ sql }),
    });
    if (res.ok) return { ok: true };
    const err = await res.text();
    return { ok: false, error: err };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

async function runSqlViaManagementApi(sql: string, serviceKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!serviceKey) return { ok: false, error: "No service role key" };
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      }
    );
    if (res.ok) return { ok: true };
    const err = await res.text();
    return { ok: false, error: err };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

async function checkTablesExist(): Promise<{ movies: boolean; users: boolean; reviews: boolean }> {
  const results = { movies: false, users: false, reviews: false };
  const tables = ["movies", "users", "reviews"] as const;

  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (res.ok) {
        results[table] = true;
      }
    } catch {}
  }
  return results;
}

async function runSqlViaServiceClient(sql: string, serviceKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = createClient(SUPABASE_URL, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Try via pg endpoint (available with service key)
    const res = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    if (res.ok) return { ok: true };
    const err = await res.text();
    return { ok: false, error: err };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

export async function POST(request: Request) {
  // Only allow admin
  const cookieStore = await cookies();
  const devSession = cookieStore.get("brutal_dev_session")?.value;
  const devEmail = cookieStore.get("brutal_user_email")?.value;
  const adminEmail = (process.env.ADMIN_EMAIL || "adminflix123@gmail.com").toLowerCase().trim();

  if (devSession !== "authenticated" || !devEmail || devEmail.toLowerCase().trim() !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { serviceRoleKey } = body;

  // Check current status first
  const before = await checkTablesExist();
  if (before.movies && before.users && before.reviews) {
    return NextResponse.json({
      success: true,
      message: "Semua tabel sudah ada! Supabase sudah terkoneksi.",
      tables: before,
      alreadySetup: true,
    });
  }

  const keyToUse = serviceRoleKey || SUPABASE_SERVICE_KEY;

  // Strategy 1: Supabase Management API (needs personal access token or service key)
  if (keyToUse) {
    let allOk = true;
    for (const sql of SETUP_STATEMENTS) {
      const r1 = await runSqlViaManagementApi(sql, keyToUse);
      if (!r1.ok) {
        // Strategy 2: pg/query endpoint
        const r2 = await runSqlViaServiceClient(sql, keyToUse);
        if (!r2.ok) {
          allOk = false;
        }
      }
    }
  }

  // Strategy 3: RPC exec_sql (if function exists in database)
  const combinedSql = SETUP_STATEMENTS.join(";\n");
  await runSqlViaRpc(combinedSql, keyToUse || SUPABASE_ANON_KEY);

  // Re-check after attempts
  const after = await checkTablesExist();

  if (after.movies && after.users && after.reviews) {
    return NextResponse.json({
      success: true,
      message: "Setup berhasil! Semua tabel berhasil dibuat di Supabase. Windows & Mobile sudah tersinkron.",
      tables: after,
    });
  }

  // Return info and instructions
  return NextResponse.json({
    success: false,
    message: !keyToUse
      ? "Diperlukan Service Role Key. Masukkan key dari Supabase Dashboard → Project Settings → API."
      : "Setup belum berhasil dengan key yang diberikan. Pastikan key adalah 'service_role', bukan 'anon'.",
    tables: after,
    needsServiceKey: !keyToUse,
  });
}

export async function GET() {
  const before = await checkTablesExist();
  return NextResponse.json({
    tables: before,
    allReady: before.movies && before.users && before.reviews,
  });
}
