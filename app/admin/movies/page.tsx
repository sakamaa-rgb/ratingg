"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Star,
  Play,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Lock,
  Upload,
  ImageIcon,
  Video,
  FileCheck,
} from "lucide-react";

interface AdminMovie {
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
  runtime?: number;
  youtube_video_id?: string;
  created_by?: string;
  created_at?: string;
  is_admin_curated?: boolean;
}

const CATEGORIES = [
  { value: "popular", label: "Popular" },
  { value: "now_playing", label: "Now Playing" },
  { value: "top_rated", label: "Top Rated" },
  { value: "upcoming", label: "Upcoming" },
];

export default function AdminMoviesPage() {
  const [mounted, setMounted] = useState(false);
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>("admin@ratezero.dev");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<AdminMovie | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<AdminMovie | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll whenever modal is open to prevent page bleed / scroll conflicts
  useEffect(() => {
    if (isModalOpen || movieToDelete) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isModalOpen, movieToDelete]);

  // File upload state
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form states (No URL inputs, 100% file uploads)
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    overview: "",
    category: "popular" as "popular" | "now_playing" | "top_rated" | "upcoming",
    release_date: new Date().toISOString().split("T")[0],
    vote_average: 8.0,
    runtime: 120,
    poster_path: "",
    backdrop_path: "",
    youtube_video_id: "",
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSessionAndMovies = async () => {
    setLoading(true);
    try {
      const localEmail = localStorage.getItem("brutal_user_email");
      if (localEmail) setCurrentAdminEmail(localEmail);

      const authRes = await fetch("/api/auth/me");
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.email) setCurrentAdminEmail(authData.email);
      }

      const res = await fetch("/api/admin/movies");
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      showToast("Error loading catalog data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndMovies();
  }, []);

  const openAddModal = () => {
    setEditingMovie(null);
    setFormData({
      title: "",
      tagline: "",
      overview: "",
      category: "popular",
      release_date: new Date().toISOString().split("T")[0],
      vote_average: 8.0,
      runtime: 120,
      poster_path: "",
      backdrop_path: "",
      youtube_video_id: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (movie: AdminMovie) => {
    const isOwner =
      !movie.created_by ||
      movie.created_by.toLowerCase() === currentAdminEmail.toLowerCase();

    if (!isOwner) {
      showToast(`Unauthorized: Only ${movie.created_by} can edit this film.`, "error");
      return;
    }

    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      tagline: movie.tagline || "",
      overview: movie.overview,
      category: movie.category || "popular",
      release_date: movie.release_date || new Date().toISOString().split("T")[0],
      vote_average: movie.vote_average || 7.5,
      runtime: movie.runtime || 120,
      poster_path: movie.poster_path || "",
      backdrop_path: movie.backdrop_path || "",
      youtube_video_id: movie.youtube_video_id || "",
    });

    setIsModalOpen(true);
  };

  // Pure file upload handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "backdrop" | "video"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guard maximum file size (200MB limit)
    if (file.size > 200 * 1024 * 1024) {
      showToast("Ukuran file terlalu besar (maksimal 200MB).", "error");
      e.target.value = "";
      return;
    }

    const data = new FormData();
    data.append("file", file);
    data.append("type", type);

    if (type === "cover") setUploadingCover(true);
    else if (type === "backdrop") setUploadingBackdrop(true);
    else if (type === "video") setUploadingVideo(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        if (type === "cover") {
          setFormData((prev) => ({ ...prev, poster_path: result.url }));
          showToast("Cover PNG berhasil di-upload!");
        } else if (type === "backdrop") {
          setFormData((prev) => ({ ...prev, backdrop_path: result.url }));
          showToast("Background PNG berhasil di-upload!");
        } else if (type === "video") {
          setFormData((prev) => ({ ...prev, youtube_video_id: result.url }));
          showToast("Video MP4 berhasil di-upload!");
        }
      } else {
        showToast(result.error || "Gagal mengunggah file.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Kesalahan jaringan saat upload.", "error");
    } finally {
      e.target.value = "";
      if (type === "cover") setUploadingCover(false);
      else if (type === "backdrop") setUploadingBackdrop(false);
      else if (type === "video") setUploadingVideo(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.overview.trim()) {
      showToast("Judul dan Sinopsis film wajib diisi.", "error");
      return;
    }

    if (!formData.poster_path.trim()) {
      showToast("File Cover / Poster (PNG/JPG) wajib di-upload.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMovie) {
        // UPDATE FILM
        const res = await fetch("/api/admin/movies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingMovie.id,
            ...formData,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`BERHASIL MEMPERBARUI "${formData.title}"`);
          setIsModalOpen(false);
          fetchSessionAndMovies();
        } else {
          showToast(data.error || "Gagal memperbarui film.", "error");
        }
      } else {
        // CREATE FILM
        const res = await fetch("/api/admin/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`BERHASIL MENAMBAHKAN "${formData.title}" KE KATALOG`);
          setIsModalOpen(false);
          fetchSessionAndMovies();
        } else {
          showToast(data.error || "Gagal menambahkan film.", "error");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Kesalahan jaringan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/movies?id=${movieToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`BERHASIL MENGHAPUS "${movieToDelete.title}"`);
        setMovieToDelete(null);
        fetchSessionAndMovies();
      } else {
        showToast(data.error || "Gagal menghapus film.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Kesalahan jaringan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter movies
  const myMovies = movies.filter(
    (m) =>
      !m.created_by ||
      m.created_by.toLowerCase() === currentAdminEmail.toLowerCase()
  );

  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.overview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 font-mono">
      {/* TOAST BANNER */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 border-4 border-black font-mono text-xs font-black uppercase shadow-brutal-lg flex items-center gap-3 animate-bounce ${
            toastMessage.type === "success"
              ? "bg-brutal-green text-black"
              : "bg-brutal-red text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4 sm:pb-6 bg-white p-4 sm:p-6 shadow-brutal">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest mb-1.5">
            REGISTRY CURATION ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            FILM MANAGEMENT CONSOLE
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-600 mt-1 uppercase font-bold truncate">
            Curated by Admin:{" "}
            <span className="bg-brutal-yellow px-1.5 py-0.5 border border-black text-black">
              {currentAdminEmail}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={fetchSessionAndMovies}
            className="p-2 sm:p-3 border-2 border-black bg-white hover:bg-neutral-100 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 border-2 border-black bg-brutal-yellow text-black font-black uppercase hover:bg-yellow-400 shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD NEW FILM</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="border-4 border-black bg-white p-3.5 sm:p-4 shadow-brutal">
          <div className="text-[10px] text-neutral-500 font-bold uppercase">
            YOUR CURATED FILMS
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-1 text-black">
            {myMovies.length}
          </div>
          <div className="text-[9px] text-neutral-600 mt-1 uppercase">
            Author: {currentAdminEmail.split("@")[0]}
          </div>
        </div>

        <div className="border-4 border-black bg-white p-3.5 sm:p-4 shadow-brutal">
          <div className="text-[10px] text-neutral-500 font-bold uppercase">
            TOTAL ADMIN ENTRIES
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-1 text-brutal-blue">
            {movies.length}
          </div>
          <div className="text-[9px] text-neutral-600 mt-1 uppercase">
            Active in Public Registry
          </div>
        </div>

        <div className="border-4 border-black bg-white p-3.5 sm:p-4 shadow-brutal">
          <div className="text-[10px] text-neutral-500 font-bold uppercase">
            FILE UPLOADS
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 text-brutal-green">
            100% PURE
          </div>
          <div className="text-[9px] text-neutral-600 mt-1 uppercase">
            MP4 & PNG Local Storage
          </div>
        </div>

        <div className="border-4 border-black bg-white p-3.5 sm:p-4 shadow-brutal">
          <div className="text-[10px] text-neutral-500 font-bold uppercase">
            PERMISSIONS
          </div>
          <div className="text-xl font-black mt-1 text-black">
            STRICT OWNER
          </div>
          <div className="text-[9px] text-neutral-600 mt-1 uppercase">
            Author-locked deletion
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="border-4 border-black bg-white p-4 shadow-brutal flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="SEARCH BY TITLE OR SYNOPSIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black font-mono text-xs font-bold uppercase bg-neutral-50 focus:bg-white focus:outline-none pr-8"
          />
          <Search className="w-4 h-4 absolute right-2.5 top-2.5 text-neutral-500" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase cursor-pointer ${
              selectedCategory === "all"
                ? "bg-black text-white shadow-brutal-sm"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            ALL CATEGORIES ({movies.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase cursor-pointer ${
                selectedCategory === cat.value
                  ? "bg-brutal-yellow text-black shadow-brutal-sm"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* MOVIES TABLE / CARDS */}
      {loading ? (
        <div className="border-4 border-black bg-white p-12 text-center shadow-brutal">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p className="font-mono font-bold uppercase text-xs">
            FETCHING FILM REGISTRY DATA...
          </p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="border-4 border-black bg-white p-12 text-center shadow-brutal space-y-4">
          <Film className="w-12 h-12 mx-auto text-neutral-400" />
          <h3 className="text-xl font-black uppercase">NO FILMS FOUND</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            No admin-curated films match your filter. Click below to add your first film to the public registry.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-brutal-yellow text-black font-black uppercase text-xs hover:bg-yellow-400 shadow-brutal-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD FILM NOW</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMovies.map((movie) => {
            const isOwner =
              !movie.created_by ||
              movie.created_by.toLowerCase() === currentAdminEmail.toLowerCase();

            return (
              <div
                key={movie.id}
                className="border-4 border-black bg-white shadow-brutal hover:shadow-brutal-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* TOP BANNER / POSTER */}
                  <div className="relative aspect-[16/9] w-full border-b-4 border-black overflow-hidden bg-neutral-900">
                    <Image
                      src={movie.poster_path || "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    <div className="absolute top-2 left-2 bg-black text-white border-2 border-white px-2 py-0.5 text-[10px] font-black uppercase">
                      {movie.category?.toUpperCase() || "POPULAR"}
                    </div>
                    <div className="absolute top-2 right-2 bg-brutal-yellow text-black border-2 border-black px-2 py-0.5 text-xs font-black flex items-center gap-1 shadow-brutal-sm">
                      <Star className="w-3.5 h-3.5 fill-black" />
                      <span>{movie.vote_average}</span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-black uppercase tracking-tight leading-tight line-clamp-1">
                        {movie.title}
                      </h3>
                      <span className="shrink-0 text-[10px] border border-black px-1.5 py-0.5 font-bold uppercase bg-neutral-100">
                        {movie.release_date?.substring(0, 4) || "2024"}
                      </span>
                    </div>

                    {movie.tagline && (
                      <p className="text-[11px] font-bold text-neutral-600 italic line-clamp-1">
                        "{movie.tagline}"
                      </p>
                    )}

                    <p className="text-xs text-neutral-700 line-clamp-3 leading-relaxed font-sans">
                      {movie.overview}
                    </p>

                    <div className="pt-2 border-t-2 border-dashed border-neutral-300 flex flex-wrap items-center justify-between text-[10px] font-bold text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-black" />
                        <span>{movie.runtime || 120} MIN</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3 text-red-600 fill-red-600" />
                        <span>
                          {movie.youtube_video_id?.includes(".mp4") || movie.youtube_video_id?.startsWith("/uploads/")
                            ? "MP4 TRAILER"
                            : `TRAILER ATTACHED`}
                        </span>
                      </div>
                    </div>

                    {/* OWNER CHIP */}
                    <div className="p-2 border-2 border-black bg-neutral-50 text-[10px] flex items-center justify-between">
                      <span className="font-bold text-neutral-600 uppercase">
                        ADDED BY:
                      </span>
                      <span
                        className={`font-black px-1.5 py-0.5 border border-black ${
                          isOwner
                            ? "bg-brutal-green text-black"
                            : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {isOwner ? "YOU (AUTHOR)" : movie.created_by || "SYSTEM"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="p-4 pt-0 border-t-2 border-black mt-2 pt-3 bg-neutral-50 flex items-center justify-between gap-2">
                  <Link
                    href={`/movies/${movie.id}`}
                    target="_blank"
                    className="flex-1 py-1.5 px-2 border-2 border-black bg-white hover:bg-neutral-100 text-black text-center text-xs font-bold uppercase shadow-brutal-sm flex items-center justify-center gap-1 active:translate-y-0.5"
                  >
                    <span>VIEW</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {isOwner ? (
                    <>
                      <button
                        onClick={() => openEditModal(movie)}
                        className="flex-1 py-1.5 px-2 border-2 border-black bg-brutal-yellow hover:bg-yellow-400 text-black text-center text-xs font-bold uppercase shadow-brutal-sm flex items-center justify-center gap-1 active:translate-y-0.5 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>EDIT</span>
                      </button>

                      <button
                        onClick={() => setMovieToDelete(movie)}
                        className="py-1.5 px-2.5 border-2 border-black bg-brutal-red hover:bg-red-700 text-white text-center text-xs font-bold uppercase shadow-brutal-sm flex items-center justify-center active:translate-y-0.5 cursor-pointer"
                        title="Delete Film"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div
                      className="flex-1 py-1.5 px-2 border-2 border-neutral-300 bg-neutral-100 text-neutral-400 text-center text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-not-allowed"
                      title="Only the creator admin can edit/delete this film"
                    >
                      <Lock className="w-3 h-3" />
                      <span>LOCKED (OTHER ADMIN)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLY RESPONSIVE CLEAN MODAL (PORTALED TO BODY, ZERO GAPS, 100% RESPONSIVE) */}
      {mounted && isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl flex flex-col bg-white sm:border-4 sm:border-black sm:shadow-brutal-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            
            {/* STICKY CLEAN HEADER */}
            <div className="bg-black text-white p-3.5 sm:p-4 border-b-4 border-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-brutal-yellow text-black flex items-center justify-center font-mono font-black border border-white shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-mono tracking-widest text-brutal-yellow uppercase">
                    {editingMovie ? "ADMIN EDIT CONSOLE" : "NEW REGISTRY ENTRY"}
                  </div>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-tight truncate">
                    {editingMovie ? `EDIT: ${editingMovie.title}` : "ADD FILM ENTRY"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 border-2 border-white bg-black hover:bg-brutal-red text-white flex items-center justify-center cursor-pointer transition-colors shrink-0 ml-2"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form
              id="movie-admin-form"
              onSubmit={handleFormSubmit}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white text-xs font-mono"
            >
              {/* TITLE */}
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Judul Film (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Contoh: The Batman Part II"
                  className="w-full px-3 py-2 border-2 border-black font-bold uppercase focus:outline-none focus:bg-neutral-50 text-xs sm:text-sm"
                />
              </div>

              {/* TAGLINE */}
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Tagline Film
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData({ ...formData, tagline: e.target.value })
                  }
                  placeholder="Contoh: The shadows will swallow the light."
                  className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none focus:bg-neutral-50 text-xs sm:text-sm"
                />
              </div>

              {/* METRIC GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* CATEGORY */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-black uppercase mb-1 text-neutral-800">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-2 py-2 border-2 border-black font-bold uppercase focus:outline-none bg-white text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RELEASE DATE */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-black uppercase mb-1 text-neutral-800">
                    Rilis *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.release_date}
                    onChange={(e) =>
                      setFormData({ ...formData, release_date: e.target.value })
                    }
                    className="w-full px-2 py-2 border-2 border-black font-bold focus:outline-none bg-white text-xs"
                  />
                </div>

                {/* VOTE SCORE */}
                <div className="col-span-1">
                  <label className="block font-black uppercase mb-1 text-neutral-800">
                    Rating (1-10) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    required
                    value={formData.vote_average}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vote_average: parseFloat(e.target.value) || 7.5,
                      })
                    }
                    className="w-full px-2 py-2 border-2 border-black font-bold focus:outline-none text-xs"
                  />
                </div>

                {/* RUNTIME */}
                <div className="col-span-1">
                  <label className="block font-black uppercase mb-1 text-neutral-800">
                    Menit (Durasi)
                  </label>
                  <input
                    type="number"
                    value={formData.runtime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        runtime: parseInt(e.target.value) || 120,
                      })
                    }
                    className="w-full px-2 py-2 border-2 border-black font-bold focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* PURE FILE UPLOAD: 1. COVER / POSTER (PNG / JPG) */}
              <div className="border-2 border-black p-3.5 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black uppercase text-xs">
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>Upload Cover / Poster Film (PNG/JPG) *</span>
                  </div>
                  {formData.poster_path && (
                    <span className="text-[10px] font-bold text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> SIAP
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload(e, "cover")}
                  className="hidden"
                />

                {formData.poster_path ? (
                  <div className="flex items-center justify-between gap-3 p-2 bg-white border-2 border-black">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-14 bg-neutral-900 border border-black shrink-0 overflow-hidden">
                        <Image
                          src={formData.poster_path}
                          alt="Cover Thumbnail"
                          fill
                          sizes="40px"
                          unoptimized={formData.poster_path.startsWith("/uploads/")}
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase">
                          Cover Terpasang:
                        </div>
                        <div className="text-xs font-mono font-bold truncate max-w-[200px] sm:max-w-xs">
                          {formData.poster_path.split("/").pop()}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="px-3 py-1.5 border border-black bg-brutal-yellow hover:bg-yellow-400 font-bold uppercase text-[10px] shrink-0 cursor-pointer shadow-brutal-sm"
                    >
                      {uploadingCover ? "Mengunggah..." : "Ganti File PNG"}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="border-2 border-dashed border-black p-4 text-center bg-white hover:bg-yellow-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-1 text-black" />
                    <p className="font-black uppercase text-xs">
                      {uploadingCover ? "SEDANG MENGUNGGAH..." : "+ KLIK UNTUK UPLOAD COVER (PNG / JPG)"}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Pilih file gambar poster dari perangkat Anda
                    </p>
                  </div>
                )}
              </div>

              {/* PURE FILE UPLOAD: 2. BACKDROP / HEADER BACKGROUND (PNG / JPG) */}
              <div className="border-2 border-black p-3.5 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black uppercase text-xs">
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>Upload Background / Backdrop (PNG/JPG)</span>
                  </div>
                  {formData.backdrop_path && (
                    <span className="text-[10px] font-bold text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> SIAP
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={backdropInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload(e, "backdrop")}
                  className="hidden"
                />

                {formData.backdrop_path ? (
                  <div className="flex items-center justify-between gap-3 p-2 bg-white border-2 border-black">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-16 h-10 bg-neutral-900 border border-black shrink-0 overflow-hidden">
                        <Image
                          src={formData.backdrop_path}
                          alt="Backdrop Thumbnail"
                          fill
                          sizes="64px"
                          unoptimized={formData.backdrop_path.startsWith("/uploads/")}
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase">
                          Latar Belakang Terpasang:
                        </div>
                        <div className="text-xs font-mono font-bold truncate max-w-[200px] sm:max-w-xs">
                          {formData.backdrop_path.split("/").pop()}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => backdropInputRef.current?.click()}
                      disabled={uploadingBackdrop}
                      className="px-3 py-1.5 border border-black bg-brutal-yellow hover:bg-yellow-400 font-bold uppercase text-[10px] shrink-0 cursor-pointer shadow-brutal-sm"
                    >
                      {uploadingBackdrop ? "Mengunggah..." : "Ganti File PNG"}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => backdropInputRef.current?.click()}
                    className="border-2 border-dashed border-black p-3.5 text-center bg-white hover:bg-yellow-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1 text-black" />
                    <p className="font-black uppercase text-xs">
                      {uploadingBackdrop ? "SEDANG MENGUNGGAH..." : "+ KLIK UNTUK UPLOAD BACKGROUND (PNG / JPG)"}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Format lanskap lebar 16:9 disarankan (Opsional)
                    </p>
                  </div>
                )}
              </div>

              {/* VIDEO TRAILER: YOUTUBE LINK OR MP4 FILE */}
              <div className="border-2 border-black p-3.5 bg-neutral-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black uppercase text-xs">
                    <Video className="w-4 h-4 text-red-600" />
                    <span>Trailer Video (YouTube Link / MP4)</span>
                  </div>
                  {formData.youtube_video_id && (
                    <span className="text-[10px] font-bold text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> VIDEO SIAP
                    </span>
                  )}
                </div>

                {/* Direct Link Input (Rekomendasi untuk cross-device & online hosting) */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Link YouTube / Video URL (Rekomendasi Lintas Device):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: https://www.youtube.com/watch?v=... atau ID YouTube"
                    value={formData.youtube_video_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        youtube_video_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border-2 border-black text-xs font-mono focus:bg-yellow-50 outline-none"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Bisa masukkan link YouTube lengkap, ID YouTube, atau link MP4 online agar video lancar diputar di Windows & Mobile.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="h-[1px] bg-neutral-300 flex-1"></div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">ATAU UPLOAD MP4 LOKAL</span>
                  <div className="h-[1px] bg-neutral-300 flex-1"></div>
                </div>

                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/mp4,video/webm"
                  onChange={(e) => handleFileUpload(e, "video")}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="w-full py-2 border-2 border-dashed border-black bg-white hover:bg-neutral-100 font-bold uppercase text-[11px] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-neutral-700" />
                  <span>{uploadingVideo ? "Sedang Mengunggah File..." : "Upload File MP4 Dari Komputer / HP"}</span>
                </button>
              </div>

              {/* OVERVIEW / SYNOPSIS */}
              <div>
                <label className="block font-black uppercase mb-1 text-neutral-800">
                  Sinopsis / Overview *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.overview}
                  onChange={(e) =>
                    setFormData({ ...formData, overview: e.target.value })
                  }
                  placeholder="Tuliskan sinopsis singkat dan tema film..."
                  className="w-full px-3 py-2 border-2 border-black font-sans text-xs focus:outline-none leading-relaxed"
                />
              </div>
            </form>

            {/* STICKY FOOTER */}
            <div className="p-3 sm:p-4 border-t-4 border-black bg-neutral-100 flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-200 font-bold uppercase text-xs cursor-pointer active:translate-y-0.5"
              >
                Batal
              </button>
              <button
                type="submit"
                form="movie-admin-form"
                disabled={isSubmitting || uploadingCover || uploadingBackdrop || uploadingVideo}
                className="px-5 py-2.5 border-2 border-black bg-brutal-yellow hover:bg-yellow-400 font-black uppercase shadow-brutal-sm flex items-center gap-2 active:translate-y-0.5 disabled:opacity-50 text-xs cursor-pointer"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingMovie ? "SIMPAN PERUBAHAN" : "PUBLIKASIKAN FILM"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL (PORTALED TO BODY) */}
      {mounted && movieToDelete && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMovieToDelete(null);
          }}
        >
          <div className="border-4 border-black bg-white shadow-brutal-xl max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-brutal-red font-black uppercase text-xs sm:text-sm mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>KONFIRMASI PENGHAPUSAN FILM</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black uppercase leading-tight">
              Hapus permanen film "{movieToDelete.title}"?
            </h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed font-sans">
              Tindakan ini tidak dapat dibatalkan. Film akan dihapus dari semua slider dan hasil pencarian publik.
            </p>
            <div className="p-3 bg-neutral-100 border-2 border-black my-4 text-xs font-mono space-y-1">
              <div>ID: #{movieToDelete.id}</div>
              <div className="truncate">Author: {movieToDelete.created_by || currentAdminEmail}</div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMovieToDelete(null)}
                className="px-4 py-2 border-2 border-black bg-white font-bold uppercase hover:bg-neutral-100 text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="px-4 sm:px-5 py-2 border-2 border-black bg-brutal-red text-white font-black uppercase hover:bg-red-700 shadow-brutal-sm text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>HAPUS PERMANEN</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
