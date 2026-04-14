"use client";

import { Menu, MapPin, Languages } from "lucide-react";
import { LANGUAGES } from "./language-selector";
import { MODES } from "./mode-selector";

interface MobileHeaderProps {
  onMenuToggle: () => void;
  city?: string | null;
  userName?: string;
  userAvatar?: string;
  selectedLanguage?: string;
  selectedMode?: string;
}

export default function MobileHeader({
  onMenuToggle,
  city,
  userName,
  userAvatar,
  selectedLanguage,
  selectedMode,
}: MobileHeaderProps) {
  const langLabel = LANGUAGES.find((l) => l.code === selectedLanguage)?.native;
  const modeLabel = MODES.find((m) => m.id === selectedMode)?.label;

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
      style={{
        background: "var(--th-glass-sidebar)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--th-border-subtle)",
      }}
    >
      <button
        onClick={onMenuToggle}
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        id="mobile-menu-btn"
        style={{ color: "var(--th-text-primary)" }}
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2">
        <h1
          className="text-[17px] font-bold tracking-tight"
          style={{ color: "var(--th-text-primary)" }}
        >
          Pathly
        </h1>
        {modeLabel && modeLabel !== "Chat" && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{
              color: "var(--th-accent-blue)",
              background: "rgba(91, 127, 191, 0.1)",
            }}
          >
            {modeLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {city && (
          <span className="location-badge text-[10px] hidden sm:inline-flex">
            <MapPin size={9} />
            {city}
          </span>
        )}
        {selectedLanguage && selectedLanguage !== "en" && langLabel && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md hidden sm:inline-flex items-center gap-1"
            style={{
              color: "var(--th-accent-purple)",
              background: "rgba(124, 92, 191, 0.1)",
            }}
          >
            <Languages size={9} />
            {langLabel}
          </span>
        )}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium overflow-hidden"
          style={{
            background: "var(--th-accent-purple)",
            color: "var(--th-btn-primary-text)",
          }}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            (userName || "G")[0].toUpperCase()
          )}
        </div>
      </div>
    </header>
  );
}
