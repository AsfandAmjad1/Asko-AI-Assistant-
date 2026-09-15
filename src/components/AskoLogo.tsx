import React from "react";

interface AskoLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
  hideBadgeOnMobile?: boolean;
}

export function AskoLogo({
  size = "md",
  showTagline = false,
  className = "",
  hideBadgeOnMobile = false,
}: AskoLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7 text-sm",
    md: "w-9 h-9 text-base",
    lg: "w-14 h-14 text-2xl",
    xl: "w-16 h-16 sm:w-20 sm:h-20 text-3xl",
  };

  const textSizes = {
    sm: "text-base tracking-tight font-bold",
    md: "text-xl tracking-tight font-bold",
    lg: "text-3xl tracking-tight font-bold",
    xl: "text-3xl sm:text-5xl tracking-tight font-black",
  };

  const badgeSizes = {
    sm: "text-[10px] px-1.5 py-0.2",
    md: "text-[10px] px-1.5 py-0.2",
    lg: "text-xs px-2 py-0.5",
    xl: "text-xs sm:text-sm font-bold px-2 sm:px-2.5 py-0.5 rounded-md",
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Original Asko Monogram Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-md ${
          size === "xl" ? "shadow-xl shadow-amber-500/25 ring-1 ring-amber-400/40" : "shadow-amber-500/10"
        } select-none flex-shrink-0`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 text-slate-950 stroke-current"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stylized Modern Apex "A" with Intelligent Core */}
          <path d="M7 25L16 6L25 25" />
          <path d="M10.5 19H21.5" />
          <circle cx="16" cy="14" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-sans ${textSizes[size]} theme-text-primary leading-tight`}>Asko</span>
          <span
            className={`${badgeSizes[size]} font-mono font-medium rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 tracking-wider flex-shrink-0 ${
              hideBadgeOnMobile ? "hidden xs:inline-block" : ""
            }`}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] theme-text-muted font-medium tracking-wide">
            Think. Ask. Create.
          </span>
        )}
      </div>
    </div>
  );
}
