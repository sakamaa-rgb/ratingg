import { getTrendingMovies, getCategorizedMovies } from "@/lib/tmdb";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MovieSliderRow from "@/components/MovieSliderRow";
import ClientCatalogFallback from "@/components/ClientCatalogFallback";
import DecryptedText from "@/components/animations/DecryptedText";
import { Star, Play, Film, ArrowRight, X, Flame, PlaySquare, Clock, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Enforce mandatory login: Visitors must log in before accessing the main page
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("brutal_dev_session")?.value === "authenticated";
  if (!isAuthenticated) {
    redirect("/login");
  }

  const userRole = cookieStore.get("brutal_user_role")?.value || "user";
  const userEmail = cookieStore.get("brutal_user_email")?.value?.toLowerCase() || "";
  const adminEmail = (process.env.ADMIN_EMAIL || "adminflix123@gmail.com").toLowerCase();
  const isAdmin =
    userRole === "admin" ||
    userEmail === "rajibjugi02@gmail.com" ||
    userEmail === adminEmail;

  const params = await searchParams;
  const category = params?.category;
  const query = params?.q;

  const allMovies = await getTrendingMovies();
  const categorized = await getCategorizedMovies();
  const searchResults = query || category ? await getTrendingMovies({ category, query }) : null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-8 sm:space-y-12 font-mono">
      {/* NEO-BRUTALIST HERO BANNER */}
      <section className="border-4 border-black bg-white p-4 sm:p-10 shadow-brutal-xl relative overflow-hidden">
        <div className="inline-block bg-black text-white px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-3">
          AUTHORIZED FILM ARCHIVE
        </div>

        <div className="mb-3 max-w-full">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none">
            <DecryptedText
              text="CRITICAL RATINGS."
              speed={35}
              maxIterations={15}
              className="text-black inline-block"
              encryptedClassName="text-amber-500 font-mono"
            />{" "}
            <span className="text-amber-500 bg-black px-2 py-0.5 inline-block">
              <DecryptedText
                text="ZERO PIRACY."
                speed={40}
                maxIterations={18}
                className="text-amber-500 inline-block"
                encryptedClassName="text-white font-mono"
              />
            </span>
          </h1>
        </div>

        <p className="font-sans text-xs sm:text-lg text-neutral-800 mt-2 sm:mt-4 max-w-2xl leading-relaxed font-medium">
          Verified film evaluation and community analysis. Powered strictly by TMDB metadata and official YouTube trailer streams.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t-2 border-black">
          <a
            href="#film-registry"
            className="px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-black bg-black text-white font-mono text-xs sm:text-sm font-bold uppercase hover:bg-neutral-800 shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            href="/?category=top_rated"
            className="px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-black bg-brutal-yellow text-black font-mono text-xs sm:text-sm font-bold uppercase hover:bg-yellow-400 shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Top Rated Masterworks</span>
          </Link>
        </div>
      </section>

      {/* FILTER & SEARCH STATE */}
      <section id="film-registry" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-black pb-4">
          <div>
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              CATALOG BROWSER
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {query
                ? `SEARCH RESULTS: "${query}"`
                : category
                ? `CATEGORY: ${category.toUpperCase()}`
                : "NETFLIX-STYLE FILM FEED (SLIDE 5 FILMS)"}
            </h2>
          </div>

          {/* QUICK CATEGORY SWITCH PILLS */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase transition-all ${
                !category && !query
                  ? "bg-black text-white shadow-brutal-sm"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              ALL
            </Link>
            <Link
              href="/?category=popular"
              className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                category === "popular"
                  ? "bg-brutal-yellow text-black shadow-brutal-sm"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-brutal-red" />
              <span>POPULAR</span>
            </Link>
            <Link
              href="/?category=now_playing"
              className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                category === "now_playing"
                  ? "bg-brutal-yellow text-black shadow-brutal-sm"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5 text-brutal-blue" />
              <span>NOW PLAYING</span>
            </Link>
            <Link
              href="/?category=top_rated"
              className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                category === "top_rated"
                  ? "bg-brutal-yellow text-black shadow-brutal-sm"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-black" />
              <span>TOP RATED</span>
            </Link>
            <Link
              href="/?category=upcoming"
              className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                category === "upcoming"
                  ? "bg-brutal-yellow text-black shadow-brutal-sm"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-brutal-green" />
              <span>UPCOMING</span>
            </Link>

            {(category || query) && (
              <Link
                href="/"
                className="px-3 py-1.5 border-2 border-dashed border-brutal-red text-brutal-red text-xs font-bold uppercase hover:bg-red-50 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>CLEAR FILTER</span>
              </Link>
            )}
          </div>
        </div>

        {/* IF USER SEARCHED OR FILTERED A SINGLE CATEGORY */}
        {searchResults ? (
          <div>
            {searchResults.length === 0 ? (
              <div className="p-12 border-4 border-black bg-white text-center shadow-brutal">
                <Film className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                <h3 className="text-lg font-black uppercase">NO FILMS MATCH CRITERIA</h3>
                <p className="text-xs text-neutral-600 mt-1 mb-4 font-sans">
                  No records match "{query || category}".
                </p>
                <Link
                  href="/"
                  className="inline-block px-4 py-2 border-2 border-black bg-black text-white text-xs font-bold uppercase"
                >
                  RETURN TO ALL FEED
                </Link>
              </div>
            ) : (
              <MovieSliderRow
                title={query ? `Matching "${query}"` : `${category?.toUpperCase()} REPOSITORIES`}
                categoryBadge="FILTERED SELECTION"
                movies={searchResults}
                showRankNumbers={false}
              />
            )}
          </div>
        ) : (
          /* DEFAULT VIEW: NETFLIX-STYLE SLIDER ROWS FOR REAL MOVIES */
          allMovies.length === 0 ? (
            <ClientCatalogFallback isAdmin={isAdmin} />
          ) : (
            <div className="space-y-12">
              {/* PRIMARY ROW: ALL CURATED REAL MOVIES */}
              <MovieSliderRow
                title="KATALOG FILM RESMI (REAL REGISTRY)"
                categoryBadge={`TOTAL: ${allMovies.length} FILM`}
                icon={<Flame className="w-4 h-4 text-brutal-yellow" />}
                movies={allMovies}
                showRankNumbers={allMovies.length > 1}
              />

              {/* ROW 1: POPULAR (IF AVAILABLE & NOT DUPLICATE OF ONLY 1 MOVIE) */}
              {categorized.popular.length > 0 && allMovies.length > 1 && (
                <MovieSliderRow
                  title="TRENDING POPULAR FILMS (TERPOPULER)"
                  categoryBadge="COMMUNITY TOP PICKS"
                  icon={<Flame className="w-4 h-4 text-brutal-yellow" />}
                  movies={categorized.popular}
                  showRankNumbers={true}
                />
              )}

              {/* ROW 2: NOW PLAYING */}
              {categorized.nowPlaying.length > 0 && (
                <MovieSliderRow
                  title="NOW PLAYING IN THEATERS (SEDANG TAYANG)"
                  categoryBadge="LIVE CINEMA CIRCUIT"
                  icon={<PlaySquare className="w-4 h-4 text-brutal-cyan" />}
                  movies={categorized.nowPlaying}
                />
              )}

              {/* ROW 3: TOP RATED */}
              {categorized.topRated.length > 0 && (
                <MovieSliderRow
                  title="ALL-TIME CRITICAL MASTERWORKS (RATING TERTINGGI)"
                  categoryBadge="HALL OF FAME"
                  icon={<Star className="w-4 h-4 text-brutal-yellow fill-brutal-yellow" />}
                  movies={categorized.topRated}
                  showRankNumbers={true}
                />
              )}

              {/* ROW 4: UPCOMING */}
              {categorized.upcoming.length > 0 && (
                <MovieSliderRow
                  title="UPCOMING RELEASES & OFFICIAL TRAILERS (SEGERA HADIR)"
                  categoryBadge="PREMIERE PIPELINE"
                  icon={<Clock className="w-4 h-4 text-brutal-green" />}
                  movies={categorized.upcoming}
                />
              )}
            </div>
          )
        )}
      </section>
    </div>
  );
}
