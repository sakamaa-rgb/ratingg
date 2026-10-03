"use client";

import React, { useState, useEffect } from "react";
import ReviewForm from "@/components/ReviewForm";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface MovieReviewsSectionProps {
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
}

export default function MovieReviewsSection({
  movieId,
  movieTitle,
  moviePoster = "",
}: MovieReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"scroll" | "carousel">("scroll");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Fetch real reviews for this specific movie
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    fetch(`/api/reviews?movieId=${movieId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        if (data.success && Array.isArray(data.reviews)) {
          const mapped: ReviewItem[] = data.reviews.map((r: any) => ({
            id: r.id,
            author: r.author,
            rating: r.rating,
            text: r.comment,
            createdAt: r.createdAt ? r.createdAt.split("T")[0] : "2026-10-03",
          }));
          setReviews(mapped);
        } else {
          setReviews([]);
        }
      })
      .catch(() => {
        if (isCurrent) setReviews([]);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [movieId]);

  const handleReviewAdded = (newReview: ReviewItem) => {
    setReviews((prev) => [newReview, ...prev]);
    setCurrentSlideIndex(0);
  };

  const nextSlide = () => {
    if (reviews.length === 0) return;
    if (currentSlideIndex < reviews.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      setCurrentSlideIndex(0);
    }
  };

  const prevSlide = () => {
    if (reviews.length === 0) return;
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    } else {
      setCurrentSlideIndex(reviews.length - 1);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6 font-mono pt-4 border-t-4 border-black">
      {/* 1. SECTION TITLE & STATS STRIP */}
      <div className="border-4 border-black bg-white p-4 sm:p-5 shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest mb-1">
            CRITICAL DISCOURSE & AUDIENCE FEED
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            ULASAN & PENILAIAN KOMUNITAS
          </h2>
          <p className="text-xs text-neutral-600 font-bold uppercase mt-0.5">
            Film: {movieTitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {avgRating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-brutal-yellow font-black text-xs shadow-brutal-xs">
              <Star className="w-4 h-4 fill-black text-black" />
              <span>RATA-RATA: {avgRating} / 5.0</span>
            </div>
          )}

          <div className="px-3 py-1.5 border-2 border-black bg-black text-white font-black text-xs shadow-brutal-xs">
            {reviews.length} ULASAN REAL
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN BALANCED LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: REVIEW INPUT FORM (5 COLS, STICKY) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <ReviewForm
            movieId={movieId}
            movieTitle={movieTitle}
            moviePoster={moviePoster}
            onReviewAdded={handleReviewAdded}
          />
        </div>

        {/* RIGHT COLUMN: COMMUNITY REVIEWS FEED (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* FEED HEADER & VIEW TOGGLES */}
          <div className="border-4 border-black bg-black text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brutal-yellow" />
              <h3 className="text-sm font-black uppercase tracking-wider">
                FEED KOMENTAR PUBLIK ({reviews.length})
              </h3>
            </div>

            {/* VIEW SWITCHER IF REVIEWS > 1 */}
            {reviews.length >= 2 && (
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("scroll")}
                  className={`px-2 py-0.5 uppercase transition-colors cursor-pointer ${
                    viewMode === "scroll"
                      ? "bg-brutal-yellow text-black font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Daftar List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("carousel")}
                  className={`px-2 py-0.5 uppercase transition-colors cursor-pointer ${
                    viewMode === "carousel"
                      ? "bg-brutal-yellow text-black font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Slider Carousel
                </button>
              </div>
            )}
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="border-4 border-black bg-white p-12 text-center shadow-brutal">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-black" />
              <p className="text-xs font-bold uppercase text-neutral-600">
                MEMUAT ULASAN DARI DATABASE...
              </p>
            </div>
          ) : reviews.length === 0 ? (
            /* CLEAN EMPTY STATE (NO DUMMY) */
            <div className="border-4 border-black bg-white p-8 sm:p-12 text-center shadow-brutal space-y-3">
              <div className="w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6 text-black" />
              </div>
              <h4 className="text-lg font-black uppercase">
                BELUM ADA ULASAN UNTUK FILM INI
              </h4>
              <p className="text-xs font-sans text-neutral-600 max-w-md mx-auto leading-relaxed">
                Jadilah yang pertama memberikan penilaian dan ulasan nyata mengenai film ini melalui formulir di samping!
              </p>
            </div>
          ) : viewMode === "scroll" ? (
            /* MODE 1: SCROLLABLE LIST */
            <div className="relative">
              {reviews.length > 2 && (
                <div className="text-[10px] text-neutral-500 uppercase font-bold mb-2 flex justify-between items-center">
                  <span>↕ GULIR KE BAWAH UNTUK MELIHAT SEMUA ({reviews.length}) ULASAN</span>
                  <span className="bg-neutral-200 text-black px-1.5 py-0.5 border border-black">
                    FEED AKTIF
                  </span>
                </div>
              )}

              <div className="relative">
                <div
                  className={`space-y-4 pr-1.5 ${
                    reviews.length > 2 ? "max-h-[560px] overflow-y-auto" : ""
                  }`}
                >
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="border-4 border-black bg-white p-5 shadow-brutal space-y-3 hover:translate-x-[-1px] transition-transform"
                    >
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-black text-white font-black flex items-center justify-center text-xs">
                            {rev.author[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="font-black text-xs uppercase text-neutral-900">
                            @{rev.author}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-brutal-yellow border border-black px-2 py-0.5 text-xs font-black shadow-brutal-xs">
                          <Star className="w-3.5 h-3.5 fill-black text-black" />
                          <span>{rev.rating}.0 / 5.0</span>
                        </div>
                      </div>

                      <p className="font-sans text-sm sm:text-base text-neutral-900 leading-relaxed font-normal">
                        "{rev.text}"
                      </p>

                      <div className="text-[10px] text-neutral-500 text-right pt-2 border-t border-dashed border-neutral-300">
                        DITERBITKAN: {rev.createdAt}
                      </div>
                    </div>
                  ))}
                </div>

                {reviews.length > 2 && (
                  <ProgressiveBlur
                    height="70px"
                    position="bottom"
                    className="rounded-none pointer-events-none"
                  />
                )}
              </div>
            </div>
          ) : (
            /* MODE 2: CAROUSEL SLIDER */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-100 border-2 border-black px-4 py-2 text-xs font-bold">
                <span>
                  ULASAN: {currentSlideIndex + 1} DARI {reviews.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous Review"
                    className="w-8 h-8 border-2 border-black bg-white hover:bg-brutal-yellow flex items-center justify-center shadow-brutal-xs active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next Review"
                    className="w-8 h-8 border-2 border-black bg-white hover:bg-brutal-yellow flex items-center justify-center shadow-brutal-xs active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CURRENT ACTIVE REVIEW CARD */}
              {reviews[currentSlideIndex] && (
                <div className="border-4 border-black bg-white p-6 shadow-brutal-lg space-y-4 min-h-[220px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-black text-white font-black flex items-center justify-center text-xs">
                          {reviews[currentSlideIndex].author[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-500 font-bold uppercase">
                            PENGULAS TERVERIFIKASI
                          </div>
                          <span className="font-black text-sm uppercase text-black">
                            @{reviews[currentSlideIndex].author}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-brutal-yellow border-2 border-black px-3 py-1 text-sm font-black shadow-brutal-xs">
                        <Star className="w-4 h-4 fill-black text-black" />
                        <span>{reviews[currentSlideIndex].rating}.0 / 5.0</span>
                      </div>
                    </div>

                    <p className="font-sans text-base text-neutral-900 leading-relaxed font-normal">
                      "{reviews[currentSlideIndex].text}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t-2 border-black text-xs text-neutral-600">
                    <span>TANGGAL: {reviews[currentSlideIndex].createdAt}</span>
                    <div className="flex gap-1">
                      {reviews.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentSlideIndex(i)}
                          className={`w-3.5 h-3.5 border border-black cursor-pointer ${
                            i === currentSlideIndex ? "bg-black" : "bg-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
