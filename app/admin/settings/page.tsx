"use client";

import { useState } from "react";
import GlitchButton from "@/components/animations/GlitchButton";
import { Save, Check, RefreshCw } from "lucide-react";

export default function AdminSettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [allowPublicReviews, setAllowPublicReviews] = useState(true);
  const [strictModeration, setStrictModeration] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 font-mono max-w-3xl">
      <div className="border-b-4 border-black pb-4">
        <div className="inline-block bg-black text-white px-2 py-0.5 text-xs font-bold uppercase tracking-widest mb-1">
          CONFIGURATION
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight">
          SYSTEM PARAMETERS
        </h1>
      </div>

      {saved && (
        <div className="p-3 bg-brutal-green text-black border-2 border-black font-bold text-xs flex items-center gap-2 shadow-brutal-sm">
          <Check className="w-4 h-4" />
          <span>CONFIG UPDATES APPLIED TO RUNTIME BUFFER.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* TMDB API INTEGRATION */}
        <div className="border-4 border-black bg-white p-5 shadow-brutal">
          <h2 className="text-sm font-black uppercase mb-2">
            1. TMDB API CREDENTIALS (LEGAL SOURCE)
          </h2>
          <p className="text-xs text-neutral-600 mb-4 font-sans">
            Supplies official posters, metadata, and verified YouTube trailer keys. If left empty, the application uses built-in verified entries.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              TMDB v3 API Key
            </label>
            <input
              type="password"
              placeholder="e.g. 3a8f9024c..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black font-mono text-sm bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* MODERATION POLICIES */}
        <div className="border-4 border-black bg-white p-5 shadow-brutal space-y-4">
          <h2 className="text-sm font-black uppercase mb-2">
            2. MODERATION & GOVERNANCE RULES
          </h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={strictModeration}
              onChange={(e) => setStrictModeration(e.target.checked)}
              className="w-5 h-5 accent-black border-2 border-black rounded-none mt-0.5"
            />
            <div>
              <span className="text-xs font-bold uppercase block">
                Enable Pre-Moderation Queue
              </span>
              <span className="text-xs text-neutral-600 font-sans block">
                User reviews must be approved by an administrator before displaying publicly on film pages.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowPublicReviews}
              onChange={(e) => setAllowPublicReviews(e.target.checked)}
              className="w-5 h-5 accent-black border-2 border-black rounded-none mt-0.5"
            />
            <div>
              <span className="text-xs font-bold uppercase block">
                Permit Community Ratings (5-Star Engine)
              </span>
              <span className="text-xs text-neutral-600 font-sans block">
                Enables verified users to cast 1 to 5 star ratings linked to their verified account profile.
              </span>
            </div>
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <GlitchButton variant="primary" type="submit">
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              SAVE SYSTEM CONFIG
            </span>
          </GlitchButton>

          <button
            type="button"
            onClick={() => alert("TMDB Cache invalidated successfully.")}
            className="px-4 py-3 border-2 border-black bg-white hover:bg-neutral-100 font-mono text-xs font-bold uppercase shadow-brutal flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            FLUSH TMDB CACHE
          </button>
        </div>
      </form>
    </div>
  );
}
