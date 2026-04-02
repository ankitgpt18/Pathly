"use client";

import { useState } from "react";
import {
  RotateCw,
  BookOpen,
  Settings,
  HelpCircle,
  ChevronDown,
  X,
} from "lucide-react";

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

interface SidebarProps {
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

export default function Sidebar({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
}: SidebarProps) {
  const [showUpgrade, setShowUpgrade] = useState(true);
  const [showChatList, setShowChatList] = useState(true);

  const now = Date.now();
  const oneDay = 86400000;

  const todayChats = chatHistory.filter((c) => now - c.timestamp < oneDay);
  const yesterdayChats = chatHistory.filter(
    (c) => now - c.timestamp >= oneDay && now - c.timestamp < 2 * oneDay
  );
  const olderChats = chatHistory.filter((c) => now - c.timestamp >= 2 * oneDay);

  const renderChatItem = (chat: ChatHistoryItem) => (
    <button
      key={chat.id}
      onClick={() => onSelectChat(chat.id)}
      className={`w-full text-left text-[13px] leading-snug truncate py-1.5 px-1 rounded-md transition-colors duration-200 ${
        activeChatId === chat.id
          ? "text-[#1a1a1a] font-medium bg-black/[0.04]"
          : "text-[#888] hover:text-[#555] hover:bg-black/[0.02]"
      }`}
    >
      {chat.title}
    </button>
  );

  return (
    <aside className="glass-sidebar w-[280px] min-w-[280px] h-full flex flex-col py-6 px-5">
      <h1 className="text-[22px] font-bold text-[#1a1a1a] tracking-tight mb-7">
        Pathly
      </h1>

      <nav className="flex flex-col gap-1 mb-5">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2.5 text-[14px] text-[#555] hover:text-[#1a1a1a] py-2 px-2 rounded-lg transition-colors duration-200 hover:bg-black/[0.03]"
        >
          <RotateCw size={16} />
          New Chat
        </button>
        <button className="flex items-center gap-2.5 text-[14px] text-[#888] hover:text-[#1a1a1a] py-2 px-2 rounded-lg transition-colors duration-200 hover:bg-black/[0.03]">
          <BookOpen size={16} />
          Library
        </button>
        <button className="flex items-center gap-2.5 text-[14px] text-[#888] hover:text-[#1a1a1a] py-2 px-2 rounded-lg transition-colors duration-200 hover:bg-black/[0.03]">
          <Settings size={16} />
          Settings
        </button>
        <button className="flex items-center gap-2.5 text-[14px] text-[#888] hover:text-[#1a1a1a] py-2 px-2 rounded-lg transition-colors duration-200 hover:bg-black/[0.03]">
          <HelpCircle size={16} />
          Help & Support
        </button>
      </nav>

      <div className="h-px bg-black/[0.07] mb-4" />

      <button
        onClick={() => setShowChatList(!showChatList)}
        className="flex items-center gap-1.5 text-[13px] text-[#555] font-medium mb-3 hover:text-[#1a1a1a] transition-colors"
      >
        Chat List
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${showChatList ? "rotate-0" : "-rotate-90"}`}
        />
      </button>

      {showChatList && (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          {todayChats.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-[#1a1a1a] mb-1.5">Today</p>
              <div className="space-y-0.5">{todayChats.map(renderChatItem)}</div>
            </div>
          )}
          {yesterdayChats.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-[#1a1a1a] mb-1.5">Yesterday</p>
              <div className="space-y-0.5">{yesterdayChats.map(renderChatItem)}</div>
            </div>
          )}
          {olderChats.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-[#1a1a1a] mb-1.5">Earlier</p>
              <div className="space-y-0.5">{olderChats.map(renderChatItem)}</div>
            </div>
          )}
          {chatHistory.length === 0 && (
            <p className="text-[12px] text-[#aaa] italic">No conversations yet</p>
          )}
        </div>
      )}

      <div className="flex-1" />

      {showUpgrade && (
        <div className="glass-upgrade rounded-2xl p-4 mt-4 relative">
          <button
            onClick={() => setShowUpgrade(false)}
            className="absolute top-3 right-3 text-[#aaa] hover:text-[#555] transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3 mb-2">
            <div className="orb flex-shrink-0" style={{ width: 36, height: 36 }} />
            <p className="text-[14px] font-semibold text-[#1a1a1a]">Upgrade to Pro</p>
          </div>
          <p className="text-[12px] text-[#777] leading-relaxed mb-3">
            Unlock premium features and real-time transit data
          </p>
          <button className="text-[13px] font-medium text-[#1a1a1a] border border-[#1a1a1a] rounded-lg px-4 py-1.5 hover:bg-[#1a1a1a] hover:text-white transition-all duration-200">
            Upgrade Now
          </button>
        </div>
      )}
    </aside>
  );
}
