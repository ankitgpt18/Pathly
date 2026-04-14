"use client";

import { useCallback, useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import MainChat from "@/components/main-chat";
import ChatView from "@/components/chat-view";
import MobileHeader from "@/components/mobile-header";
import { useChat } from "@/hooks/use-chat";
import { useSpeech } from "@/hooks/use-speech";
import { useLocation } from "@/hooks/use-location";
import { useAuth } from "@/components/auth-context";
import { loadLanguage, saveLanguage } from "@/components/language-selector";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { lat, lon, city } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedMode, setSelectedMode] = useState("general");

  // Load saved language on mount
  useEffect(() => {
    setSelectedLanguage(loadLanguage());
  }, []);

  const {
    messages,
    chatHistory,
    activeChatId,
    isProcessing,
    sendMessage,
    startNewChat,
    selectChat,
  } = useChat(lat, lon);

  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } =
    useSpeech(selectedLanguage);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const handleLanguageChange = useCallback((code: string) => {
    setSelectedLanguage(code);
    saveLanguage(code);
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      stopSpeaking();
      const assistantMsg = await sendMessage(text, selectedLanguage, selectedMode);

      if (assistantMsg && voiceOutputEnabled) {
        setTimeout(() => {
          speak(assistantMsg.content, assistantMsg.language);
        }, 300);
      }
    },
    [sendMessage, selectedLanguage, selectedMode, voiceOutputEnabled, speak, stopSpeaking]
  );

  const handleVoiceStart = useCallback(() => {
    stopSpeaking();
    startListening((text) => {
      handleSendMessage(text);
    });
  }, [startListening, handleSendMessage, stopSpeaking]);

  const handleVoiceStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleSpeakMessage = useCallback(
    (text: string, lang?: string) => {
      speak(text, lang);
    },
    [speak]
  );

  const handleToggleVoiceOutput = useCallback(() => {
    setVoiceOutputEnabled((prev) => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, [stopSpeaking]);

  const hasActiveChat = activeChatId !== null && messages.length > 0;

  if (isLoading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "var(--th-bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="orb-container">
            <div className="orb" />
            <div className="orb-shadow" />
          </div>
          <p
            className="text-[14px]"
            style={{ color: "var(--th-text-muted)" }}
          >
            Loading Pathly...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="iridescent-bg h-screen flex overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        city={city}
        userName={user.name}
        userAvatar={user.avatar}
        selectedLanguage={selectedLanguage}
        selectedMode={selectedMode}
      />

      {/* Sidebar */}
      <Sidebar
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        city={city}
      />

      {/* Main Area */}
      {hasActiveChat ? (
        <ChatView
          messages={messages}
          onSendMessage={handleSendMessage}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
          onSpeakMessage={handleSpeakMessage}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          voiceOutputEnabled={voiceOutputEnabled}
          onToggleVoiceOutput={handleToggleVoiceOutput}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
        />
      ) : (
        <MainChat
          onSendMessage={handleSendMessage}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
          isListening={isListening}
          isProcessing={isProcessing}
          city={city}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
        />
      )}
    </div>
  );
}
