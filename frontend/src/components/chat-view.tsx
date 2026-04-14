"use client";

import { useEffect, useRef, useState } from "react";
import ChatInput from "./chat-input";
import ModeSelector from "./mode-selector";
import UserProfile from "./user-profile";
import RouteMap from "./route-map";
import { Bot, MapPin, Clock, DollarSign, Navigation, Volume2, Copy, Check } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  data?: Record<string, unknown>;
  language?: string;
  timestamp: number;
}

// Language code → display label
const LANG_LABELS: Record<string, string> = {
  hi: "हिन्दी",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ",
  mr: "मराठी",
  ur: "اردو",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  en: "English",
};

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  onSpeakMessage?: (text: string, lang?: string) => void;
  isListening: boolean;
  isSpeaking?: boolean;
  isProcessing: boolean;
  voiceOutputEnabled?: boolean;
  onToggleVoiceOutput?: () => void;
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
  selectedMode: string;
  onModeChange: (mode: string) => void;
}

function IntentBadge({ intent }: { intent?: string }) {
  if (!intent || intent === "unknown" || intent === "chat") return null;
  const config: Record<string, { icon: typeof MapPin; label: string; color: string }> = {
    route: { icon: Navigation, label: "Route", color: "var(--th-accent-blue)" },
    eta: { icon: Clock, label: "ETA", color: "var(--th-accent-green)" },
    fare: { icon: DollarSign, label: "Fare", color: "var(--th-accent-purple)" },
    nearby: { icon: MapPin, label: "Nearby", color: "var(--th-accent-rose)" },
    schedule: { icon: Clock, label: "Schedule", color: "var(--th-accent-green)" },
  };
  const c = config[intent];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
      style={{ color: c.color, background: `color-mix(in srgb, ${c.color} 12%, transparent)` }}
    >
      <Icon size={10} />
      {c.label}
    </span>
  );
}

function LanguageBadge({ language }: { language?: string }) {
  if (!language || language === "en") return null;
  const label = LANG_LABELS[language] || language;
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
      style={{
        background: "var(--th-hover-bg)",
        color: "var(--th-accent-purple)",
      }}
    >
      {label}
    </span>
  );
}

function RelativeTime({ timestamp }: { timestamp: number }) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  let text = "just now";
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    text = `${hours}h ago`;
  } else if (minutes > 0) {
    text = `${minutes}m ago`;
  }

  return (
    <span className="text-[10px]" style={{ color: "var(--th-text-faint)" }}>
      {text}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity duration-200"
      title="Copy message"
    >
      {copied ? (
        <Check size={12} style={{ color: "var(--th-accent-green)" }} />
      ) : (
        <Copy size={12} style={{ color: "var(--th-text-muted)" }} />
      )}
    </button>
  );
}

function MessageMap({ message }: { message: Message }) {
  if (!message.data || message.role !== "assistant") return null;

  const data = message.data as Record<string, any>;

  // Route map
  if (message.intent === "route" && data.get_directions) {
    const dirs = data.get_directions;
    if (dirs.geometry && dirs.geometry.length > 0) {
      return (
        <RouteMap
          geometry={dirs.geometry}
          origin={dirs.origin}
          destination={dirs.destination}
        />
      );
    }
  }

  // Nearby stops map
  if (message.intent === "nearby" && data.find_nearby_stops) {
    const stops = data.find_nearby_stops.stops;
    if (stops && stops.length > 0 && stops[0].lat) {
      return <RouteMap nearbyStops={stops} />;
    }
  }

  return null;
}

export default function ChatView({
  messages,
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  onSpeakMessage,
  isListening,
  isSpeaking,
  isProcessing,
  voiceOutputEnabled,
  onToggleVoiceOutput,
  selectedLanguage,
  onLanguageChange,
  selectedMode,
  onModeChange,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="flex-1 h-full relative flex flex-col overflow-hidden">
      <div className="hidden md:block">
        <UserProfile />
      </div>

      {/* Mode selector bar */}
      <div className="absolute top-14 md:top-4 left-0 right-0 z-10 flex justify-center px-4">
        <ModeSelector value={selectedMode} onChange={onModeChange} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-12 pt-24 md:pt-20 pb-40 md:pb-44">
        <div className="max-w-[700px] mx-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`group max-w-[92%] md:max-w-[85%] px-4 md:px-5 py-3 md:py-3.5 ${
                  msg.role === "user" ? "message-user" : "message-assistant"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--th-hover-bg)" }}
                    >
                      <Bot size={11} style={{ color: "var(--th-text-muted)" }} />
                    </div>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: "var(--th-text-faint)" }}
                    >
                      Pathly
                    </span>
                    <IntentBadge intent={msg.intent} />
                    <LanguageBadge language={msg.language} />
                    <div className="ml-auto flex items-center gap-1.5">
                      <RelativeTime timestamp={msg.timestamp} />
                      <CopyButton text={msg.content} />
                      {onSpeakMessage && (
                        <button
                          onClick={() => onSpeakMessage(msg.content, msg.language)}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity duration-200"
                          title="Listen to this message"
                        >
                          <Volume2 size={12} style={{ color: "var(--th-text-muted)" }} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {msg.role === "user" && (
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    <RelativeTime timestamp={msg.timestamp} />
                  </div>
                )}

                <p
                  className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: "var(--th-text-primary)" }}
                >
                  {msg.content}
                </p>

                {/* Route / Nearby map */}
                <MessageMap message={msg} />
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="message-assistant px-4 md:px-5 py-3 md:py-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--th-hover-bg)" }}
                  >
                    <Bot size={11} style={{ color: "var(--th-text-muted)" }} />
                  </div>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "var(--th-text-faint)" }}
                  >
                    Pathly
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="typing-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--th-text-faint)" }}>
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="absolute bottom-3 md:bottom-6 left-0 right-0 flex flex-col items-center px-3 md:px-8">
        <ChatInput
          onSend={onSendMessage}
          onVoiceStart={onVoiceStart}
          onVoiceStop={onVoiceStop}
          isListening={isListening}
          isSpeaking={isSpeaking}
          disabled={isProcessing}
          voiceOutputEnabled={voiceOutputEnabled}
          onToggleVoiceOutput={onToggleVoiceOutput}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          selectedMode={selectedMode}
        />
        <p className="text-[10px] md:text-[11px] mt-2" style={{ color: "var(--th-text-faint)" }}>
          Pathly — AI Transport for India
        </p>
      </div>
    </main>
  );
}
