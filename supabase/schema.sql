-- =========================================================
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR (supabase.com)
-- TO CONNECT WINDOWS & MOBILE (CROSS-DEVICE SYNC)
-- =========================================================

-- 1. TABLE: REVIEWS (Komentar & Ulasan Lintas Device)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  movie_id BIGINT NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  author TEXT NOT NULL,
  rating NUMERIC NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLE: MOVIES (Katalog Film Admin Lintas Device)
CREATE TABLE IF NOT EXISTS public.movies (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT,
  overview TEXT NOT NULL,
  poster_path TEXT NOT NULL,
  backdrop_path TEXT,
  release_date TEXT,
  vote_average NUMERIC DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'popular',
  runtime INTEGER DEFAULT 120,
  genres JSONB DEFAULT '[]'::jsonb,
  youtube_video_id TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE: USERS (Penyimpanan Akun Lintas Device Windows & Mobile)
CREATE TABLE IF NOT EXISTS public.users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. NON-RESTRICTIVE ACCESS (Direct Cloud Sync for Web & Mobile)
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.reviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.movies TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

