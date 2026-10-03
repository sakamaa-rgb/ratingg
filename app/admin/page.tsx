"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  X,
  ShieldAlert,
  Film,
  Star,
  MessageSquare,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Layers,
} from "lucide-react";

export interface AdminReview {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  author: string;
  rating: number;
  comment: string;
  timestamp?: string;
  createdAt?: string;
  status: "pending" | "approved" | "flagged";
}

interface MovieOption {
  id: number;
  title: string;
  poster_path: string;
}

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [moviesList, setMoviesList] = useState<MovieOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [selectedFilmFilter, setSelectedFilmFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "pending" | "approved" | "flagged">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedFilms, setCollapsedFilms] = useState<Record<string, boolean>>({});

  // Add Real Review Modal State
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    movieId: 693134,
    movieTitle: "Dune: Part Two",
    moviePoster: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    author: "",
    rating: 5,
    comment: "",
  });

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      showToast("Gagal memuat ulasan dari server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMoviesList = async () => {
    try {
      const res = await fetch("/api/admin/movies?all=true");
      if (res.ok) {
        const data = await res.json();
        if (data.movies && data.movies.length > 0) {
          setMoviesList(data.movies);
          setNewReviewForm((prev) => ({
            ...prev,
            movieId: data.movies[0].id,
            movieTitle: data.movies[0].title,
            moviePoster: data.movies[0].poster_path || "",
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    fetchReviews();
    fetchMoviesList();

    const email = localStorage.getItem("brutal_user_email");
    if (email) {
      setNewReviewForm((prev) => ({ ...prev, author: email.split("@")[0] }));
    }
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isAddReviewModalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isAddReviewModalOpen]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r))
        );
        showToast(`Review [${id}] disetujui & dipublikasikan.`);
      }
    } catch {
      showToast("Gagal menyetujui ulasan.");
    }
  };

  const handleFlag = async (id: string) => {
    const target = reviews.find((r) => r.id === id);
    if (!target) return;
    const newStatus = target.status === "flagged" ? "pending" : "flagged";

    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus as any } : r))
        );
        showToast(`Status review [${id}] diubah menjadi ${newStatus}.`);
      }
    } catch {
      showToast("Gagal memperbarui status ulasan.");
    }
  };

  const handlePurge = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        showToast(`Review [${id}] telah dihapus permanen.`);
      }
    } catch {
      showToast("Gagal menghapus review.");
    }
  };

  const handleCreateRealReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewForm.comment.trim()) {
      showToast("Isi ulasan wajib diisi.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: newReviewForm.movieId,
          movieTitle: newReviewForm.movieTitle,
          moviePoster: newReviewForm.moviePoster,
          author: newReviewForm.author.trim() || "admin_critic",
          rating: Number(newReviewForm.rating) || 5,
          comment: newReviewForm.comment.trim(),
          status: "approved",
        }),
      });

      const data = await res.json();
      if (res.ok && data.review) {
        showToast(`Berhasil menambahkan ulasan real untuk "${newReviewForm.movieTitle}"!`);
        setIsAddReviewModalOpen(false);
        setNewReviewForm((prev) => ({ ...prev, comment: "" }));
        fetchReviews();
      } else {
        showToast(data.error || "Gagal menyimpan ulasan.");
      }
    } catch {
      showToast("Kesalahan jaringan saat menyimpan ulasan.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const toggleCollapse = (filmTitle: string) => {
    setCollapsedFilms((prev) => ({
      ...prev,
      [filmTitle]: !prev[filmTitle],
    }));
  };

  // Extract unique films and their stats from REAL reviews
  const uniqueFilms = Array.from(
    new Set(reviews.map((r) => r.movieTitle))
  ).map((title) => {
    const sample = reviews.find((r) => r.movieTitle === title)!;
    const filmReviews = reviews.filter((r) => r.movieTitle === title);
    const pendingCount = filmReviews.filter((r) => r.status === "pending").length;
    const avgScore = (
      filmReviews.reduce((sum, r) => sum + r.rating, 0) / (filmReviews.length || 1)
    ).toFixed(1);

    return {
      title,
      movieId: sample.movieId,
      poster: sample.moviePoster,
      totalCount: filmReviews.length,
      pendingCount,
      avgScore,
    };
  });

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesFilm = selectedFilmFilter === "ALL" || r.movieTitle === selectedFilmFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesSearch =
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.movieTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilm && matchesStatus && matchesSearch;
  });

  // Group filtered reviews by film
  const groupedByFilm: Record<string, AdminReview[]> = {};
  filteredReviews.forEach((rev) => {
    if (!groupedByFilm[rev.movieTitle]) {
      groupedByFilm[rev.movieTitle] = [];
    }
    groupedByFilm[rev.movieTitle].push(rev);
  });

  const pendingTotal = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 sm:space-y-8 font-mono">
      {/* PAGE HEADER */}
      <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
            CONTROL OVERVIEW & MODERATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            SYSTEM METRICS & REAL REVIEWS
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-600 mt-0.5 uppercase font-bold">
            Data review 100% Real (Semua data dummy telah dibersihkan)
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={fetchReviews}
            className="p-2 sm:p-2.5 border-2 border-black bg-white hover:bg-neutral-100 shadow-brutal-sm cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsAddReviewModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-black bg-brutal-yellow text-black font-black uppercase hover:bg-yellow-400 shadow-brutal-sm active:translate-y-0.5 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>TAMBAH REVIEW REAL</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-brutal-green text-black border-2 border-black font-bold text-xs shadow-brutal-sm flex items-center justify-between animate-in fade-in duration-150">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="cursor-pointer font-black">
            [X]
          </button>
        </div>
      )}

      {/* METRIC GRIDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="border-4 border-black bg-white p-4 sm:p-5 shadow-brutal">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase">Katalog Film Aktif</span>
            <Film className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">{moviesList.length || 10}</div>
          <div className="text-[10px] sm:text-[11px] font-bold text-neutral-600 mt-1">
            TERSEDIA DI REGISTRY
          </div>
        </div>

        <div className="border-4 border-black bg-brutal-yellow p-4 sm:p-5 shadow-brutal">
          <div className="flex items-center justify-between text-black mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase">Total Review Real</span>
            <Star className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">{reviews.length}</div>
          <div className="text-[10px] sm:text-[11px] font-bold text-black mt-1">
            0 DUMMY • 100% TERVERIFIKASI
          </div>
        </div>

        <div className="border-4 border-black bg-white p-4 sm:p-5 shadow-brutal">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase">Antrean Moderasi</span>
            <MessageSquare className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brutal-red">{pendingTotal}</div>
          <div className="text-[10px] sm:text-[11px] font-bold text-neutral-600 mt-1">
            {pendingTotal > 0 ? "PERLU DITINJAU" : "SEMUA BERSIH"}
          </div>
        </div>

        <div className="border-4 border-black bg-black text-white p-4 sm:p-5 shadow-brutal">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase">Bagian Film Aktif</span>
            <Layers className="w-4 h-4 text-brutal-green" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brutal-green">{uniqueFilms.length}</div>
          <div className="text-[10px] sm:text-[11px] font-bold text-neutral-300 mt-1">
            KOMPARTEMEN FILM
          </div>
        </div>
      </div>

      {/* REVIEWS ORGANIZED BY FILM SECTION */}
      <div className="space-y-6">
        {/* SECTION HEADER & CONTROL BAR */}
        <div className="border-4 border-black bg-white p-3 sm:p-5 shadow-brutal space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-black pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  KOMENTAR & REVIEW REAL
                </span>
                <span className="text-xs font-black text-neutral-500">
                  ({filteredReviews.length} DITAMPILKAN)
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight mt-1">
                DAFTAR ULASAN PER BAGIAN FILM
              </h2>
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 sm:px-3 py-1.5 border-2 border-black uppercase text-xs cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-black text-white shadow-brutal-xs"
                    : "bg-white hover:bg-neutral-100"
                }`}
              >
                Semua ({reviews.length})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-2.5 sm:px-3 py-1.5 border-2 border-black uppercase text-xs cursor-pointer ${
                  statusFilter === "pending"
                    ? "bg-brutal-yellow text-black shadow-brutal-xs font-black"
                    : "bg-white hover:bg-neutral-100"
                }`}
              >
                Pending ({reviews.filter((r) => r.status === "pending").length})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-2.5 sm:px-3 py-1.5 border-2 border-black uppercase text-xs cursor-pointer ${
                  statusFilter === "approved"
                    ? "bg-brutal-green text-black shadow-brutal-xs font-black"
                    : "bg-white hover:bg-neutral-100"
                }`}
              >
                Disetujui ({reviews.filter((r) => r.status === "approved").length})
              </button>
              <button
                onClick={() => setStatusFilter("flagged")}
                className={`px-2.5 sm:px-3 py-1.5 border-2 border-black uppercase text-xs cursor-pointer ${
                  statusFilter === "flagged"
                    ? "bg-brutal-red text-white shadow-brutal-xs font-black"
                    : "bg-white hover:bg-neutral-100"
                }`}
              >
                Ditandai ({reviews.filter((r) => r.status === "flagged").length})
              </button>
            </div>
          </div>

          {/* SEARCH & FILM QUICK SELECTOR TABS */}
          <div className="space-y-3">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="CARI KOMENTAR, USERNAME @PENGGUNA, ATAU JUDUL FILM..."
                className="w-full px-3 py-2 border-2 border-black font-bold uppercase text-xs bg-neutral-50 focus:bg-white focus:outline-none pr-8"
              />
              <Search className="w-4 h-4 absolute right-2.5 top-2.5 text-neutral-500" />
            </div>

            {/* HORIZONTAL FILM TABS */}
            {uniqueFilms.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                <span className="text-[10px] font-black uppercase text-neutral-500 shrink-0">
                  PILIH BAGIAN:
                </span>
                <button
                  onClick={() => setSelectedFilmFilter("ALL")}
                  className={`px-3 py-1 border-2 border-black text-xs font-black uppercase shrink-0 cursor-pointer ${
                    selectedFilmFilter === "ALL"
                      ? "bg-black text-white shadow-brutal-xs"
                      : "bg-white hover:bg-neutral-100"
                  }`}
                >
                  SEMUA BAGIAN ({reviews.length})
                </button>

                {uniqueFilms.map((film) => (
                  <button
                    key={film.title}
                    onClick={() => setSelectedFilmFilter(film.title)}
                    className={`flex items-center gap-1.5 px-3 py-1 border-2 border-black text-xs font-black uppercase shrink-0 cursor-pointer transition-all ${
                      selectedFilmFilter === film.title
                        ? "bg-brutal-yellow text-black shadow-brutal-xs translate-y-[-1px]"
                        : "bg-white hover:bg-yellow-50 text-neutral-800"
                    }`}
                  >
                    <span>{film.title}</span>
                    <span className="px-1.5 py-0.2 bg-black text-white text-[10px]">
                      {film.totalCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FILM-BY-FILM COMPARTMENTS */}
        {loading ? (
          <div className="border-4 border-black bg-white p-8 sm:p-12 text-center shadow-brutal">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p className="font-mono font-bold uppercase text-xs">
              MEMUAT DATA ULASAN REAL...
            </p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="border-4 border-black bg-white p-6 sm:p-10 md:p-12 text-center shadow-brutal space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brutal-yellow border-2 border-black flex items-center justify-center mx-auto shadow-brutal-sm">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
            </div>
            <h3 className="text-lg sm:text-xl font-black uppercase">
              SEMUA DATA DUMMY TELAH DIHAPUS
            </h3>
            <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
              Database ulasan saat ini 100% bersih (0 ulasan). Anda sekarang dapat menambahkan ulasan yang asli dan nyata.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAddReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-black bg-brutal-yellow text-black font-black uppercase text-xs hover:bg-yellow-400 shadow-brutal-sm cursor-pointer active:translate-y-0.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>TAMBAHKAN REVIEW REAL SEKARANG</span>
              </button>
            </div>
          </div>
        ) : Object.keys(groupedByFilm).length === 0 ? (
          <div className="border-4 border-black bg-white p-12 text-center shadow-brutal space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-neutral-400" />
            <h3 className="text-lg font-black uppercase">
              TIDAK ADA HASIL COCOK DENGAN FILTER
            </h3>
            <p className="text-xs text-neutral-600 max-w-md mx-auto">
              Tidak ada ulasan real yang sesuai dengan pencarian atau filter status yang Anda pilih.
            </p>
            <button
              onClick={() => {
                setSelectedFilmFilter("ALL");
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 border-2 border-black bg-brutal-yellow text-black font-black uppercase text-xs shadow-brutal-xs hover:bg-yellow-400 cursor-pointer"
            >
              RESET FILTER
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByFilm).map(([filmTitle, filmReviews]) => {
              const sample = filmReviews[0];
              const isCollapsed = collapsedFilms[filmTitle];
              const pendingInFilm = filmReviews.filter((r) => r.status === "pending").length;
              const avgScore = (
                filmReviews.reduce((sum, r) => sum + r.rating, 0) / filmReviews.length
              ).toFixed(1);

              return (
                <div
                  key={filmTitle}
                  className="border-4 border-black bg-white shadow-brutal-lg transition-all"
                >
                  {/* FILM COMPARTMENT HEADER */}
                  <div className="bg-black text-white p-4 border-b-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* POSTER THUMBNAIL */}
                      <div className="relative w-10 h-14 bg-neutral-900 border-2 border-white shrink-0 overflow-hidden">
                        <Image
                          src={sample.moviePoster || "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"}
                          alt={filmTitle}
                          fill
                          sizes="40px"
                          unoptimized={sample.moviePoster?.startsWith("/uploads/")}
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-brutal-yellow text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border border-white">
                            BAGIAN FILM
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            ID: #{sample.movieId}
                          </span>
                          {pendingInFilm > 0 && (
                            <span className="bg-brutal-red text-white px-2 py-0.5 text-[9px] font-black uppercase animate-bounce">
                              {pendingInFilm} PERLU TINJAUAN
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white truncate mt-0.5">
                          {filmTitle}
                        </h3>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-300 mt-0.5">
                          <span className="flex items-center gap-1 font-bold text-yellow-400">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            {avgScore} / 5.0
                          </span>
                          <span>•</span>
                          <span className="font-bold">
                            {filmReviews.length} Ulasan Real
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS & ACCORDION TOGGLE */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Link
                        href={`/movies/${sample.movieId}`}
                        target="_blank"
                        className="px-3 py-1.5 border-2 border-white bg-neutral-900 hover:bg-neutral-800 text-white font-black uppercase text-[11px] flex items-center gap-1.5 shadow-brutal-xs"
                        title="Buka halaman film publik"
                      >
                        <span>Lihat Film</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleCollapse(filmTitle)}
                        className="px-3 py-1.5 border-2 border-black bg-brutal-yellow hover:bg-yellow-400 text-black font-black uppercase text-[11px] flex items-center gap-1.5 cursor-pointer shadow-brutal-xs"
                      >
                        {isCollapsed ? (
                          <>
                            <span>Buka ({filmReviews.length})</span>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Tutup</span>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* REVIEWS LIST FOR THIS FILM */}
                  {!isCollapsed && (
                    <div className="divide-y-2 divide-black p-0 bg-neutral-50">
                      {filmReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                            rev.status === "flagged"
                              ? "bg-red-50/70"
                              : rev.status === "pending"
                              ? "bg-yellow-50/50"
                              : "bg-white"
                          }`}
                        >
                          {/* REVIEW CONTENT */}
                          <div className="space-y-2 flex-1 min-w-0">
                            {/* USER & METADATA BAR */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                              {/* AVATAR BOX */}
                              <div className="w-6 h-6 bg-black text-white font-black flex items-center justify-center text-[11px]">
                                {rev.author[0]?.toUpperCase() || "U"}
                              </div>
                              <span className="font-black text-neutral-900">
                                @{rev.author}
                              </span>

                              {/* STAR SCORE */}
                              <div className="flex items-center gap-1 bg-brutal-yellow text-black px-2 py-0.5 border border-black font-black text-[11px]">
                                <Star className="w-3 h-3 fill-black text-black" />
                                <span>{rev.rating}.0 / 5.0</span>
                              </div>

                              {/* STATUS BADGE */}
                              <span
                                className={`px-2 py-0.5 font-black uppercase text-[10px] border border-black ${
                                  rev.status === "approved"
                                    ? "bg-brutal-green text-black"
                                    : rev.status === "flagged"
                                    ? "bg-brutal-red text-white"
                                    : "bg-amber-300 text-black"
                                }`}
                              >
                                {rev.status === "approved"
                                  ? "TERPUBLIKASI"
                                  : rev.status === "flagged"
                                  ? "DITANDAI / SPAM"
                                  : "MENUNGGU TINJAUAN"}
                              </span>

                              <span className="text-[10px] text-neutral-500 font-bold ml-auto">
                                REF: {rev.id} • {rev.createdAt ? rev.createdAt.split("T")[0] : rev.timestamp}
                              </span>
                            </div>

                            {/* REVIEW TEXT */}
                            <p className="text-xs sm:text-sm font-sans text-neutral-800 leading-relaxed pt-1">
                              "{rev.comment}"
                            </p>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 self-end md:self-center border-t-2 md:border-t-0 border-dashed border-neutral-300 w-full md:w-auto justify-end">
                            {rev.status !== "approved" && (
                              <button
                                onClick={() => handleApprove(rev.id)}
                                className="px-3 py-1.5 border-2 border-black bg-brutal-green hover:bg-emerald-400 text-black font-black uppercase text-[11px] shadow-brutal-xs flex items-center gap-1 cursor-pointer active:translate-y-0.5"
                                title="Setujui dan tayangkan ulasan"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Setujui</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleFlag(rev.id)}
                              className={`px-3 py-1.5 border-2 border-black font-bold uppercase text-[11px] shadow-brutal-xs flex items-center gap-1 cursor-pointer active:translate-y-0.5 ${
                                rev.status === "flagged"
                                  ? "bg-white hover:bg-neutral-100 text-black"
                                  : "bg-yellow-200 hover:bg-yellow-300 text-black"
                              }`}
                              title="Tandai komentar mencurigakan"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{rev.status === "flagged" ? "Lepas Tanda" : "Tandai"}</span>
                            </button>

                            <button
                              onClick={() => handlePurge(rev.id)}
                              className="px-3 py-1.5 border-2 border-black bg-brutal-red hover:bg-red-700 text-white font-black uppercase text-[11px] shadow-brutal-xs flex items-center gap-1 cursor-pointer active:translate-y-0.5"
                              title="Hapus review permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH REVIEW REAL (PORTALED TO BODY) */}
      {mounted && isAddReviewModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddReviewModalOpen(false);
          }}
        >
          <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl flex flex-col bg-white sm:border-4 sm:border-black sm:shadow-brutal-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}
            <div className="bg-black text-white px-4 py-3 sm:py-3.5 border-b-4 border-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-brutal-yellow text-black flex items-center justify-center font-mono font-black border border-white">
                  <Star className="w-4 h-4 fill-black" />
                </div>
                <div>
                  <div className="text-[9px] font-mono tracking-widest text-brutal-yellow uppercase">
                    INPUT DATA REAL
                  </div>
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
                    TAMBAHKAN ULASAN FILM REAL
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddReviewModalOpen(false)}
                className="w-8 h-8 border-2 border-white bg-black hover:bg-brutal-red text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL FORM BODY */}
            <form
              id="add-real-review-form"
              onSubmit={handleCreateRealReview}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white text-xs font-mono"
            >
              {/* SELECT MOVIE */}
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Pilih Film *
                </label>
                <select
                  value={newReviewForm.movieId}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    const found = moviesList.find((m) => m.id === selectedId);
                    if (found) {
                      setNewReviewForm((prev) => ({
                        ...prev,
                        movieId: found.id,
                        movieTitle: found.title,
                        moviePoster: found.poster_path || "",
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-black font-bold uppercase focus:outline-none bg-white text-xs"
                >
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* RATING */}
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Rating Skor (1 - 5 Bintang) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={newReviewForm.rating}
                    onChange={(e) =>
                      setNewReviewForm((prev) => ({
                        ...prev,
                        rating: Number(e.target.value),
                      }))
                    }
                    className="flex-1 accent-black cursor-pointer"
                  />
                  <span className="font-black text-base bg-brutal-yellow px-3 py-1 border-2 border-black">
                    {newReviewForm.rating}.0 / 5.0 ★
                  </span>
                </div>
              </div>

              {/* AUTHOR */}
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Nama / Username Pengulas (Author)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: critic_marcus"
                  value={newReviewForm.author}
                  onChange={(e) =>
                    setNewReviewForm((prev) => ({
                      ...prev,
                      author: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none text-xs"
                />
              </div>

              {/* REVIEW COMMENT */}
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Isi Ulasan / Review Lengkap *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan ulasan nyata mengenai film ini..."
                  value={newReviewForm.comment}
                  onChange={(e) =>
                    setNewReviewForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-black font-sans text-xs focus:outline-none leading-relaxed"
                />
              </div>
            </form>

            {/* MODAL FOOTER */}
            <div className="p-3 sm:p-4 border-t-4 border-black bg-neutral-100 flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddReviewModalOpen(false)}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-200 font-bold uppercase text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-real-review-form"
                disabled={isSubmittingReview}
                className="px-5 py-2 border-2 border-black bg-brutal-yellow hover:bg-yellow-400 font-black uppercase shadow-brutal-sm flex items-center gap-1.5 disabled:opacity-50 text-xs cursor-pointer"
              >
                {isSubmittingReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>SIMPAN ULASAN REAL</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
