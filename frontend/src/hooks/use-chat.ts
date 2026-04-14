"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message } from "@/components/chat-view";

const STORAGE_KEY = "pathly-chats";
const isProd = process.env.NODE_ENV === "production";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (isProd ? "/_/backend" : "http://localhost:8000");

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

function loadChats(): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useChat(lat?: number, lon?: number) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setChats(loadChats());
  }, []);

  useEffect(() => {
    if (chats.length > 0) saveChats(chats);
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages = activeChat?.messages || [];

  const chatHistory = chats
    .map((c) => ({ id: c.id, title: c.title, timestamp: c.timestamp }))
    .sort((a, b) => b.timestamp - a.timestamp);

  const startNewChat = useCallback(() => setActiveChatId(null), []);
  const selectChat = useCallback((id: string) => setActiveChatId(id), []);

  const sendMessage = useCallback(
    async (text: string, language: string = "en", mode: string = "general") => {
      setIsProcessing(true);

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      let chatId = activeChatId;

      if (!chatId) {
        chatId = generateId();
        const newChat: Chat = {
          id: chatId,
          title: text.slice(0, 40) + (text.length > 40 ? "..." : ""),
          messages: [userMsg],
          timestamp: Date.now(),
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(chatId);
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? { ...c, messages: [...c.messages, userMsg], timestamp: Date.now() }
              : c
          )
        );
      }

      try {
        // Build conversation history for Gemini context
        const currentChat = chats.find((c) => c.id === chatId);
        const existingMessages = currentChat?.messages || [];
        const history = [...existingMessages, userMsg]
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            lat: lat || null,
            lon: lon || null,
            history,
            language,
            mode,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || `Server error (${res.status})`);
        }

        const data = await res.json();

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          intent: data.intent,
          data: data.data,
          language: data.language || "en",
          timestamp: Date.now(),
        };

        const finalId = chatId;
        setChats((prev) =>
          prev.map((c) =>
            c.id === finalId ? { ...c, messages: [...c.messages, assistantMsg] } : c
          )
        );

        return assistantMsg;
      } catch (err) {
        const finalId = chatId;
        const errorMessage =
          err instanceof TypeError && err.message.includes("fetch")
            ? "Cannot reach backend. Please start the backend server:\n\ncd backend && python -m uvicorn main:app --port 8000 --reload"
            : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

        const errorMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: errorMessage,
          timestamp: Date.now(),
          intent: "error",
        };
        setChats((prev) =>
          prev.map((c) =>
            c.id === finalId ? { ...c, messages: [...c.messages, errorMsg] } : c
          )
        );
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [activeChatId, lat, lon, chats]
  );

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      saveChats(remaining);
      return remaining;
    });
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  }, [activeChatId]);

  return {
    messages,
    chatHistory,
    activeChatId,
    isProcessing,
    sendMessage,
    startNewChat,
    selectChat,
    deleteChat,
  };
}
