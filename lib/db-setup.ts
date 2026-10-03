/**
 * lib/db-setup.ts
 * Auto-creates Supabase tables on first run using Service Role Key.
 * Falls back gracefully if key is not present.
 */
import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl, getSanitizedSupabaseKey } from "@/utils/supabase/url";

let setupDone = false;
let setupAttempted = false;

const CREATE_MOVIES_SQL = `
CREATE TABLE IF NOT EXISTS public.movies (
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
)
`;

const CREATE_REVIEWS_SQL = `
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  movie_id BIGINT NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  author TEXT NOT NULL DEFAULT 'anonymous',
  rating NUMERIC NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
)
`;

const CREATE_USERS_SQL = `
CREATE TABLE IF NOT EXISTS public.users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
)
`;

function getServiceClient() {
  const url = getSanitizedSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Attempt to auto-setup all required Supabase tables.
 * Safe to call multiple times — only runs once per server lifecycle.
 */
export async function ensureSupabaseTables(): Promise<{
  attempted: boolean;
  success: boolean;
  tables: { movies: boolean; users: boolean; reviews: boolean };
}> {
  if (setupDone) {
    return { attempted: true, success: true, tables: { movies: true, users: true, reviews: true } };
  }

  const anonUrl = getSanitizedSupabaseUrl();
  const anonKey = getSanitizedSupabaseKey();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!anonUrl || !anonKey) {
    return { attempted: false, success: false, tables: { movies: false, users: false, reviews: false } };
  }

  // First check if tables already exist with anon key
  const anonClient = createClient(anonUrl, anonKey);
  const moviesExist = await tableExists(anonClient, "movies");
  const usersExist = await tableExists(anonClient, "users");
  const reviewsExist = await tableExists(anonClient, "reviews");

  if (moviesExist && usersExist && reviewsExist) {
    setupDone = true;
    return { attempted: true, success: true, tables: { movies: true, users: true, reviews: true } };
  }

  // Try to create tables using service role key
  if (!serviceKey) {
    setupAttempted = true;
    return {
      attempted: true,
      success: false,
      tables: { movies: moviesExist, users: usersExist, reviews: reviewsExist },
    };
  }

  const serviceClient = createClient(anonUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results = { movies: moviesExist, users: usersExist, reviews: reviewsExist };

  // Create tables using service role
  if (!moviesExist) {
    try {
      const { error } = await serviceClient.rpc("exec_ddl", { sql: CREATE_MOVIES_SQL }).single();
      if (!error) results.movies = true;
    } catch {}
  }

  if (!usersExist) {
    try {
      const { error } = await serviceClient.rpc("exec_ddl", { sql: CREATE_USERS_SQL }).single();
      if (!error) results.users = true;
    } catch {}
  }

  if (!reviewsExist) {
    try {
      const { error } = await serviceClient.rpc("exec_ddl", { sql: CREATE_REVIEWS_SQL }).single();
      if (!error) results.reviews = true;
    } catch {}
  }

  if (results.movies && results.users && results.reviews) {
    setupDone = true;
  }

  setupAttempted = true;
  return {
    attempted: true,
    success: results.movies && results.users && results.reviews,
    tables: results,
  };
}
