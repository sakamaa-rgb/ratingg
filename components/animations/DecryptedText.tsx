"use client";

import React, { useEffect, useState, useRef } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
}

const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

export default function DecryptedText({
  text,
  speed = 40,
  maxIterations = 15,
  sequential = true,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = DEFAULT_CHARS,
  className = "",
  encryptedClassName = "text-brutal-red",
  animateOn = "view",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const iterationCount = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getNextChar = (original: string) => {
    if (original === " ") return " ";
    if (useOriginalCharsOnly) {
      const distinctChars = Array.from(new Set(text.replace(/\s+/g, "")));
      return distinctChars[Math.floor(Math.random() * distinctChars.length)] || original;
    }
    return characters[Math.floor(Math.random() * characters.length)];
  };

  const scramble = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    iterationCount.current = 0;
    setIsScrambling(true);

    timerRef.current = setInterval(() => {
      iterationCount.current += 1;

      setDisplayText(() => {
        const textArr = text.split("");
        const progress = iterationCount.current / maxIterations;

        return textArr
          .map((char, i) => {
            if (char === " ") return " ";

            let isResolved = false;
            if (sequential) {
              const threshold = (i / textArr.length);
              isResolved = progress > threshold;
            } else {
              isResolved = progress > 0.8 && Math.random() > 0.3;
            }

            if (isResolved || iterationCount.current >= maxIterations) {
              return char;
            }
            return getNextChar(char);
          })
          .join("");
      });

      if (iterationCount.current >= maxIterations) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === "view") {
      scramble();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, animateOn]);

  const handleMouseEnter = () => {
    if (animateOn === "hover") {
      scramble();
    }
    setIsHovering(true);
  };

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovering(false)}
      className={`inline-block font-mono tracking-tight select-none uppercase ${className}`}
    >
      {displayText.split("").map((char, index) => {
        const originalChar = text[index];
        const isEncrypted = char !== originalChar && isScrambling;
        return (
          <span
            key={index}
            className={isEncrypted ? encryptedClassName : ""}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
