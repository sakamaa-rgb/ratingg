import { getAllAdminMovies, getAdminMovieById } from "./admin-movies";

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
  const apiKey = process.env.TMDB_API_KEY;

  const adminMovies = getAllAdminMovies();
  let results: Movie[] = [...adminMovies, ...LEGAL_FALLBACK_MOVIES];

  if (apiKey && apiKey !== "your_tmdb_api_key_here") {
    try {
      let endpoint = "https://api.themoviedb.org/3/trending/movie/week";
      if (query) {
        endpoint = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`;
      } else if (category === "popular") {
        endpoint = "https://api.themoviedb.org/3/movie/popular";
      } else if (category === "now_playing") {
        endpoint = "https://api.themoviedb.org/3/movie/now_playing";
      } else if (category === "top_rated") {
        endpoint = "https://api.themoviedb.org/3/movie/top_rated";
      } else if (category === "upcoming") {
        endpoint = "https://api.themoviedb.org/3/movie/upcoming";
      }

      const res = await fetch(`${endpoint}?api_key=${apiKey}`, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const tmdbResults = data.results.map((m: any) => ({
          id: m.id,
          title: m.title,
          overview: m.overview,
          poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w780${m.poster_path}` : "/placeholder.png",
          backdrop_path: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : undefined,
          release_date: m.release_date || "2024-01-01",
          vote_average: Number(m.vote_average ? m.vote_average.toFixed(1) : "7.5"),
          vote_count: m.vote_count || 100,
          category: (category as any) || "popular",
        }));
        results = [...adminMovies, ...tmdbResults];
      }
    } catch (e) {
      console.warn("TMDB fetch fallback active:", e);
    }
  }

  // Apply filtering
  if (category) {
    const matched = results.filter((m) => m.category === category);
    if (matched.length > 0) results = matched;
  }

  if (query) {
    results = results.filter((m) =>
      m.title.toLowerCase().includes(query) ||
      m.overview.toLowerCase().includes(query)
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
  const adminMovies = getAllAdminMovies();
  const all = [...adminMovies, ...LEGAL_FALLBACK_MOVIES];

  return {
    popular: all.filter((m) => m.category === "popular"),
    nowPlaying: all.filter((m) => m.category === "now_playing"),
    topRated: all.filter((m) => m.category === "top_rated" || m.vote_average >= 8.0),
    upcoming: all.filter((m) => m.category === "upcoming"),
  };
}

export async function getMovieDetails(id: number | string): Promise<Movie | null> {
  const numericId = Number(id);
  const adminMovie = getAdminMovieById(numericId);
  if (adminMovie) {
    return adminMovie;
  }

  const fallback = LEGAL_FALLBACK_MOVIES.find((m) => m.id === numericId);
  if (fallback) return fallback;

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
      vote_average: Number(movieData.vote_average.toFixed(1)),
      vote_count: movieData.vote_count,
      genres: movieData.genres,
      runtime: movieData.runtime,
      youtube_video_id: youtubeVideoId,
    };
  } catch (err) {
    console.error("Error fetching movie details from TMDB:", err);
    return null;
  }
}
