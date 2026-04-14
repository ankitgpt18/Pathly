"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";

export interface LanguageOption {
  code: string;
  label: string;
  native: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
];

const LANG_KEY = "pathly-lang";

function loadLanguage(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(LANG_KEY) || "en";
}

function saveLanguage(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_KEY, code);
}

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  compact?: boolean;
}

export default function LanguageSelector({ value, onChange, compact }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];

  const handleSelect = (code: string) => {
    onChange(code);
    saveLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="lang-trigger"
        id="lang-selector-btn"
        title={`Language: ${current.label}`}
      >
        <Globe size={13} />
        <span className={compact ? "hidden sm:inline" : ""}>
          {current.native}
        </span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="lang-dropdown custom-scrollbar">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`lang-dropdown-item ${value === lang.code ? "active" : ""}`}
            >
              <span className="text-[13px]">{lang.native}</span>
              <span
                className="text-[11px] ml-auto"
                style={{ color: "var(--th-text-faint)" }}
              >
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { loadLanguage, saveLanguage };
