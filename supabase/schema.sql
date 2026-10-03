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

-- 3. ENABLE ROW LEVEL SECURITY & OPEN PERMISSIONS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read reviews" ON public.reviews;
CREATE POLICY "Allow public read reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert reviews" ON public.reviews;
CREATE POLICY "Allow public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update reviews" ON public.reviews;
CREATE POLICY "Allow public update reviews" ON public.reviews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete reviews" ON public.reviews;
CREATE POLICY "Allow public delete reviews" ON public.reviews FOR DELETE USING (true);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read movies" ON public.movies;
CREATE POLICY "Allow public read movies" ON public.movies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert movies" ON public.movies;
CREATE POLICY "Allow public insert movies" ON public.movies FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update movies" ON public.movies;
CREATE POLICY "Allow public update movies" ON public.movies FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete movies" ON public.movies;
CREATE POLICY "Allow public delete movies" ON public.movies FOR DELETE USING (true);
