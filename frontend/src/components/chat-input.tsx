"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, ChevronDown, ArrowUp, Mic, MicOff, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  isListening: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onVoiceStart,
  onVoiceStop,
  isListening,
  disabled,
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

  return (
    <div className="w-full max-w-[680px]">
      <div className="glass-input rounded-2xl flex items-center gap-2 px-4 py-3">
        <Sparkles size={16} className="text-[#bbb] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Anything..."
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-[14px] text-[#1a1a1a] placeholder:text-[#bbb]"
        />
        <button
          onClick={isListening ? onVoiceStop : onVoiceStart}
          className={`flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-lg transition-all duration-200 ${
            isListening
              ? "bg-red-50 text-red-500 border border-red-200"
              : "text-[#888] hover:text-[#555] hover:bg-black/[0.03]"
          }`}
        >
          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          {isListening ? "Stop" : "Voice"}
        </button>
        <button className="flex items-center gap-1 text-[13px] text-[#888] hover:text-[#555] px-2 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]">
          <Paperclip size={14} />
          Attach
        </button>
        <button className="flex items-center gap-1 text-[13px] text-[#888] hover:text-[#555] px-2 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]">
          Writing Style
          <ChevronDown size={12} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 hover:bg-[#333] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp size={16} className="text-white" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
        {["Route Finder", "Schedule", "Fare Check", "Voice Command", "Navigate"].map((label) => (
          <span key={label} className="pill-tag">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
