"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Movie } from "@/lib/tmdb";
import MovieSliderRow from "./MovieSliderRow";
import { Film, Flame, PlaySquare, Star, Clock } from "lucide-react";

interface ClientCatalogFallbackProps {
  isAdmin: boolean;
}

export default function ClientCatalogFallback({ isAdmin }: ClientCatalogFallbackProps) {
  const [cachedMovies, setCachedMovies] = useState<Movie[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("brutal_admin_movies");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCachedMovies(parsed);

          // Auto-rehydrate server cache in the background
          parsed.forEach((m: any) => {
            fetch("/api/admin/movies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(m),
            }).catch(() => {});
          });
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="p-10 border-4 border-black bg-white text-center shadow-brutal animate-pulse">
        <p className="font-mono text-xs font-bold text-neutral-500 uppercase">MEMUAT KATALOG FILM...</p>
      </div>
    );
  }

  if (cachedMovies.length === 0) {
    return (
      <div className="p-10 sm:p-14 border-4 border-black bg-white text-center shadow-brutal space-y-3">
        <Film className="w-12 h-12 mx-auto mb-2 text-neutral-400" />
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">BELUM ADA FILM DI KATALOG</h3>
        {isAdmin ? (
          <>
            <p className="text-xs text-neutral-600 max-w-md mx-auto">
              Katalog film saat ini kosong. Sebagai Administrator, Anda dapat menambahkan film baru melalui Admin Console.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/movies"
                className="inline-block px-5 py-2.5 border-2 border-black bg-brutal-yellow font-black text-xs uppercase shadow-brutal-sm hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px]"
              >
                + TAMBAHKAN FILM BARU
              </Link>
            </div>
          </>
        ) : (
          <p className="text-xs text-neutral-500 max-w-md mx-auto font-sans font-medium">
            Saat ini belum ada film di katalog. Silakan tunggu kurator menambahkan film terbaru.
          </p>
        )}
      </div>
    );
  }

  const popular = cachedMovies.filter((m) => m.category === "popular");
  const nowPlaying = cachedMovies.filter((m) => m.category === "now_playing");
  const topRated = cachedMovies.filter((m) => m.category === "top_rated" || m.vote_average >= 8.0);
  const upcoming = cachedMovies.filter((m) => m.category === "upcoming");

  return (
    <div className="space-y-12">
      <MovieSliderRow
        title="KATALOG FILM RESMI (REAL REGISTRY)"
        categoryBadge={`TOTAL: ${cachedMovies.length} FILM`}
        icon={<Flame className="w-4 h-4 text-brutal-yellow" />}
        movies={cachedMovies}
        showRankNumbers={cachedMovies.length > 1}
      />

      {popular.length > 0 && cachedMovies.length > 1 && (
        <MovieSliderRow
          title="TRENDING POPULAR FILMS (TERPOPULER)"
          categoryBadge="COMMUNITY TOP PICKS"
          icon={<Flame className="w-4 h-4 text-brutal-yellow" />}
          movies={popular}
          showRankNumbers={true}
        />
      )}

      {nowPlaying.length > 0 && (
        <MovieSliderRow
          title="NOW PLAYING IN THEATERS (SEDANG TAYANG)"
          categoryBadge="LIVE CINEMA CIRCUIT"
          icon={<PlaySquare className="w-4 h-4 text-brutal-cyan" />}
          movies={nowPlaying}
        />
      )}

      {topRated.length > 0 && (
        <MovieSliderRow
          title="ALL-TIME CRITICAL MASTERWORKS (RATING TERTINGGI)"
          categoryBadge="HALL OF FAME"
          icon={<Star className="w-4 h-4 text-brutal-yellow fill-brutal-yellow" />}
          movies={topRated}
          showRankNumbers={true}
        />
      )}

      {upcoming.length > 0 && (
        <MovieSliderRow
          title="UPCOMING RELEASES & OFFICIAL TRAILERS (SEGERA HADIR)"
          categoryBadge="PREMIERE PIPELINE"
          icon={<Clock className="w-4 h-4 text-brutal-green" />}
          movies={upcoming}
        />
      )}
    </div>
  );
}
