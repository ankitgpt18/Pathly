"use client";

import { useEffect, useRef } from "react";
import ChatInput from "./chat-input";
import UserProfile from "./user-profile";
import { Bot, MapPin, Clock, DollarSign, Navigation } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  isListening: boolean;
  isProcessing: boolean;
}

function IntentBadge({ intent }: { intent?: string }) {
  if (!intent || intent === "unknown") return null;
  const config: Record<string, { icon: typeof MapPin; label: string; color: string }> = {
    route: { icon: Navigation, label: "Route", color: "text-[#7c8db0]" },
    eta: { icon: Clock, label: "ETA", color: "text-[#8b9e7e]" },
    fare: { icon: DollarSign, label: "Fare", color: "text-[#a08e7e]" },
    nearby: { icon: MapPin, label: "Nearby", color: "text-[#8e7ea0]" },
  };
  const c = config[intent];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${c.color} font-medium uppercase tracking-wide mb-1`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}

export default function ChatView({
  messages,
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  isListening,
  isProcessing,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="flex-1 h-full relative flex flex-col overflow-hidden">
      <UserProfile name="User" email="user@pathly.ai" />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-12 pt-20 pb-40">
        <div className="max-w-[680px] mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-5 py-3.5 ${
                  msg.role === "user" ? "message-user" : "message-assistant"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#eee] flex items-center justify-center">
                      <Bot size={11} className="text-[#888]" />
                    </div>
                    <span className="text-[11px] text-[#aaa] font-medium">Pathly</span>
                    <IntentBadge intent={msg.intent} />
                  </div>
                )}
                <p className="text-[14px] text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                {msg.data && Object.keys(msg.data).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-black/[0.05]">
                    {(() => {
                      const steps = msg.data?.steps;
                      if (steps && Array.isArray(steps)) {
                        return (
                          <div className="space-y-1">
                            {(steps as string[]).slice(0, 3).map((step: string, i: number) => (
                              <p key={i} className="text-[12px] text-[#888] flex items-start gap-1.5">
                                <span className="text-[#bbb] mt-0.5">-</span>
                                {step}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {(() => {
                      const stops = msg.data?.stops;
                      if (stops && Array.isArray(stops)) {
                        return (
                          <div className="space-y-1">
                            {(stops as Array<{ name: string; distance_m: number }>).map(
                              (stop: { name: string; distance_m: number }, i: number) => (
                                <p key={i} className="text-[12px] text-[#888] flex items-center gap-1.5">
                                  <MapPin size={10} className="text-[#bbb]" />
                                  {stop.name} - {stop.distance_m}m away
                                </p>
                              )
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="message-assistant px-5 py-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#eee] flex items-center justify-center">
                    <Bot size={11} className="text-[#888]" />
                  </div>
                  <span className="text-[11px] text-[#aaa] font-medium">Pathly</span>
                </div>
                <span className="typing-cursor text-[14px] text-[#1a1a1a]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center px-8">
        <ChatInput
          onSend={onSendMessage}
          onVoiceStart={onVoiceStart}
          onVoiceStop={onVoiceStop}
          isListening={isListening}
          disabled={isProcessing}
        />
        <p className="text-[11px] text-[#ccc] mt-3">Pathly</p>
      </div>
    </main>
  );
}
