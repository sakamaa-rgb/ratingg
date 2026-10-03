"use client";

import React, { useState } from "react";

interface GlitchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "dark";
  children: React.ReactNode;
}

export default function GlitchButton({
  variant = "primary",
  children,
  className = "",
  ...props
}: GlitchButtonProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-brutal-yellow text-black border-black hover:bg-yellow-300";
      case "danger":
        return "bg-brutal-red text-white border-black hover:bg-red-600";
      case "dark":
        return "bg-black text-white border-white hover:bg-neutral-900";
      case "secondary":
      default:
        return "bg-white text-black border-black hover:bg-neutral-100";
    }
  };

  return (
    <button
      {...props}
      onMouseEnter={() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }}
      className={`relative font-mono font-bold uppercase tracking-wider px-5 py-3 border-2 transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none shadow-brutal disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${
        isGlitching ? "translate-x-[-1px] translate-y-[-1px]" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
