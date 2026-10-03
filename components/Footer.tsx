"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Do not render public site footer on /admin routes to keep admin console clean and dedicated
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full border-t-4 border-black bg-black text-white p-6 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="font-bold text-sm tracking-wider uppercase text-brutal-yellow">
            RATE//ZERO [VERIFIED LEGAL REPOSITORY]
          </p>
          <p className="text-neutral-400 mt-1">
            Metadata provided by TMDB. Official trailer media embedded via YouTube API.
          </p>
        </div>
        <div className="text-neutral-400 md:text-right">
          <p>NO PIRACY. NO HOSTED STREAMS. 100% LEGAL.</p>
          <p className="mt-1 text-neutral-500">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
