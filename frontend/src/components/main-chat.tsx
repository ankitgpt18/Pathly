"use client";

import Orb from "./orb";
import SuggestionCards from "./suggestion-cards";
import ChatInput from "./chat-input";
import UserProfile from "./user-profile";
import ModeSelector from "./mode-selector";
import { useAuth } from "./auth-context";
import { MapPin, Languages } from "lucide-react";
import { LANGUAGES } from "./language-selector";

interface MainChatProps {
  onSendMessage: (text: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  isListening: boolean;
  isProcessing: boolean;
  city?: string | null;
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
  selectedMode: string;
  onModeChange: (mode: string) => void;
}

export default function MainChat({
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  isListening,
  isProcessing,
  city,
  selectedLanguage,
  onLanguageChange,
  selectedMode,
  onModeChange,
}: MainChatProps) {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = user?.name || "there";
  const langLabel = LANGUAGES.find((l) => l.code === selectedLanguage)?.native;

  return (
    <main className="flex-1 h-full relative flex flex-col items-center justify-center px-4 md:px-8 overflow-hidden pt-14 md:pt-0">
      <div className="hidden md:block">
        <UserProfile />
      </div>

      <div className="flex flex-col items-center gap-4 md:gap-5 -mt-4 md:-mt-8 w-full max-w-[700px]">
        {/* Orb — smaller on mobile, full on desktop */}
        <div className="orb-container scale-[0.55] md:scale-100 -mb-4 md:mb-0">
          <div className="orb" />
          <div className="orb-shadow" />
        </div>

        <div className="text-center">
          <h1
            className="text-[26px] md:text-[38px] leading-tight"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              color: "var(--th-text-primary)",
            }}
          >
            {getGreeting()}, {userName}
          </h1>
          <h2
            className="text-[18px] md:text-[28px] leading-tight mt-0.5"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              color: "var(--th-text-muted)",
            }}
          >
            Where do you want to go?
          </h2>
        </div>

        {/* Info badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {city && (
            <span className="location-badge">
              <MapPin size={11} />
              {city}
            </span>
          )}
          {selectedLanguage !== "en" && langLabel && (
            <span className="location-badge" style={{
              color: "var(--th-accent-purple)",
              background: "rgba(124, 92, 191, 0.1)",
              borderColor: "rgba(124, 92, 191, 0.2)",
            }}>
              <Languages size={11} />
              {langLabel}
            </span>
          )}
        </div>

        <p
          className="text-[12px] md:text-[13px] text-center max-w-[480px] leading-relaxed"
          style={{ color: "var(--th-text-muted)" }}
        >
          Voice-powered transport assistant for routes, fares, schedules, and navigation across India. Speak or type in any language.
        </p>

        {/* Mode selector */}
        <ModeSelector value={selectedMode} onChange={onModeChange} />

        <p
          className="text-[10px] md:text-[11px] uppercase tracking-[2px] font-medium mt-1"
          style={{ color: "var(--th-text-faint)" }}
        >
          Try an example below
        </p>

        <SuggestionCards onSelect={onSendMessage} mode={selectedMode} />
      </div>

      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex flex-col items-center px-4 md:px-8">
        <ChatInput
          onSend={onSendMessage}
          onVoiceStart={onVoiceStart}
          onVoiceStop={onVoiceStop}
          isListening={isListening}
          disabled={isProcessing}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          selectedMode={selectedMode}
        />
        <p className="text-[10px] md:text-[11px] mt-2.5" style={{ color: "var(--th-text-faint)" }}>
          Pathly — AI Transport for India
        </p>
      </div>
    </main>
  );
}
