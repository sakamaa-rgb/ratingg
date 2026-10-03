import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export interface Review {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  author: string;
  rating: number;
  comment: string;
  status: "approved" | "pending" | "flagged";
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "reviews.json");

let inMemoryReviews: Review[] = [];

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

function getLocalReviews(): Review[] {
  try {
    ensureFileExists();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const disk = JSON.parse(raw);
      if (Array.isArray(disk) && disk.length > 0) return disk;
    }
  } catch {
    // Read-only
  }
  return inMemoryReviews;
}

function saveLocalReviews(all: Review[]) {
  inMemoryReviews = all;
  try {
    ensureFileExists();
    fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch {
    // Safe for Vercel
  }
}

export async function getAllReviews(): Promise<Review[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: Review[] = data.map((row) => ({
          id: String(row.id),
          movieId: Number(row.movie_id),
          movieTitle: row.movie_title || "",
          moviePoster: row.movie_poster || "",
          author: row.author || "anonymous",
          rating: Number(row.rating) || 5,
          comment: row.comment || "",
          status: (row.status as any) || "approved",
          createdAt: row.created_at || new Date().toISOString(),
        }));
        inMemoryReviews = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn("Supabase fetch reviews error, using local fallback:", err);
    }
  }

  return getLocalReviews();
}

export async function getReviewsByMovieId(
  movieId: number | string
): Promise<Review[]> {
  const numericId = Number(movieId);
  const all = await getAllReviews();
  return all.filter((r) => r.movieId === numericId);
}

export async function createReview(data: {
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  author?: string;
  rating: number;
  comment: string;
  status?: "approved" | "pending" | "flagged";
}): Promise<Review> {
  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    movieId: Number(data.movieId),
    movieTitle: data.movieTitle.trim(),
    moviePoster: data.moviePoster?.trim() || "",
    author: data.author?.trim() || "anonymous_critic",
    rating: Number(data.rating) || 5,
    comment: data.comment.trim(),
    status: data.status || "approved",
    createdAt: new Date().toISOString(),
  };

  // 1. Sync to Supabase Cloud Database (Windows & Mobile sync)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("reviews").insert([
        {
          id: newReview.id,
          movie_id: newReview.movieId,
          movie_title: newReview.movieTitle,
          movie_poster: newReview.moviePoster,
          author: newReview.author,
          rating: newReview.rating,
          comment: newReview.comment,
          status: newReview.status,
          created_at: newReview.createdAt,
        },
      ]);
    } catch (err) {
      console.warn("Supabase review insert failed, cached locally:", err);
    }
  }

  // 2. Cache locally
  const current = getLocalReviews();
  const updated = [newReview, ...current];
  saveLocalReviews(updated);

  return newReview;
}

export async function updateReviewStatus(
  id: string,
  status: "approved" | "pending" | "flagged"
): Promise<Review | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("reviews").update({ status }).eq("id", id);
    } catch (err) {
      console.warn("Supabase review update failed:", err);
    }
  }

  const all = getLocalReviews();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return null;

  all[index].status = status;
  saveLocalReviews(all);
  return all[index];
}

export async function deleteReview(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("reviews").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase review delete failed:", err);
    }
  }

  const all = getLocalReviews();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;

  saveLocalReviews(filtered);
  return true;
}
