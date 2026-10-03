"use client";

import { ShieldCheck, Database, Film, CheckCircle2 } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="mt-10 pt-4 font-mono text-xs">
      <div className="border-4 border-black bg-white p-4 sm:p-5 shadow-brutal flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* BRAND & SECURITY STATUS */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black text-brutal-yellow border-2 border-black flex items-center justify-center font-black shrink-0 shadow-brutal-xs">
            <ShieldCheck className="w-5 h-5 text-brutal-yellow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black uppercase text-sm tracking-tight text-black">
                RATE//ADMIN CONSOLE
              </span>
              <span className="bg-brutal-green text-black px-1.5 py-0.5 text-[9px] font-black uppercase border border-black">
                100% OPERATIONAL
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 font-bold uppercase mt-0.5">
              Secure Brutalist Control Environment • Clearance Level 01
            </p>
          </div>
        </div>

        {/* SYSTEM STATUS BADGES */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 border-2 border-black">
            <Database className="w-3.5 h-3.5 text-black shrink-0" />
            <span>SUPABASE: <strong className="text-brutal-green">CONNECTED</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 border-2 border-black">
            <Film className="w-3.5 h-3.5 text-black shrink-0" />
            <span>TMDB v3: <strong className="text-black">ACTIVE</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 border-2 border-black">
            <span className="w-2 h-2 rounded-full bg-brutal-green inline-block animate-pulse shrink-0"></span>
            <span>NODE: <strong className="text-black">ONLINE</strong></span>
          </div>
        </div>
      </div>

      {/* COMPLIANCE & ATTRIBUTION BAR */}
      <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-neutral-500 font-bold uppercase px-1">
        <span>© 2026 RATE//ZERO — FILM REGISTRY SYSTEM</span>
        <span>Official YouTube IFrame API Embed Only • 100% Legal Compliance</span>
      </div>
    </footer>
  );
}
