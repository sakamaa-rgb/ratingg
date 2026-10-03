"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/lib/tmdb";
import { ChevronLeft, ChevronRight, Star, Play, Flame } from "lucide-react";

interface MovieSliderRowProps {
  title: string;
  categoryBadge?: string;
  icon?: React.ReactNode;
  movies: Movie[];
  showRankNumbers?: boolean;
}

export default function MovieSliderRow({
  title,
  categoryBadge = "VERIFIED FEED",
  icon,
  movies,
  showRankNumbers = false,
}: MovieSliderRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const checkScrollState = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const page = Math.round(scrollLeft / clientWidth);
    setActivePageIndex(page);
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener("resize", checkScrollState);
    return () => window.removeEventListener("resize", checkScrollState);
  }, [movies]);

  const slide = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const { clientWidth } = rowRef.current;
    // Slide by ~5 cards distance (approximately one full container viewport width)
    const scrollAmount = direction === "left" ? -clientWidth : clientWidth;

    rowRef.current.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });

    setTimeout(checkScrollState, 400);
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-3 font-mono select-none">
      {/* ROW HEADER & NETFLIX-STYLE ARROW CONTROLS */}
      <div className="flex items-end justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs">
              {icon}
            </div>
          )}
          <div>
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none">
              {categoryBadge}
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {/* BRUTALIST SLIDE NAVIGATION CONTROLS */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => slide("left")}
            disabled={!canScrollLeft}
            aria-label="Previous 5 films"
            className="w-9 h-9 border-2 border-black bg-white hover:bg-brutal-yellow disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => slide("right")}
            disabled={!canScrollRight}
            aria-label="Next 5 films"
            className="w-9 h-9 border-2 border-black bg-white hover:bg-brutal-yellow disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL NETFLIX-STYLE 5-FILM ROW CONTAINER */}
      <div className="relative group">
        <div
          ref={rowRef}
          onScroll={checkScrollState}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-3 px-1 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie, index) => {
            const fiveStarScore = (movie.vote_average / 2).toFixed(1);
            const isSingle = movies.length === 1;

            return (
              <div
                key={movie.id}
                className={`snap-start shrink-0 flex flex-col ${
                  isSingle
                    ? "w-full max-w-[280px] sm:max-w-xs"
                    : "w-[calc(75%-8px)] xs:w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)]"
                }`}
              >
                <div className="border-4 border-black bg-white shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all flex flex-col h-full group/card relative">
                  
                  {/* TOP RANK BADGE FOR TOP RATED / POPULAR */}
                  {showRankNumbers && (
                    <div className="absolute top-2 left-2 z-20 bg-black text-white border-2 border-white px-2 py-0.5 font-mono font-black text-xs">
                      #{index + 1}
                    </div>
                  )}

                  {/* POSTER WRAPPER */}
                  <div className="relative aspect-[2/3] w-full border-b-4 border-black overflow-hidden bg-neutral-900">
                    <Image
                      src={movie.poster_path}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    />

                    {/* TMDB RATING OVERLAY */}
                    <div className="absolute top-2 right-2 bg-black text-white border-2 border-black px-2 py-0.5 text-xs font-black flex items-center gap-1 shadow-brutal-sm">
                      <Star className="w-3.5 h-3.5 text-brutal-yellow fill-brutal-yellow" />
                      <span>{movie.vote_average}</span>
                    </div>

                    {/* YEAR BADGE */}
                    <div className="absolute bottom-2 left-2 bg-white text-black border-2 border-black px-1.5 py-0.5 text-[10px] font-black uppercase">
                      {movie.release_date.substring(0, 4)}
                    </div>

                    {/* ADMIN CURATED BADGE */}
                    {movie.is_admin_curated && (
                      <div className="absolute bottom-2 right-2 bg-brutal-yellow text-black border-2 border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                        CURATED
                      </div>
                    )}
                  </div>

                  {/* CARD BODY WITH METRICS */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight line-clamp-1 group-hover/card:text-brutal-blue transition-colors">
                        {movie.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[11px] font-black text-neutral-800">
                          SCORE: {fiveStarScore} / 5.0
                        </span>
                        <span className="text-[10px] text-amber-500">★★★★★</span>
                      </div>
                    </div>

                    {/* DIRECT ACTION BUTTON */}
                    <Link
                      href={`/movies/${movie.id}`}
                      className="w-full py-1.5 px-2 border-2 border-black bg-brutal-yellow text-black font-mono font-black text-[11px] uppercase flex items-center justify-center gap-1 hover:bg-yellow-400 active:translate-y-0.5 shadow-brutal-sm"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>RATE & TRAILER</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
