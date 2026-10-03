"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Database, Key, ArrowRight, Copy, ExternalLink, AlertTriangle } from "lucide-react";

const PROJECT_REF = "bmrkqohudimwhiuovxtg";

const SQL_SCRIPT = `-- JALANKAN DI SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new

CREATE TABLE IF NOT EXISTS public.movies (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT,
  overview TEXT NOT NULL,
  poster_path TEXT NOT NULL DEFAULT '',
  backdrop_path TEXT,
  release_date TEXT,
  vote_average NUMERIC DEFAULT 7.5,
  vote_count INTEGER DEFAULT 1,
  category TEXT DEFAULT 'popular',
  runtime INTEGER DEFAULT 120,
  genres JSONB DEFAULT '[]'::jsonb,
  youtube_video_id TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  movie_id BIGINT NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  author TEXT NOT NULL DEFAULT 'anonymous',
  rating NUMERIC NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.movies TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';`;

interface TableStatus {
  movies: boolean;
  users: boolean;
  reviews: boolean;
}

export default function SetupPage() {
  const [serviceKey, setServiceKey] = useState("");
  const [status, setStatus] = useState<TableStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/setup");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.tables);
        if (data.allReady) {
          setResult({ success: true, message: "Semua tabel sudah aktif! Supabase sudah terhubung ke Windows & Mobile." });
        }
      }
    } catch {}
    setChecking(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const runAutoSetup = async () => {
    setAutoRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceRoleKey: serviceKey }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
      if (data.tables) setStatus(data.tables);
    } catch (e: any) {
      setResult({ success: false, message: "Gagal koneksi ke server." });
    }
    setAutoRunning(false);
  };

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const allGood = status?.movies && status?.users && status?.reviews;

  return (
    <div className="min-h-screen bg-white font-mono p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-4 border-black bg-black text-white p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-7 h-7 text-yellow-400" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              SUPABASE DATABASE SETUP
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 font-bold">
            Project: <span className="text-yellow-400">{PROJECT_REF}.supabase.co</span>
          </p>
        </div>

        {/* Status Cards */}
        <div className="border-4 border-black p-4 sm:p-6 space-y-3">
          <h2 className="font-black uppercase text-sm tracking-widest mb-4">STATUS TABEL DATABASE</h2>
          {checking ? (
            <div className="flex items-center gap-2 text-sm font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              Memeriksa koneksi Supabase...
            </div>
          ) : (
            <div className="space-y-2">
              {(["movies", "users", "reviews"] as const).map((table) => (
                <div
                  key={table}
                  className={`flex items-center justify-between border-2 px-4 py-2 ${
                    status?.[table] ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                  }`}
                >
                  <span className="font-black uppercase text-sm">
                    public.<span className="text-blue-700">{table}</span>
                  </span>
                  {status?.[table] ? (
                    <div className="flex items-center gap-1.5 text-green-700 font-black text-xs">
                      <CheckCircle className="w-4 h-4" />
                      AKTIF
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-700 font-black text-xs">
                      <XCircle className="w-4 h-4" />
                      BELUM ADA
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!checking && (
            <button
              onClick={checkStatus}
              className="mt-2 px-4 py-2 border-2 border-black bg-white font-black text-xs uppercase hover:bg-neutral-100 flex items-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5" />
              CEK ULANG STATUS
            </button>
          )}
        </div>

        {/* Success Banner */}
        {allGood && (
          <div className="border-4 border-green-600 bg-green-50 p-4 sm:p-6 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-black text-green-800 uppercase text-sm">DATABASE BERHASIL TERHUBUNG!</span>
            </div>
            <p className="text-sm text-green-700 font-bold">
              Semua tabel aktif. Film yang ditambahkan di Windows akan langsung muncul di HP dan perangkat lain.
            </p>
            <Link
              href="/admin/movies"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-black text-xs uppercase hover:bg-neutral-800 border-2 border-black mt-2"
            >
              <ArrowRight className="w-4 h-4" />
              KEMBALI KE ADMIN FILM
            </Link>
          </div>
        )}

        {/* Result Banner */}
        {result && !allGood && (
          <div className={`border-4 p-4 ${result.success ? "border-green-600 bg-green-50" : "border-red-500 bg-red-50"}`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <p className="font-black text-sm uppercase">{result.message}</p>
            </div>
          </div>
        )}

        {/* Method 1: Auto Setup with Service Key */}
        {!allGood && (
          <div className="border-4 border-black p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-black text-white w-6 h-6 flex items-center justify-center font-black text-sm shrink-0">1</div>
              <h2 className="font-black uppercase text-sm tracking-widest">SETUP OTOMATIS (Direkomendasikan)</h2>
            </div>
            <p className="text-xs font-bold text-neutral-600">
              Masukkan <strong>Service Role Key</strong> dari Supabase Dashboard untuk setup otomatis tanpa perlu SQL Editor.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase">
                Service Role Key
              </label>
              <input
                type="password"
                value={serviceKey}
                onChange={(e) => setServiceKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full border-2 border-black px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
              <p className="text-[10px] text-neutral-500 font-bold">
                Ambil dari:{" "}
                <a
                  href={`https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard → Project Settings → API → service_role
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <button
              onClick={runAutoSetup}
              disabled={autoRunning}
              className="w-full py-3 border-2 border-black bg-yellow-400 text-black font-black uppercase text-sm hover:bg-yellow-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {autoRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SEDANG SETUP...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  SETUP OTOMATIS SEKARANG
                </>
              )}
            </button>
          </div>
        )}

        {/* Method 2: Manual SQL */}
        {!allGood && (
          <div className="border-4 border-black p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-black text-white w-6 h-6 flex items-center justify-center font-black text-sm shrink-0">2</div>
              <h2 className="font-black uppercase text-sm tracking-widest">SETUP MANUAL (SQL Editor)</h2>
            </div>
            <ol className="text-xs font-bold space-y-1.5 text-neutral-700 list-decimal list-inside">
              <li>
                Buka{" "}
                <a
                  href={`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline inline-flex items-center gap-0.5"
                >
                  Supabase SQL Editor
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Klik tombol <strong>COPY SQL</strong> di bawah</li>
              <li>Paste (Ctrl+V) di SQL Editor, lalu klik tombol hijau <strong>RUN</strong></li>
              <li>Kembali ke sini dan klik <strong>CEK ULANG STATUS</strong></li>
            </ol>

            <div className="border-2 border-black bg-neutral-900 text-green-400 p-3 text-[10px] font-mono max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-all">{SQL_SCRIPT}</pre>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={copySQL}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white font-black text-xs uppercase hover:bg-neutral-800"
              >
                <Copy className="w-4 h-4" />
                {copied ? "TERSALIN!" : "COPY SQL"}
              </button>
              <a
                href={`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white text-black font-black text-xs uppercase hover:bg-neutral-100"
              >
                <ExternalLink className="w-4 h-4" />
                BUKA SQL EDITOR
              </a>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="flex gap-3">
          <Link
            href="/admin/movies"
            className="px-4 py-2 border-2 border-black bg-white text-black font-black text-xs uppercase hover:bg-neutral-100"
          >
            ← ADMIN FILMS
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 border-2 border-black bg-white text-black font-black text-xs uppercase hover:bg-neutral-100"
          >
            ← ADMIN PANEL
          </Link>
        </div>
      </div>
    </div>
  );
}
