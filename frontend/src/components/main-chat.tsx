"use client";

import Orb from "./orb";
import SuggestionCards from "./suggestion-cards";
import ChatInput from "./chat-input";
import UserProfile from "./user-profile";

interface MainChatProps {
  onSendMessage: (text: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  isListening: boolean;
  isProcessing: boolean;
}

export default function MainChat({
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  isListening,
  isProcessing,
}: MainChatProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <main className="flex-1 h-full relative flex flex-col items-center justify-center px-8 overflow-hidden">
      <UserProfile name="User" email="user@pathly.ai" />

      <div className="flex flex-col items-center gap-5 -mt-8">
        <Orb />

        <div className="text-center">
          <h1
            className="text-[38px] text-[#1a1a1a] leading-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            {getGreeting()}, User
          </h1>
          <h2
            className="text-[28px] text-[#999] leading-tight mt-0.5"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            What&apos;s on your mind?
          </h2>
        </div>

        <p className="text-[13px] text-[#999] text-center max-w-[480px] leading-relaxed">
          A voice-powered transport assistant for real-time routes, fares, schedules and navigation. Just ask.
        </p>

        <p className="text-[11px] text-[#aaa] uppercase tracking-[2px] font-medium mt-2">
          Begin with the example below
        </p>

        <SuggestionCards onSelect={onSendMessage} />
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
