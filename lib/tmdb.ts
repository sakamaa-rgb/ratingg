import { getAllAdminMoviesAsync, getAdminMovieById } from "./admin-movies";

export interface Movie {
  id: number;
  title: string;
  tagline?: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  category?: "popular" | "now_playing" | "top_rated" | "upcoming";
  genres?: { id: number; name: string }[];
  runtime?: number;
  trailer_url?: string;
  youtube_video_id?: string;
  created_by?: string;
  created_at?: string;
  is_admin_curated?: boolean;
}

// 100% Real catalog - all dummy fallback movies removed
export const LEGAL_FALLBACK_MOVIES: Movie[] = [];

export async function getTrendingMovies(filter?: { category?: string; query?: string }): Promise<Movie[]> {
  const category = filter?.category;
  const query = filter?.query?.toLowerCase().trim();

  // ONLY show movies explicitly created by Admin (Cross-device synced via Supabase)
  // No random auto-injected dummy 20 TMDB movies
  const adminMovies = await getAllAdminMoviesAsync();
  let results: Movie[] = [...adminMovies];

  // Apply category filtering
  if (category) {
    results = results.filter((m) => m.category === category);
  }

  // Apply search query filtering
  if (query) {
    results = results.filter((m) =>
      m.title.toLowerCase().includes(query) ||
      m.overview.toLowerCase().includes(query) ||
      (m.tagline && m.tagline.toLowerCase().includes(query))
    );
  }

  return results;
}

export async function getCategorizedMovies(): Promise<{
  popular: Movie[];
  nowPlaying: Movie[];
  topRated: Movie[];
  upcoming: Movie[];
}> {
  const adminMovies = await getAllAdminMoviesAsync();
  const all = [...adminMovies];

  return {
    popular: all.filter((m) => m.category === "popular"),
    nowPlaying: all.filter((m) => m.category === "now_playing"),
    topRated: all.filter((m) => m.category === "top_rated" || m.vote_average >= 8.0),
    upcoming: all.filter((m) => m.category === "upcoming"),
  };
}

export async function getMovieDetails(id: number | string): Promise<Movie | null> {
  const numericId = Number(id);
  const adminMovie = await getAdminMovieById(numericId);
  if (adminMovie) {
    return adminMovie;
  }

  const fallback = LEGAL_FALLBACK_MOVIES.find((m) => m.id === numericId);
  if (fallback) return fallback;

  // Fallback lookup from TMDB if not in admin movies (e.g. for legacy links)
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === "your_tmdb_api_key_here") {
    return null;
  }

  try {
    const [movieRes, videosRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`, { next: { revalidate: 3600 } }),
      fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}`, { next: { revalidate: 3600 } })
    ]);

    if (!movieRes.ok) return null;
    const movieData = await movieRes.json();
    let youtubeVideoId = undefined;

    if (videosRes.ok) {
      const videosData = await videosRes.json();
      const officialTrailer = videosData.results?.find(
        (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
      );
      if (officialTrailer) {
        youtubeVideoId = officialTrailer.key;
      }
    }

    return {
      id: movieData.id,
      title: movieData.title,
      tagline: movieData.tagline,
      overview: movieData.overview,
      poster_path: movieData.poster_path ? `https://image.tmdb.org/t/p/w780${movieData.poster_path}` : "/placeholder.png",
      backdrop_path: movieData.backdrop_path ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}` : undefined,
      release_date: movieData.release_date,
      vote_average: Number(movieData.vote_average ? movieData.vote_average.toFixed(1) : "7.5"),
      vote_count: movieData.vote_count,
      genres: movieData.genres,
      runtime: movieData.runtime,
      youtube_video_id: youtubeVideoId,
    };
  } catch (err) {
    console.error("TMDB details fetch error:", err);
    return null;
  }
}
