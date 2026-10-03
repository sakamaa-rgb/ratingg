"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquareQuote,
  Settings,
  LogOut,
  Film,
  Clapperboard,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Manage Films", href: "/admin/movies", icon: Clapperboard },
  { label: "Manage Users", href: "/admin/users", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquareQuote },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string>("adminflix123@gmail.com");

  useEffect(() => {
    const email = localStorage.getItem("brutal_user_email");
    if (email) setAdminEmail(email);

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.email) setAdminEmail(data.email);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    localStorage.removeItem("brutal_user_email");
    localStorage.removeItem("brutal_user_role");
    onCloseMobile?.();
    window.location.href = "/login";
  };

  const handleLinkClick = () => {
    onCloseMobile?.();
  };

  const sidebarContent = (
    <aside className="w-64 max-w-[85vw] border-r-4 border-black bg-white flex flex-col justify-between h-full select-none">
      {/* HEADER & BRAND */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="p-4 sm:p-5 border-b-4 border-black bg-black text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brutal-yellow text-black flex items-center justify-center font-mono font-black border border-white">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono font-black text-base sm:text-lg tracking-tighter uppercase leading-none text-white">
                RATE//ADMIN
              </div>
              <div className="text-[10px] font-mono tracking-widest text-brutal-yellow uppercase mt-0.5">
                SECURITY LEVEL 01
              </div>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1 bg-brutal-red text-white border border-white hover:bg-red-700 font-mono text-[10px] font-black uppercase px-2 cursor-pointer"
            aria-label="Tutup menu"
          >
            ✕ TUTUP
          </button>
        </div>

        {/* NAVIGATION LIST (SCROLLABLE IF WINDOW HEIGHT IS LOW) */}
        <div className="p-3 overflow-y-auto flex-1">
          <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase px-3 py-1.5">
            Core Modules
          </div>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 font-mono text-xs font-bold uppercase border-2 transition-all ${
                    isActive
                      ? "bg-brutal-yellow text-black border-black shadow-brutal-sm translate-x-1"
                      : "bg-white text-black border-transparent hover:border-black hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* EXTERNAL VIEW MAIN SITE LINK */}
          <div className="pt-3">
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center justify-between px-3 py-2 border-2 border-dashed border-neutral-400 font-mono text-xs font-bold uppercase text-neutral-700 hover:border-black hover:text-black transition-colors"
            >
              <span>Public Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER & LOGOUT */}
      <div className="p-3 sm:p-4 border-t-4 border-black bg-neutral-100 shrink-0">
        <div className="mb-2.5 px-1">
          <p className="font-mono text-[10px] uppercase text-neutral-500 font-bold">
            SESSION ACTIVE
          </p>
          <p className="font-mono text-xs font-black truncate text-black" title={adminEmail}>
            {adminEmail}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-brutal-red text-white border-2 border-black font-mono text-xs font-black uppercase shadow-brutal-sm hover:bg-red-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>TERMINATE SESSION</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* DESKTOP PERMANENT FIXED SIDEBAR (NEVER SCROLLS WITH PAGE) */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="fixed top-0 bottom-0 left-0 w-64 z-30 h-screen">
          {sidebarContent}
        </div>
      </div>

      {/* MOBILE BACKDROP & DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
