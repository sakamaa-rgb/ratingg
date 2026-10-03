import { getMovieDetails } from "@/lib/tmdb";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import MovieReviewsSection from "@/components/MovieReviewsSection";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Play,
  ShieldCheck,
  Star,
  Clapperboard,
  Film,
  Video,
  User,
  Sparkles,
} from "lucide-react";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params;
  const movie = await getMovieDetails(id);

  if (!movie) {
    notFound();
  }

  const isMp4 =
    movie.youtube_video_id?.includes(".mp4") ||
    movie.youtube_video_id?.startsWith("/uploads/");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 font-mono">
      {/* 1. TOP BREADCRUMB & REGISTRY STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-black pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase px-4 py-2 border-2 border-black bg-white hover:bg-neutral-100 shadow-brutal-sm active:translate-y-0.5 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>KEMBALI KE KATALOG</span>
        </Link>

        <div className="flex items-center gap-2.5 text-xs font-bold">
          <span className="bg-neutral-100 border border-black px-2 py-1 text-[11px]">
            ID: #{movie.id}
          </span>
          <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-brutal-green" />
            <span>LEGAL SOURCE VERIFIED</span>
          </div>
        </div>
      </div>

      {/* 2. HERO PRESENTATION (POSTER & FILM DETAILS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* POSTER CARD (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border-4 border-black bg-white p-3 shadow-brutal-lg">
            <div className="relative aspect-[2/3] w-full border-2 border-black overflow-hidden bg-neutral-900">
              <Image
                src={movie.poster_path}
                alt={movie.title}
                fill
                priority
                className="object-cover"
                unoptimized={movie.poster_path?.startsWith("/uploads/")}
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute top-2 left-2 bg-black text-white border border-white px-2 py-0.5 text-[10px] font-black uppercase">
                {movie.category?.toUpperCase() || "CATALOG"}
              </div>
            </div>

            {/* METRICS UNDER POSTER */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-bold">
              <div className="p-2 border-2 border-black bg-brutal-yellow shadow-brutal-xs">
                <div className="text-[10px] text-neutral-800 uppercase font-black">
                  SKOR RATING
                </div>
                <div className="text-xl font-black text-black mt-0.5 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-black" />
                  <span>{movie.vote_average}</span>
                </div>
              </div>

              <div className="p-2 border-2 border-black bg-neutral-100 shadow-brutal-xs">
                <div className="text-[10px] text-neutral-600 uppercase font-bold">
                  TOTAL SUARA
                </div>
                <div className="text-xl font-black text-black mt-0.5">
                  {movie.vote_count.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* METADATA & SYNOPSIS (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-brutal-lg space-y-5">
            {/* CATEGORY & GENRE TAGS */}
            <div className="flex flex-wrap items-center gap-2">
              {movie.is_admin_curated && (
                <span className="px-2.5 py-1 border-2 border-black text-xs font-black uppercase bg-brutal-yellow text-black shadow-brutal-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>CURATED BY ADMIN</span>
                </span>
              )}
              {movie.genres?.map((g) => (
                <span
                  key={g.id}
                  className="px-2.5 py-1 border-2 border-black text-xs font-bold uppercase bg-neutral-100"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* MOVIE TITLE */}
            <div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-none text-black">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="mt-2 text-sm sm:text-base font-bold text-neutral-600 italic">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* ATTRIBUTE STRIP */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-3 border-y-2 border-black text-xs font-bold text-neutral-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black" />
                <span>RILIS: {movie.release_date || "2024"}</span>
              </div>
              {movie.runtime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black" />
                  <span>DURASI: {movie.runtime} MENIT</span>
                </div>
              )}
              {movie.created_by && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-black" />
                  <span>AUTHOR: {movie.created_by.split("@")[0]}</span>
                </div>
              )}
            </div>

            {/* SYNOPSIS */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Film className="w-4 h-4" />
                <span>SINOPSIS / RINGKASAN CERITA:</span>
              </div>
              <p className="font-sans text-sm sm:text-base text-neutral-800 leading-relaxed font-normal">
                {movie.overview}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED CINEMA THEATER STAGE (TRAILER VIDEO SECTION) */}
      <div className="space-y-3">
        <div className="border-4 border-black bg-white shadow-brutal-xl overflow-hidden">
          {/* THEATER HEADER */}
          <div className="bg-black text-white px-4 sm:px-6 py-3 border-b-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brutal-red text-white flex items-center justify-center border border-white">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <div>
                <div className="text-[10px] text-brutal-yellow font-black tracking-widest uppercase">
                  CINEMA SCREEN
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight">
                  OFFICIAL CINEMA TRAILER FEED
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 border border-white font-black uppercase bg-neutral-900 text-brutal-yellow text-[11px]">
                {isMp4 ? "FORMAT: LOCAL MP4 FEED" : "FORMAT: YOUTUBE EMBED"}
              </span>
              <span className="hidden sm:inline bg-neutral-800 text-neutral-300 px-2 py-1 text-[11px]">
                HIGH DEFINITION
              </span>
            </div>
          </div>

          {/* THEATER SCREEN */}
          <div className="relative aspect-video w-full bg-black">
            {movie.youtube_video_id ? (
              isMp4 ? (
                <video
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black"
                  src={movie.youtube_video_id}
                >
                  Browser Anda tidak mendukung tag video HTML5.
                </video>
              ) : (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${movie.youtube_video_id}?rel=0&modestbranding=1`}
                  title={`${movie.title} Official Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white p-8 text-center font-mono space-y-2">
                <Video className="w-12 h-12 text-neutral-500 mx-auto" />
                <p className="text-sm font-black uppercase">
                  TRAILER VIDEO BELUM TERSEDIA
                </p>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Trailer untuk film ini belum diunggah oleh admin.
                </p>
              </div>
            )}
          </div>

          {/* THEATER FOOTER STRIP */}
          <div className="bg-neutral-100 border-t-2 border-black px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-bold text-neutral-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-brutal-green inline-block"></span>
              <span>FEED STATUS: VERIFIED BROADCAST READY</span>
            </div>
            <span>AUDIO STREAM: STEREO 2.0 / MULTI-CHANNEL COMPATIBLE</span>
          </div>
        </div>
      </div>

      {/* 4. BALANCED COMMUNITY REVIEWS & COMMENTS SECTION */}
      <MovieReviewsSection
        movieId={movie.id}
        movieTitle={movie.title}
        moviePoster={movie.poster_path}
      />
    </div>
  );
}
