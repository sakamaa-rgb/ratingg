"use client";

import { useState } from "react";
import Link from "next/link";
import DecryptedText from "@/components/animations/DecryptedText";
import GlitchButton from "@/components/animations/GlitchButton";
import { AlertTriangle, CheckCircle, Mail, Lock, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Password tidak cocok.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg("REGISTRASI BERHASIL! Mengalihkan ke halaman login...");
        setTimeout(() => {
          window.location.href = `/login?registered=true&email=${encodeURIComponent(email)}`;
        }, 1200);
      } else {
        setErrorMsg(data.error || "Gagal mendaftar. Coba lagi.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg("Kesalahan jaringan. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md border-4 border-black bg-white shadow-brutal-xl p-6 sm:p-8">
        
        {/* ANIMATED TITLE */}
        <div className="mb-6 border-b-2 border-black pb-4">
          <div className="inline-block bg-black text-white px-2 py-0.5 text-xs font-mono font-bold tracking-widest uppercase mb-2">
            REGISTRATION GATE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight uppercase">
            <DecryptedText
              text="DAFTAR AKUN"
              speed={45}
              maxIterations={16}
              className="text-black"
              encryptedClassName="text-brutal-yellow font-mono"
            />
          </h1>
          <p className="text-xs font-mono text-neutral-600 mt-1 uppercase">
            Buat akun untuk memberikan rating dan ulasan film
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-brutal-red text-white border-2 border-black font-mono text-xs flex items-start gap-2 shadow-brutal-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-brutal-green text-black border-2 border-black font-mono text-xs flex items-start gap-2 shadow-brutal-sm font-bold">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              className="w-full px-3 py-2.5 font-mono text-sm border-2 border-black bg-white focus:outline-none focus:bg-neutral-50 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Password (Min 6 Karakter)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 font-mono text-sm border-2 border-black bg-white focus:outline-none focus:bg-neutral-50 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Konfirmasi Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 font-mono text-sm border-2 border-black bg-white focus:outline-none focus:bg-neutral-50 focus:ring-2 focus:ring-black"
            />
          </div>

          <GlitchButton
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? "MENDAFTAR..." : "DAFTAR SEKARANG"}
          </GlitchButton>
        </form>

        <div className="mt-6 text-center font-mono text-xs border-t-2 border-black pt-4">
          <span className="text-neutral-600">SUDAH PUNYA AKUN? </span>
          <Link
            href="/login"
            className="font-bold underline uppercase hover:text-brutal-blue"
          >
            Masuk Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
