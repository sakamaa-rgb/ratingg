import fs from "fs";
import path from "path";
import { Movie } from "./tmdb";
import { createClient } from "@supabase/supabase-js";

export interface AdminMovie extends Movie {
  created_by: string;
  created_at: string;
  is_admin_curated?: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admin-movies.json");

let inMemoryMovies: AdminMovie[] = [];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("placeholder-project")) {
    return null;
  }
  return createClient(url, key);
}

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch {
    // Read-only filesystem safe
  }
}

function getLocalMovies(): AdminMovie[] {
  try {
    ensureFileExists();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const disk = JSON.parse(raw);
      if (Array.isArray(disk)) return disk;
    }
  } catch {
    // Read-only filesystem
  }
  return inMemoryMovies;
}

function saveLocalMovies(all: AdminMovie[]) {
  inMemoryMovies = all;
  try {
    ensureFileExists();
    fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch {
    // Read-only filesystem safe
  }
}

export function extractYoutubeId(input?: string): string {
  if (!input) return "Way9Dexny3w";
  const trimmed = input.trim();

  // If it's a direct video path or url (mp4/webm), return as-is
  if (
    trimmed.includes(".mp4") ||
    trimmed.includes(".webm") ||
    trimmed.startsWith("/uploads/")
  ) {
    return trimmed;
  }

  // If it's a YouTube URL, extract the ID
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match && match[1]) {
    return match[1];
  }

  return trimmed;
}

export async function getAllAdminMoviesAsync(): Promise<AdminMovie[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: AdminMovie[] = data.map((row) => ({
          id: Number(row.id),
          title: row.title,
          tagline: row.tagline || "",
          overview: row.overview || "",
          poster_path: row.poster_path,
          backdrop_path: row.backdrop_path,
          release_date: row.release_date || new Date().toISOString().split("T")[0],
          vote_average: Number(row.vote_average) || 7.5,
          vote_count: Number(row.vote_count) || 1,
          category: (row.category as any) || "popular",
          runtime: Number(row.runtime) || 120,
          genres: row.genres || [{ id: 18, name: "Drama" }],
          youtube_video_id: row.youtube_video_id || "Way9Dexny3w",
          created_by: row.created_by || "admin",
          created_at: row.created_at || new Date().toISOString(),
          is_admin_curated: true,
        }));
        inMemoryMovies = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn("Supabase fetch movies error, falling back:", err);
    }
  }

  return getLocalMovies();
}

export function getAllAdminMovies(): AdminMovie[] {
  return inMemoryMovies.length > 0 ? inMemoryMovies : getLocalMovies();
}

export async function getAdminMoviesByAuthor(authorEmail: string): Promise<AdminMovie[]> {
  const all = await getAllAdminMoviesAsync();
  return all.filter(
    (m) => m.created_by?.toLowerCase() === authorEmail.toLowerCase()
  );
}

export async function getAdminMovieById(id: number | string): Promise<AdminMovie | null> {
  const numericId = Number(id);
  const all = await getAllAdminMoviesAsync();
  return all.find((m) => m.id === numericId) || null;
}

export async function createAdminMovie(
  data: {
    title: string;
    tagline?: string;
    overview: string;
    poster_path: string;
    backdrop_path?: string;
    release_date: string;
    vote_average: number;
    vote_count?: number;
    category?: "popular" | "now_playing" | "top_rated" | "upcoming";
    genres?: { id: number; name: string }[];
    runtime?: number;
    youtube_video_id?: string;
  },
  adminEmail: string
): Promise<AdminMovie> {
  const cleanVideo = extractYoutubeId(data.youtube_video_id);

  const newMovie: AdminMovie = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: data.title.trim(),
    tagline: data.tagline?.trim() || "",
    overview: data.overview.trim(),
    poster_path:
      data.poster_path.trim() ||
      "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop_path: data.backdrop_path?.trim(),
    release_date: data.release_date || new Date().toISOString().split("T")[0],
    vote_average: Number(data.vote_average) || 7.5,
    vote_count: data.vote_count || 1,
    category: data.category || "popular",
    runtime: Number(data.runtime) || 120,
    genres: data.genres || [{ id: 18, name: "Drama" }],
    youtube_video_id: cleanVideo,
    created_by: adminEmail.trim(),
    created_at: new Date().toISOString(),
    is_admin_curated: true,
  };

  // 1. Sync to Supabase Cloud Database (Windows & Mobile sync)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("movies").insert([
        {
          id: newMovie.id,
          title: newMovie.title,
          tagline: newMovie.tagline,
          overview: newMovie.overview,
          poster_path: newMovie.poster_path,
          backdrop_path: newMovie.backdrop_path,
          release_date: newMovie.release_date,
          vote_average: newMovie.vote_average,
          vote_count: newMovie.vote_count,
          category: newMovie.category,
          runtime: newMovie.runtime,
          genres: newMovie.genres,
          youtube_video_id: newMovie.youtube_video_id,
          created_by: newMovie.created_by,
          created_at: newMovie.created_at,
        },
      ]);
    } catch (err) {
      console.warn("Supabase movie insert failed, saving locally:", err);
    }
  }

  const all = getLocalMovies();
  const updated = [newMovie, ...all];
  saveLocalMovies(updated);
  return newMovie;
}

export async function updateAdminMovie(
  id: number | string,
  data: Partial<AdminMovie>,
  adminEmail: string
): Promise<{ success: boolean; movie?: AdminMovie; error?: string }> {
  const numericId = Number(id);
  const all = await getAllAdminMoviesAsync();
  const index = all.findIndex((m) => m.id === numericId);

  if (index === -1) {
    return { success: false, error: "Movie not found." };
  }

  const movie = all[index];
  if (
    movie.created_by &&
    movie.created_by.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    return {
      success: false,
      error: "Unauthorized: You can only edit movies created by your admin account.",
    };
  }

  const cleanVideo = data.youtube_video_id
    ? extractYoutubeId(data.youtube_video_id)
    : movie.youtube_video_id;

  const updated: AdminMovie = {
    ...movie,
    ...data,
    youtube_video_id: cleanVideo,
    id: numericId,
    created_by: movie.created_by,
    created_at: movie.created_at,
    is_admin_curated: true,
  };

  // Sync to Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("movies")
        .update({
          title: updated.title,
          tagline: updated.tagline,
          overview: updated.overview,
          poster_path: updated.poster_path,
          backdrop_path: updated.backdrop_path,
          release_date: updated.release_date,
          vote_average: updated.vote_average,
          vote_count: updated.vote_count,
          category: updated.category,
          runtime: updated.runtime,
          genres: updated.genres,
          youtube_video_id: updated.youtube_video_id,
        })
        .eq("id", numericId);
    } catch (err) {
      console.warn("Supabase movie update failed:", err);
    }
  }

  all[index] = updated;
  saveLocalMovies(all);
  return { success: true, movie: updated };
}

export async function deleteAdminMovie(
  id: number | string,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  const numericId = Number(id);
  const all = await getAllAdminMoviesAsync();
  const index = all.findIndex((m) => m.id === numericId);

  if (index === -1) {
    return { success: false, error: "Movie not found." };
  }

  const movie = all[index];
  if (
    movie.created_by &&
    movie.created_by.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    return {
      success: false,
      error: "Unauthorized: You can only delete movies created by your admin account.",
    };
  }

  // Delete from Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("movies").delete().eq("id", numericId);
    } catch (err) {
      console.warn("Supabase movie delete failed:", err);
    }
  }

  all.splice(index, 1);
  saveLocalMovies(all);
  return { success: true };
}
