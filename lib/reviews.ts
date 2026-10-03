import fs from "fs";
import path from "path";

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

function ensureFileExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getAllReviews(): Review[] {
  try {
    ensureFileExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading reviews file:", error);
    return [];
  }
}

export function getReviewsByMovieId(movieId: number | string): Review[] {
  const numericId = Number(movieId);
  const all = getAllReviews();
  return all.filter((r) => r.movieId === numericId);
}

export function createReview(data: {
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  author?: string;
  rating: number;
  comment: string;
  status?: "approved" | "pending" | "flagged";
}): Review {
  ensureFileExists();
  const all = getAllReviews();

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    movieId: Number(data.movieId),
    movieTitle: data.movieTitle.trim(),
    moviePoster: data.moviePoster?.trim() || "",
    author: data.author?.trim() || "anonymous_critic",
    rating: Number(data.rating) || 5,
    comment: data.comment.trim(),
    status: data.status || "approved", // User reviews are approved by default or pending
    createdAt: new Date().toISOString(),
  };

  all.unshift(newReview);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return newReview;
}

export function updateReviewStatus(
  id: string,
  status: "approved" | "pending" | "flagged"
): Review | null {
  ensureFileExists();
  const all = getAllReviews();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return null;

  all[index].status = status;
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return all[index];
}

export function deleteReview(id: string): boolean {
  ensureFileExists();
  const all = getAllReviews();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;

  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}
