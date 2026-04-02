"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message } from "@/components/chat-view";

const STORAGE_KEY = "pathly-chats";
const isProd = process.env.NODE_ENV === "production";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (isProd ? "/_/backend" : "http://localhost:8000");

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

export function useChat() {
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
    async (text: string) => {
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
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lat: null, lon: null }),
        });

        if (!res.ok) throw new Error("Request failed");

        const data = await res.json();

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          intent: data.intent,
          data: data.data,
          timestamp: Date.now(),
        };

        const finalId = chatId;
        setChats((prev) =>
          prev.map((c) =>
            c.id === finalId ? { ...c, messages: [...c.messages, assistantMsg] } : c
          )
        );
      } catch {
        const finalId = chatId;
        const errorMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: "Could not reach the backend. Make sure it is running on port 8000.",
          timestamp: Date.now(),
        };
        setChats((prev) =>
          prev.map((c) =>
            c.id === finalId ? { ...c, messages: [...c.messages, errorMsg] } : c
          )
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [activeChatId]
  );

  return { messages, chatHistory, activeChatId, isProcessing, sendMessage, startNewChat, selectChat };
}
