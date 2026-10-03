import fs from "fs";
import path from "path";
import { Movie } from "./tmdb";

export interface AdminMovie extends Movie {
  created_by: string;
  created_at: string;
  is_admin_curated?: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admin-movies.json");

function ensureFileExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getAllAdminMovies(): AdminMovie[] {
  try {
    ensureFileExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const movies: AdminMovie[] = JSON.parse(raw);
    return movies.map((m) => ({
      ...m,
      is_admin_curated: true,
    }));
  } catch (error) {
    console.error("Error reading admin movies file:", error);
    return [];
  }
}

export function getAdminMoviesByAuthor(authorEmail: string): AdminMovie[] {
  const all = getAllAdminMovies();
  return all.filter(
    (m) => m.created_by?.toLowerCase() === authorEmail.toLowerCase()
  );
}

export function getAdminMovieById(id: number | string): AdminMovie | null {
  const numericId = Number(id);
  const all = getAllAdminMovies();
  return all.find((m) => m.id === numericId) || null;
}

export function createAdminMovie(
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
): AdminMovie {
  ensureFileExists();
  const all = getAllAdminMovies();
  
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
    youtube_video_id: data.youtube_video_id?.trim() || "Way9Dexny3w",
    created_by: adminEmail.trim(),
    created_at: new Date().toISOString(),
    is_admin_curated: true,
  };

  all.unshift(newMovie);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return newMovie;
}

export function updateAdminMovie(
  id: number | string,
  data: Partial<AdminMovie>,
  adminEmail: string
): { success: boolean; movie?: AdminMovie; error?: string } {
  ensureFileExists();
  const numericId = Number(id);
  const all = getAllAdminMovies();
  const index = all.findIndex((m) => m.id === numericId);

  if (index === -1) {
    return { success: false, error: "Movie not found." };
  }

  const movie = all[index];
  // Verify ownership: only the admin who created it can edit it
  if (
    movie.created_by &&
    movie.created_by.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    return {
      success: false,
      error: "Unauthorized: You can only edit movies created by your admin account.",
    };
  }

  const updated: AdminMovie = {
    ...movie,
    ...data,
    id: numericId, // Immutable
    created_by: movie.created_by, // Immutable
    created_at: movie.created_at, // Immutable
    is_admin_curated: true,
  };

  all[index] = updated;
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return { success: true, movie: updated };
}

export function deleteAdminMovie(
  id: number | string,
  adminEmail: string
): { success: boolean; error?: string } {
  ensureFileExists();
  const numericId = Number(id);
  const all = getAllAdminMovies();
  const index = all.findIndex((m) => m.id === numericId);

  if (index === -1) {
    return { success: false, error: "Movie not found." };
  }

  const movie = all[index];
  // Verify ownership: only the admin who created it can delete it
  if (
    movie.created_by &&
    movie.created_by.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    return {
      success: false,
      error: "Unauthorized: You can only delete movies created by your admin account.",
    };
  }

  all.splice(index, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return { success: true };
}
