"use client";

import { useEffect, useState } from "react";

const THEMES = [
  {
    id: "dark-terminal",
    label: "Dark Terminal",
    description: "Deep slate · Blue accent",
    color: "#3b82f6",
    bg: "#0f172a",
  },
  {
    id: "cyber-neon",
    label: "Cyber Neon",
    description: "Dark gray · Cyan accent",
    color: "#06b6d4",
    bg: "#111827",
  },
  {
    id: "navy-trust",
    label: "Navy Trust",
    description: "Midnight navy · Amber accent",
    color: "#f59e0b",
    bg: "#0b1120",
  },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  localStorage.setItem("piq-theme", id);
}

export default function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>("dark-terminal");
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("piq-theme") as ThemeId | null;
    const initial = saved && THEMES.find((t) => t.id === saved) ? saved : "dark-terminal";
    applyTheme(initial);
    setActive(initial);
  }, []);

  const select = (id: ThemeId) => {
    applyTheme(id);
    setActive(id);
  };

  return (
    <div className="relative flex items-center gap-1.5">
      {THEMES.map((t) => (
        <div key={t.id} className="relative">
          <button
            title={`${t.label} — ${t.description}`}
            onClick={() => select(t.id)}
            onMouseEnter={() => setTooltip(t.id)}
            onMouseLeave={() => setTooltip(null)}
            className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
              active === t.id
                ? "border-white scale-110 shadow-lg"
                : "border-transparent opacity-60 hover:opacity-90 hover:scale-105"
            }`}
            style={{
              background: `radial-gradient(circle at 35% 35%, ${t.color}, ${t.bg})`,
            }}
          />
          {/* Tooltip */}
          {tooltip === t.id && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded-md border border-surface-border bg-surface-card px-2.5 py-1.5 text-xs shadow-xl pointer-events-none">
              <p className="font-medium text-white">{t.label}</p>
              <p className="text-slate-400">{t.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Inline script to prevent theme flash on initial page load.
// Must be rendered as a <script> in <head> before React hydration.
export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var t=localStorage.getItem('piq-theme');document.documentElement.setAttribute('data-theme',t||'dark-terminal');})();`,
      }}
    />
  );
}
