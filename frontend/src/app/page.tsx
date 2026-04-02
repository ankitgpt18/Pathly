"use client";

import { useCallback } from "react";
import Sidebar from "@/components/sidebar";
import MainChat from "@/components/main-chat";
import ChatView from "@/components/chat-view";
import { useChat } from "@/hooks/use-chat";
import { useSpeech } from "@/hooks/use-speech";

export default function Home() {
  const {
    messages,
    chatHistory,
    activeChatId,
    isProcessing,
    sendMessage,
    startNewChat,
    selectChat,
  } = useChat();

  const { isListening, startListening, stopListening, speak } = useSpeech();

  const handleSendMessage = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage]
  );

  const handleVoiceStart = useCallback(() => {
    startListening((text) => {
      handleSendMessage(text);
    });
  }, [startListening, handleSendMessage]);

  const handleVoiceStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const hasActiveChat = activeChatId !== null && messages.length > 0;

  return (
    <div className="iridescent-bg h-screen flex overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
      />

      {/* Main Area */}
      {hasActiveChat ? (
        <ChatView
          messages={messages}
          onSendMessage={handleSendMessage}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
          isListening={isListening}
          isProcessing={isProcessing}
        />
      ) : (
        <MainChat
          onSendMessage={handleSendMessage}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
          isListening={isListening}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
