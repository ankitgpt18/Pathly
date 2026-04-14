"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, MicOff, Sparkles, Volume2, VolumeX } from "lucide-react";
import LanguageSelector from "./language-selector";

interface ChatInputProps {
  onSend: (text: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  isListening: boolean;
  isSpeaking?: boolean;
  disabled?: boolean;
  voiceOutputEnabled?: boolean;
  onToggleVoiceOutput?: () => void;
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
  selectedMode?: string;
}

const MODE_PILLS: Record<string, Array<{ label: string; query: string }>> = {
  general: [
    { label: "Route Finder", query: "Find me the fastest route to " },
    { label: "Nearby Stops", query: "Show nearby bus stops and metro stations" },
    { label: "Fare Check", query: "What is the fare from here to " },
    { label: "Schedule", query: "When is the next bus arriving?" },
  ],
  journey: [
    { label: "Plan Commute", query: "Plan my daily commute to " },
    { label: "Cheapest Way", query: "What's the cheapest way to get to " },
    { label: "Multi-modal", query: "Best combo of metro and bus to " },
    { label: "Airport Trip", query: "How to reach the airport from here?" },
  ],
  fare: [
    { label: "Compare All", query: "Compare fares for all transport modes to " },
    { label: "Metro vs Bus", query: "Metro vs bus fare comparison to " },
    { label: "Cab Estimate", query: "Estimated Ola/Uber fare to " },
    { label: "Auto Fare", query: "Auto rickshaw fare to " },
  ],
  navigate: [
    { label: "Walk to Station", query: "Navigate me walking to nearest metro station" },
    { label: "Drive Route", query: "Give me driving directions to " },
    { label: "Airport", query: "Navigate to the airport" },
    { label: "Railway Stn", query: "Walking directions to nearest railway station" },
  ],
  schedule: [
    { label: "Next Bus", query: "When is the next bus arriving near me?" },
    { label: "Metro Timing", query: "Metro schedule at my nearest station" },
    { label: "Train Times", query: "Upcoming train timings at nearest station" },
    { label: "Peak Hours", query: "What are peak hour timings for transport here?" },
  ],
};

export default function ChatInput({
  onSend,
  onVoiceStart,
  onVoiceStop,
  isListening,
  isSpeaking,
  disabled,
  voiceOutputEnabled = true,
  onToggleVoiceOutput,
  selectedLanguage,
  onLanguageChange,
  selectedMode = "general",
}: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePill = (query: string) => {
    if (query.endsWith(" ")) {
      setText(query);
      inputRef.current?.focus();
    } else {
      onSend(query);
    }
  };

  const pills = MODE_PILLS[selectedMode] || MODE_PILLS.general;

  return (
    <div className="w-full max-w-[700px]">
      <div className="glass-input rounded-2xl flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3">
        <Sparkles
          size={15}
          className="flex-shrink-0 hidden sm:block"
          style={{ color: "var(--th-text-faint)" }}
        />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything in any language..."
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-[14px] min-w-0"
          style={{
            color: "var(--th-text-primary)",
          }}
          id="chat-input-field"
        />

        {/* Language selector */}
        <LanguageSelector
          value={selectedLanguage}
          onChange={onLanguageChange}
          compact
        />

        {/* Voice output toggle */}
        {onToggleVoiceOutput && (
          <button
            onClick={onToggleVoiceOutput}
            className={`voice-toggle-btn ${voiceOutputEnabled ? "active" : ""}`}
            title={voiceOutputEnabled ? "Voice output ON" : "Voice output OFF"}
            id="voice-output-toggle"
          >
            {voiceOutputEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="hidden sm:inline text-[11px]">
              {isSpeaking ? "Playing" : voiceOutputEnabled ? "🔊" : "🔇"}
            </span>
          </button>
        )}

        {/* Voice input button */}
        <button
          onClick={isListening ? onVoiceStop : onVoiceStart}
          className={`voice-input-btn ${isListening ? "recording" : ""}`}
          id="voice-btn"
        >
          <span className={`mic-icon-wrap ${isListening ? "pulse-ring" : ""}`}>
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </span>
          <span className="hidden sm:inline text-[12px]">
            {isListening ? "Stop" : "Voice"}
          </span>
        </button>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="send-btn"
          id="send-btn"
        >
          <ArrowUp size={16} style={{ color: "var(--th-btn-primary-text)" }} />
        </button>
      </div>

      {/* Context-aware pill tags */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-2.5 flex-wrap px-1">
        {pills.map((pill) => (
          <button
            key={pill.label}
            onClick={() => handlePill(pill.query)}
            className="pill-tag text-[11px] md:text-[12px] px-2.5 md:px-3 py-1 md:py-1.5"
            id={`pill-${pill.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}
