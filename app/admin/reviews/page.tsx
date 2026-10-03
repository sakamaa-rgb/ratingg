"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Trash2,
  AlertOctagon,
  Check,
  Star,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface ReviewItem {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  author: string;
  rating: number;
  comment: string;
  status: "published" | "flagged" | "pending" | "approved";
  createdAt: string;
}

interface MovieOption {
  id: number;
  title: string;
  poster_path: string;
}

export default function AdminReviewsPage() {
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [moviesList, setMoviesList] = useState<MovieOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [selectedFilm, setSelectedFilm] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedFilms, setCollapsedFilms] = useState<Record<string, boolean>>({});

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
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
      showToast("Gagal memuat review dari server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await fetch("/api/admin/movies?all=true");
      if (res.ok) {
        const data = await res.json();
        if (data.movies && data.movies.length > 0) {
          setMoviesList(data.movies);
          setFormData((prev) => ({
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
    fetchMovies();

    const email = localStorage.getItem("brutal_user_email");
    if (email) {
      setFormData((prev) => ({ ...prev, author: email.split("@")[0] }));
    }
  }, []);

  const deleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        showToast(`Review [${id}] berhasil dihapus.`);
      }
    } catch {
      showToast("Gagal menghapus review.");
    }
  };

  const toggleFlag = async (id: string) => {
    const rev = reviews.find((r) => r.id === id);
    if (!rev) return;
    const newStatus = rev.status === "flagged" ? "approved" : "flagged";

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
        showToast(`Status review [${id}] diubah.`);
      }
    } catch {
      showToast("Gagal memperbarui status.");
    }
  };

  const publishReview = async (id: string) => {
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
      showToast("Gagal menyetujui review.");
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      showToast("Isi ulasan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: formData.movieId,
          movieTitle: formData.movieTitle,
          moviePoster: formData.moviePoster,
          author: formData.author.trim() || "admin_reviewer",
          rating: Number(formData.rating) || 5,
          comment: formData.comment.trim(),
          status: "approved",
        }),
      });

      const data = await res.json();
      if (res.ok && data.review) {
        showToast(`Berhasil menambahkan review real untuk "${formData.movieTitle}"!`);
        setIsModalOpen(false);
        setFormData((prev) => ({ ...prev, comment: "" }));
        fetchReviews();
      } else {
        showToast(data.error || "Gagal menyimpan review.");
      }
    } catch {
      showToast("Kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCollapse = (film: string) => {
    setCollapsedFilms((prev) => ({
      ...prev,
      [film]: !prev[film],
    }));
  };

  // Unique films list from REAL reviews
  const uniqueFilms = Array.from(new Set(reviews.map((r) => r.movieTitle))).map((title) => {
    const sample = reviews.find((r) => r.movieTitle === title)!;
    const filmReviews = reviews.filter((r) => r.movieTitle === title);
    const avgScore = (
      filmReviews.reduce((sum, r) => sum + r.rating, 0) / (filmReviews.length || 1)
    ).toFixed(1);

    return {
      title,
      movieId: sample.movieId,
      poster: sample.moviePoster,
      count: filmReviews.length,
      pendingCount: filmReviews.filter((r) => r.status === "pending").length,
      avgScore,
    };
  });

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesFilm = selectedFilm === "ALL" || r.movieTitle === selectedFilm;
    const matchesStatus =
      statusFilter === "ALL" ||
      r.status === statusFilter ||
      (statusFilter === "published" && r.status === "approved");
    const matchesSearch =
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.movieTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilm && matchesStatus && matchesSearch;
  });

  // Group by film
  const groupedByFilm: Record<string, ReviewItem[]> = {};
  filteredReviews.forEach((r) => {
    if (!groupedByFilm[r.movieTitle]) groupedByFilm[r.movieTitle] = [];
    groupedByFilm[r.movieTitle].push(r);
  });

  return (
    <div className="space-y-6 font-mono">
      {/* HEADER */}
      <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
            CONTENT GOVERNANCE & MODERATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            FILM REVIEWS MANAGEMENT
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-600 font-bold uppercase mt-0.5">
            100% Real Reviews • Tanpa Data Dummy ({reviews.length} Ulasan)
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={fetchReviews}
            className="p-2 sm:p-2.5 border-2 border-black bg-white hover:bg-neutral-100 shadow-brutal-sm cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-black bg-brutal-yellow text-black font-black uppercase hover:bg-yellow-400 shadow-brutal-sm active:translate-y-0.5 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>TAMBAH REVIEW REAL</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-brutal-green text-black border-2 border-black font-bold text-xs shadow-brutal-sm flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="cursor-pointer font-black">
            [X]
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="border-4 border-black bg-white p-4 shadow-brutal space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="CARI KOMENTAR, USERNAME, ATAU FILM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black font-mono text-xs font-bold uppercase bg-neutral-50 focus:bg-white focus:outline-none pr-8"
            />
            <Search className="w-4 h-4 absolute right-2.5 top-2.5 text-neutral-500" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs font-bold">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 border-2 border-black uppercase cursor-pointer ${
                statusFilter === "ALL" ? "bg-black text-white" : "bg-white hover:bg-neutral-100"
              }`}
            >
              Semua ({reviews.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 border-2 border-black uppercase cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-brutal-yellow text-black font-black"
                  : "bg-white hover:bg-neutral-100"
              }`}
            >
              Pending ({reviews.filter((r) => r.status === "pending").length})
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-3 py-1.5 border-2 border-black uppercase cursor-pointer ${
                statusFilter === "approved"
                  ? "bg-brutal-green text-black font-black"
                  : "bg-white hover:bg-neutral-100"
              }`}
            >
              Publik ({reviews.filter((r) => r.status === "approved" || r.status === "published").length})
            </button>
            <button
              onClick={() => setStatusFilter("flagged")}
              className={`px-3 py-1.5 border-2 border-black uppercase cursor-pointer ${
                statusFilter === "flagged"
                  ? "bg-brutal-red text-white font-black"
                  : "bg-white hover:bg-neutral-100"
              }`}
            >
              Ditandai ({reviews.filter((r) => r.status === "flagged").length})
            </button>
          </div>
        </div>

        {/* FILM SECTION SELECTOR TABS */}
        {uniqueFilms.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin pt-2 border-t-2 border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 shrink-0">
              PILIH BAGIAN:
            </span>
            <button
              onClick={() => setSelectedFilm("ALL")}
              className={`px-3 py-1 border-2 border-black text-xs font-black uppercase shrink-0 cursor-pointer ${
                selectedFilm === "ALL"
                  ? "bg-black text-white shadow-brutal-xs"
                  : "bg-white hover:bg-neutral-100"
              }`}
            >
              SEMUA BAGIAN ({reviews.length})
            </button>
            {uniqueFilms.map((film) => (
              <button
                key={film.title}
                onClick={() => setSelectedFilm(film.title)}
                className={`flex items-center gap-1.5 px-3 py-1 border-2 border-black text-xs font-black uppercase shrink-0 cursor-pointer transition-all ${
                  selectedFilm === film.title
                    ? "bg-brutal-yellow text-black shadow-brutal-xs"
                    : "bg-white hover:bg-yellow-50 text-neutral-800"
                }`}
              >
                <span>{film.title}</span>
                <span className="px-1.5 py-0.2 bg-black text-white text-[10px]">
                  {film.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FILM COMPARTMENTS LIST */}
      {loading ? (
        <div className="border-4 border-black bg-white p-12 text-center shadow-brutal">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p className="font-mono font-bold uppercase text-xs">
            MEMUAT DATA ULASAN REAL...
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="border-4 border-black bg-white p-12 text-center shadow-brutal space-y-4">
          <div className="w-14 h-14 bg-brutal-yellow border-2 border-black flex items-center justify-center mx-auto shadow-brutal-sm">
            <CheckCircle2 className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-xl font-black uppercase">SEMUA REVIEW DUMMY TELAH DIHAPUS</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            Database ulasan saat ini 100% bersih. Anda dapat menambahkan ulasan yang real sekarang.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 border-2 border-black bg-brutal-yellow text-black font-black uppercase text-xs hover:bg-yellow-400 shadow-brutal-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ TAMBAHKAN REVIEW REAL</span>
            </button>
          </div>
        </div>
      ) : Object.keys(groupedByFilm).length === 0 ? (
        <div className="border-4 border-black bg-white p-12 text-center shadow-brutal space-y-3">
          <MessageSquare className="w-10 h-10 mx-auto text-neutral-400" />
          <h3 className="text-xl font-black uppercase">TIDAK ADA REVIEW DITEMUKAN</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Tidak ada ulasan real pada filter yang dipilih. Silakan atur kembali kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByFilm).map(([filmTitle, filmReviews]) => {
            const sample = filmReviews[0];
            const isCollapsed = collapsedFilms[filmTitle];
            const avgScore = (
              filmReviews.reduce((sum, r) => sum + r.rating, 0) / filmReviews.length
            ).toFixed(1);

            return (
              <div
                key={filmTitle}
                className="border-4 border-black bg-white shadow-brutal transition-all"
              >
                {/* FILM HEADER STRIP */}
                <div className="bg-black text-white p-4 border-b-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
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
                      <div className="text-[9px] font-black uppercase tracking-wider text-brutal-yellow">
                        BAGIAN FILM
                      </div>
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-tight truncate text-white">
                        {filmTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-300 mt-0.5">
                        <span className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {avgScore} / 5.0
                        </span>
                        <span>•</span>
                        <span>{filmReviews.length} Ulasan Real</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Link
                      href={`/movies/${sample.movieId}`}
                      target="_blank"
                      className="px-3 py-1.5 border-2 border-white bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase text-[11px] flex items-center gap-1 shadow-brutal-xs"
                    >
                      <span>Lihat Film</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(filmTitle)}
                      className="px-3 py-1.5 border-2 border-black bg-brutal-yellow hover:bg-yellow-400 text-black font-black uppercase text-[11px] flex items-center gap-1 cursor-pointer shadow-brutal-xs"
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

                {/* REVIEWS IN THIS FILM */}
                {!isCollapsed && (
                  <div className="divide-y-2 divide-black bg-neutral-50">
                    {filmReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className={`p-4 sm:p-5 transition-colors ${
                          rev.status === "flagged"
                            ? "bg-red-50"
                            : rev.status === "pending"
                            ? "bg-yellow-50"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b-2 border-black pb-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xs">@{rev.author}</span>
                            <span className="bg-brutal-yellow text-black border border-black font-black text-xs px-2 py-0.5">
                              {rev.rating}/5 ★
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 font-bold uppercase text-[10px] border border-black ${
                                rev.status === "flagged"
                                  ? "bg-brutal-red text-white"
                                  : rev.status === "pending"
                                  ? "bg-yellow-300 text-black"
                                  : "bg-brutal-green text-black"
                              }`}
                            >
                              {rev.status === "approved" || rev.status === "published"
                                ? "PUBLIK"
                                : rev.status === "flagged"
                                ? "DITANDAI"
                                : "PENDING"}
                            </span>
                            <span className="text-neutral-500 text-[11px]">
                              {rev.createdAt ? rev.createdAt.split("T")[0] : "2026-10-03"}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm font-sans text-neutral-800 mb-4 leading-relaxed">
                          "{rev.comment}"
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-neutral-200">
                          {rev.status !== "approved" && rev.status !== "published" && (
                            <button
                              onClick={() => publishReview(rev.id)}
                              className="px-3 py-1.5 border-2 border-black font-mono text-xs font-bold uppercase bg-brutal-green text-black hover:bg-emerald-400 flex items-center gap-1.5 shadow-brutal-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              TERIMA
                            </button>
                          )}
                          <button
                            onClick={() => toggleFlag(rev.id)}
                            className="px-3 py-1.5 border-2 border-black font-mono text-xs font-bold uppercase bg-white hover:bg-neutral-100 flex items-center gap-1.5 shadow-brutal-xs cursor-pointer"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {rev.status === "flagged" ? "UNFLAG" : "TANDAI SPAM"}
                          </button>
                          <button
                            onClick={() => deleteReview(rev.id)}
                            className="px-3 py-1.5 border-2 border-black font-mono text-xs font-bold uppercase bg-brutal-red text-white hover:bg-red-700 flex items-center gap-1.5 shadow-brutal-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            HAPUS
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

      {/* MODAL TAMBAH REVIEW REAL */}
      {mounted && isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl flex flex-col bg-white sm:border-4 sm:border-black sm:shadow-brutal-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
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
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 border-2 border-white bg-black hover:bg-brutal-red text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="add-real-review-form-page"
              onSubmit={handleCreateReview}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white text-xs font-mono"
            >
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Pilih Film *
                </label>
                <select
                  value={formData.movieId}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    const found = moviesList.find((m) => m.id === selectedId);
                    if (found) {
                      setFormData((prev) => ({
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
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rating: Number(e.target.value),
                      }))
                    }
                    className="flex-1 accent-black cursor-pointer"
                  />
                  <span className="font-black text-base bg-brutal-yellow px-3 py-1 border-2 border-black">
                    {formData.rating}.0 / 5.0 ★
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Nama / Username Pengulas (Author)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: critic_marcus"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      author: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Isi Ulasan / Review Lengkap *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan ulasan nyata mengenai film ini..."
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-black font-sans text-xs focus:outline-none leading-relaxed"
                />
              </div>
            </form>

            <div className="p-3 sm:p-4 border-t-4 border-black bg-neutral-100 flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-200 font-bold uppercase text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-real-review-form-page"
                disabled={isSubmitting}
                className="px-5 py-2 border-2 border-black bg-brutal-yellow hover:bg-yellow-400 font-black uppercase shadow-brutal-sm flex items-center gap-1.5 disabled:opacity-50 text-xs cursor-pointer"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
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
