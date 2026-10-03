"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: StarRatingProps) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  const starSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const currentVal = hoverVal !== null ? hoverVal : value;

  return (
    <div className="flex items-center gap-1 select-none">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= currentVal;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverVal(star)}
            onMouseLeave={() => !readOnly && setHoverVal(null)}
            className={`p-1 transition-transform border border-black ${
              readOnly
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 active:scale-95"
            } ${isFilled ? "bg-brutal-yellow" : "bg-white"}`}
          >
            <Star
              className={`${starSizes[size]} ${
                isFilled
                  ? "fill-black text-black"
                  : "text-neutral-400 stroke-[2]"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
