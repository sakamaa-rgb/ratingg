"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-neutral-100 text-black relative">
      {/* FIXED BRUTALIST SIDEBAR (DESKTOP + MOBILE DRAWER) */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* TOP CONTROL STRIP */}
        <header className="h-14 border-b-4 border-black bg-white px-3 sm:px-6 flex items-center justify-between font-mono text-xs select-none shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden px-2.5 py-1.5 border-2 border-black bg-brutal-yellow text-black cursor-pointer shadow-brutal-xs flex items-center gap-1.5 font-bold text-xs shrink-0 active:translate-y-0.5"
              aria-label="Buka menu admin"
            >
              <Menu className="w-4 h-4" />
              <span className="text-[10px] font-black">MENU</span>
            </button>

            <span className="bg-black text-white font-bold px-2 py-0.5 uppercase tracking-widest text-[10px] sm:text-[11px] shrink-0">
              SYSTEM CONSOLE
            </span>
            <span className="hidden sm:inline font-bold text-neutral-600 truncate">
              TMDB_SYNC: <strong className="text-brutal-green">CONNECTED</strong>
            </span>
            <span className="hidden xl:inline font-bold text-neutral-600 truncate">
              COMPLIANCE: <strong className="text-black">100%</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-[10px] sm:text-xs">
              <span className="w-2.5 h-2.5 bg-brutal-green border border-black inline-block animate-pulse"></span>
              <span className="hidden sm:inline">NODE_ONLINE</span>
            </div>
          </div>
        </header>

        {/* CONTENT WRAPPER (SCROLLS INDEPENDENTLY ON DESKTOP) */}
        <main className="flex-1 p-3 sm:p-5 md:p-8 bg-neutral-50 lg:overflow-y-auto min-w-0 flex flex-col justify-between">
          <div className="max-w-7xl mx-auto w-full flex-1">{children}</div>
          <div className="max-w-7xl mx-auto w-full">
            <AdminFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
