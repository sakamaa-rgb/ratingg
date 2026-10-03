"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DecryptedText from "@/components/animations/DecryptedText";
import GlitchButton from "@/components/animations/GlitchButton";
import { AlertTriangle, CheckCircle2, Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/";
  const registeredParam = searchParams.get("registered") === "true";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("brutal_user_email", data.email);
        localStorage.setItem("brutal_user_role", data.role);
        window.dispatchEvent(new Event("ratezero_auth_change"));
        window.location.href = redirectedFrom || "/";
      } else {
        setErrorMsg(data.error || "Login gagal. Periksa email dan password.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg("Kesalahan jaringan. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border-4 border-black bg-white shadow-brutal-xl p-6 sm:p-8">
      {/* ANIMATED TITLE */}
      <div className="mb-6 border-b-2 border-black pb-4">
        <div className="inline-block bg-black text-white px-2 py-0.5 text-xs font-mono font-bold tracking-widest uppercase mb-2">
          RESTRICTED ACCESS
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight uppercase">
          <DecryptedText
            text="AUTHENTICATE"
            speed={45}
            maxIterations={16}
            className="text-black"
            encryptedClassName="text-brutal-red font-mono"
          />
        </h1>
        <p className="text-xs font-mono text-neutral-600 mt-1 uppercase">
          Masukkan email dan password untuk masuk
        </p>
      </div>

      {/* REGISTRATION CONFIRMED BANNER */}
      {registeredParam && (
        <div className="mb-6 p-3 bg-brutal-green text-black border-2 border-black font-mono text-xs flex items-start gap-2 shadow-brutal-sm font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="uppercase">REGISTRASI BERHASIL:</span> Silakan masuk dengan email dan password yang sudah didaftarkan.
          </div>
        </div>
      )}

      {/* ERROR NOTIFICATION */}
      {errorMsg && (
        <div className="mb-6 p-3 bg-brutal-red text-white border-2 border-black font-mono text-xs flex items-start gap-2 shadow-brutal-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase">ERROR: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* EMAIL & PASSWORD FORM */}
      <form onSubmit={handleLogin} className="space-y-4">
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
            Password
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

        <GlitchButton
          variant="primary"
          type="submit"
          disabled={loading}
          className="w-full mt-2"
        >
          {loading ? "AUTHENTICATING..." : "SIGN IN"}
        </GlitchButton>
      </form>

      {/* FOOTER LINK */}
      <div className="mt-6 text-center font-mono text-xs border-t-2 border-black pt-4">
        <span className="text-neutral-600">BELUM PUNYA AKUN? </span>
        <Link
          href="/register"
          className="font-bold underline uppercase hover:text-brutal-blue"
        >
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-white">
      <Suspense
        fallback={
          <div className="border-4 border-black p-8 font-mono font-bold text-sm bg-white shadow-brutal">
            LOADING SECURE TERMINAL...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
