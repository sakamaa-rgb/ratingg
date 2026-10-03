"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Film,
  Shield,
  LogOut,
  LogIn,
  User,
  Search,
  ChevronDown,
  Flame,
  PlaySquare,
  Star,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [filmDropdownOpen, setFilmDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check session reliably from localStorage, server, and client cookies
    const checkAuth = async () => {
      // 1. Instant client-side storage & cookie read
      const localEmail = typeof window !== "undefined" ? localStorage.getItem("brutal_user_email") : null;
      const localRole = typeof window !== "undefined" ? localStorage.getItem("brutal_user_role") : null;

      const getCookie = (name: string) => {
        const matches = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
        return matches ? decodeURIComponent(matches[1]) : null;
      };

      const cachedEmail = localEmail || getCookie("brutal_user_email");
      const cachedRole = localRole || getCookie("brutal_user_role");
      if (cachedEmail) {
        const clean = cachedEmail.toLowerCase().trim();
        const isStrictAdmin = clean === "adminflix123@gmail.com";
        setIsAuthenticated(true);
        setUserEmail(cachedEmail);
        setUserRole(isStrictAdmin ? "admin" : "user");
      }

      // 2. Authoritative server check via /api/auth/me
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setUserEmail(data.email);
            setUserRole(data.role || "user");
            return;
          }
        }
      } catch (e) {}

      if (!cachedEmail) {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserRole("user");
      }
    };

    checkAuth();

    // Listen to real-time auth changes across tabs and login/logout actions
    const handleAuthChange = () => checkAuth();
    window.addEventListener("ratezero_auth_change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("ratezero_auth_change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFilmDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    localStorage.removeItem("brutal_user_email");
    localStorage.removeItem("brutal_user_role");

    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole("user");
    setProfileDropdownOpen(false);
    
    window.dispatchEvent(new Event("ratezero_auth_change"));
    window.location.href = "/login";
  };

  // Hide standard navbar on /admin routes to prioritize the dedicated admin layout
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black text-white flex items-center justify-center font-mono font-black border-2 border-black group-hover:bg-brutal-yellow group-hover:text-black transition-colors shrink-0">
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-black text-lg sm:text-xl tracking-tighter uppercase leading-none">
              RATE//ZERO
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-neutral-600 uppercase">
              100% LEGAL
            </span>
          </div>
        </Link>

        {/* AUTH ROUTE VIEW: ONLY SHOW ADMIN BUTTON */}
        {isAuthRoute ? (
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold uppercase px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-black bg-brutal-yellow text-black hover:bg-yellow-400 shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </nav>
        ) : (
          <>
            {/* SEARCH INPUT BAR */}
            <div className="flex-1 max-w-md hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="SEARCH CATALOG (TITLE, DIRECTOR, GENRE)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black bg-white focus:outline-none focus:bg-neutral-50 pr-8"
                />
                <button
                  type="submit"
                  title="Execute Search"
                  className="absolute right-0 top-0 bottom-0 px-2.5 bg-black text-white hover:bg-brutal-yellow hover:text-black transition-colors flex items-center justify-center"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* NAVIGATION & DROPDOWNS */}
            <nav className="flex items-center gap-2 sm:gap-3">
              
              {/* FILM DROPDOWN BUTTON */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setFilmDropdownOpen(!filmDropdownOpen)}
                  className={`flex items-center gap-1 sm:gap-1.5 font-mono text-[11px] sm:text-xs font-black uppercase px-2.5 sm:px-3 py-1.5 sm:py-2 border-2 border-black transition-all ${
                    filmDropdownOpen
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-neutral-100 shadow-brutal-sm"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">FILM CATEGORIES</span>
                  <span className="sm:hidden">FILMS</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      filmDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* BRUTALIST DROPDOWN MENU */}
                {filmDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] border-4 border-black bg-white shadow-brutal-lg z-50 font-mono text-xs">
                    <div className="bg-black text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase">
                      SELECT REGISTRY FILTER
                    </div>

                    <div className="divide-y-2 divide-black">
                      <Link
                        href="/?category=popular"
                        onClick={() => setFilmDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 font-bold uppercase hover:bg-brutal-yellow hover:text-black transition-colors"
                      >
                        <Flame className="w-4 h-4 text-brutal-red" />
                        <div>
                          <div>POPULAR (TERPOPULER)</div>
                          <div className="text-[9px] text-neutral-500 font-normal">Trending community films</div>
                        </div>
                      </Link>

                      <Link
                        href="/?category=now_playing"
                        onClick={() => setFilmDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 font-bold uppercase hover:bg-brutal-yellow hover:text-black transition-colors"
                      >
                        <PlaySquare className="w-4 h-4 text-brutal-blue" />
                        <div>
                          <div>NOW PLAYING (SEDANG TAYANG)</div>
                          <div className="text-[9px] text-neutral-500 font-normal">Current theatrical entries</div>
                        </div>
                      </Link>

                      <Link
                        href="/?category=top_rated"
                        onClick={() => setFilmDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 font-bold uppercase hover:bg-brutal-yellow hover:text-black transition-colors"
                      >
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <div>
                          <div>TOP RATED (RATING TERTINGGI)</div>
                          <div className="text-[9px] text-neutral-500 font-normal">All-time critical masterworks</div>
                        </div>
                      </Link>

                      <Link
                        href="/?category=upcoming"
                        onClick={() => setFilmDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 font-bold uppercase hover:bg-brutal-yellow hover:text-black transition-colors"
                      >
                        <Clock className="w-4 h-4 text-brutal-green" />
                        <div>
                          <div>UPCOMING (SEGERA HADIR)</div>
                          <div className="text-[9px] text-neutral-500 font-normal">Verified official trailers</div>
                        </div>
                      </Link>

                      <Link
                        href="/"
                        onClick={() => setFilmDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 font-bold uppercase bg-neutral-100 hover:bg-black hover:text-white transition-colors"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>VIEW ALL TITLES (RESET)</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ADMIN SHORTCUT BUTTON (ONLY RENDER IF ADMIN ROLE) */}
              {userRole === "admin" && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-2 border-2 border-black bg-brutal-yellow text-black hover:bg-yellow-400 shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* USER PROFILE CARD & DIRECT LOGOUT BUTTON */}
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 sm:py-1 border-2 border-black bg-white hover:bg-neutral-100 shadow-brutal-sm cursor-pointer"
                    >
                      {/* AVATAR BOX */}
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-brutal-yellow border border-black flex items-center justify-center font-mono font-black text-xs text-black uppercase shrink-0">
                        {userEmail ? userEmail[0].toUpperCase() : "U"}
                      </div>
                      {/* HANDLE */}
                      <div className="hidden xs:flex flex-col text-left pr-1 leading-none font-mono">
                        <span className="text-[10px] sm:text-[11px] font-black truncate max-w-[80px] sm:max-w-[130px]">
                          {userEmail?.split("@")[0]}
                        </span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                          {userRole === "admin" ? "ADMIN" : "MEMBER"}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    </button>

                    {/* PROFILE MODAL / DROPDOWN */}
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 border-4 border-black bg-white shadow-brutal-lg z-50 font-mono text-xs">
                        {/* USER INFO HEADER */}
                        <div className="p-3 bg-black text-white border-b-2 border-black">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-brutal-yellow border border-white text-black font-black flex items-center justify-center text-xs">
                              {userEmail ? userEmail[0].toUpperCase() : "U"}
                            </div>
                            <span className="font-bold text-brutal-yellow text-[10px] tracking-wider uppercase">
                              {userRole === "admin" ? "ADMINISTRATOR" : "VERIFIED MEMBER"}
                            </span>
                          </div>
                          <p className="font-mono text-xs font-bold truncate text-white">
                            {userEmail}
                          </p>
                        </div>

                        {/* STATUS CHIPS */}
                        <div className="p-3 space-y-2 border-b-2 border-black bg-neutral-50 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600 font-bold uppercase">Role:</span>
                            <span
                              className={`border border-black px-1.5 py-0.5 font-bold uppercase text-[9px] ${
                                userRole === "admin"
                                  ? "bg-brutal-yellow text-black"
                                  : "bg-neutral-200 text-black"
                              }`}
                            >
                              {userRole.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600 font-bold uppercase">Ratings:</span>
                            <span className="font-bold">5-Star Community Access</span>
                          </div>
                        </div>

                        {/* LINKS & TERMINATE */}
                        <div className="p-2 space-y-1">
                          {userRole === "admin" && (
                            <>
                              <Link
                                href="/admin"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 border border-black bg-white hover:bg-brutal-yellow font-bold uppercase text-black text-[11px]"
                              >
                                <Shield className="w-3.5 h-3.5" />
                                <span>Admin Dashboard</span>
                              </Link>
                              <Link
                                href="/admin/movies"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 border border-black bg-white hover:bg-brutal-yellow font-bold uppercase text-black text-[11px]"
                              >
                                <Film className="w-3.5 h-3.5" />
                                <span>Manage Films</span>
                              </Link>
                            </>
                          )}

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-brutal-red text-white border border-black font-bold uppercase hover:bg-red-700 active:translate-y-0.5 text-[11px] transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>LOG OUT</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DIRECT HIGH-VISIBILITY LOGOUT BUTTON (HIDDEN ON MOBILE VIEWPORTS) */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-2 border-2 border-black bg-white hover:bg-brutal-red hover:text-white shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] transition-colors cursor-pointer"
                    title="Log out of account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs font-bold uppercase px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
              )}
            </nav>
          </>
        )}
      </div>

      {/* MOBILE SEARCH BAR */}
      {!isAuthRoute && (
        <div className="md:hidden border-t-2 border-black p-2 bg-neutral-100">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="SEARCH CATALOG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black bg-white focus:outline-none pr-8"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-2.5 bg-black text-white hover:bg-brutal-yellow hover:text-black flex items-center justify-center"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
