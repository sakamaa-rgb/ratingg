"use client";

import { useState } from "react";
import PeekRating from "@/components/PeekRating";
import GlitchButton from "@/components/animations/GlitchButton";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ReviewFormProps {
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  onReviewAdded?: (review: {
    id: string;
    author: string;
    rating: number;
    text: string;
    createdAt: string;
  }) => void;
}

export default function ReviewForm({
  movieId,
  movieTitle,
  moviePoster = "",
  onReviewAdded,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg("Isi ulasan tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const operatorHandle =
      author.trim() ||
      (typeof window !== "undefined"
        ? localStorage.getItem("brutal_user_email")?.split("@")[0]
        : null) ||
      "verified_cinephile";

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          movieTitle,
          moviePoster,
          author: operatorHandle,
          rating,
          comment: comment.trim(),
          status: "approved",
        }),
      });

      const data = await res.json();

      if (res.ok && data.review) {
        if (onReviewAdded) {
          onReviewAdded({
            id: data.review.id,
            author: data.review.author,
            rating: data.review.rating,
            text: data.review.comment,
            createdAt: data.review.createdAt.split("T")[0],
          });
        }
        setSubmitted(true);
        setComment("");
        setTimeout(() => setSubmitted(false), 4000);
      } else {
        setErrorMsg(data.error || "Gagal menyimpan ulasan.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Kesalahan jaringan saat mengirim ulasan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-4 border-black bg-white p-4 sm:p-6 shadow-brutal font-mono">
      <div className="border-b-2 border-black pb-3 mb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
          DISPATCH CRITICAL ASSESSMENT
        </h3>
        <p className="text-[11px] sm:text-xs text-neutral-600 uppercase font-bold">
          Film: {movieTitle} [ID: #{movieId}]
        </p>
      </div>

      {submitted && (
        <div className="mb-4 p-3 bg-brutal-green text-black border-2 border-black text-xs font-bold flex items-center gap-2 shadow-brutal-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>ULASAN REAL BERHASIL DISIMPAN & MASUK KE DATABASE!</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-brutal-red text-white border-2 border-black text-xs font-bold flex items-center gap-2 shadow-brutal-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase mb-1">
            1. Assign Rating (Hover / Click To Rate)
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 border-2 border-black p-2.5 sm:p-3">
            <div className="overflow-x-auto py-1">
              <PeekRating
                value={rating}
                count={5}
                shape="star"
                labels={["1.0 Poor", "2.0 Fair", "3.0 Good", "4.0 Great", "5.0 Masterwork"]}
                activeColor="#FFE600"
                idleColor="#71717A"
                tipColor="#000000"
                tipTextColor="#FFE600"
                size={28}
                lift={6}
                magnify={1.12}
                riseDuration={300}
                popScale={1.2}
                showTip
                allowClear={false}
                onChange={(val) => setRating(val || 1)}
              />
            </div>
            <span className="font-black text-sm sm:text-lg bg-black text-white px-2.5 py-1 border border-black shrink-0">
              {rating}.0 / 5.0
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">
            2. Operator Handle / Nama Pengulas (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: movie_buff_zero"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black bg-white font-mono text-xs font-bold focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">
            3. Isi Ulasan / Review Kritis *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Tuliskan ulasan nyata mengenai film ini (alasan, sinematografi, akting, atau penilaian personal)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black bg-white font-sans text-xs focus:outline-none leading-relaxed"
          />
        </div>

        <GlitchButton variant="primary" type="submit" disabled={loading} className="w-full">
          {loading ? "MENYIMPAN KE DATABASE..." : "PUBLIKASIKAN ULASAN REAL"}
        </GlitchButton>
      </form>
    </div>
  );
}
