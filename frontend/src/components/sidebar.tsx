"use client";

import { useState } from "react";
import {
  RotateCw,
  Settings,
  HelpCircle,
  ChevronDown,
  X,
  MapPin,
  Trash2,
  LogOut,
} from "lucide-react";
import ThemeToggle from "./theme-toggle";
import { useAuth } from "./auth-context";

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
  isOpen: boolean;
  onClose: () => void;
  city?: string | null;
}

export default function Sidebar({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
  isOpen,
  onClose,
  city,
}: SidebarProps) {
  const [showChatList, setShowChatList] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { user, logout } = useAuth();

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
      onClick={() => {
        onSelectChat(chat.id);
        onClose();
      }}
      className={`w-full text-left text-[13px] leading-snug truncate py-2 px-2 rounded-lg transition-colors duration-200 ${
        activeChatId === chat.id ? "sidebar-btn active" : "sidebar-btn"
      }`}
      style={{ fontSize: "13px", padding: "6px 8px" }}
    >
      {chat.title}
    </button>
  );

  const clearHistory = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pathly-chats");
      window.location.reload();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-mobile-overlay md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`glass-sidebar h-full flex flex-col py-6 px-5 z-50 transition-transform duration-300 ease-out
          fixed md:relative
          w-[280px] min-w-[280px]
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4"
          style={{ color: "var(--th-text-muted)" }}
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <h1
          className="text-[22px] font-bold tracking-tight mb-2"
          style={{ color: "var(--th-text-primary)" }}
        >
          Pathly
        </h1>

        {/* Location badge */}
        {city && (
          <span className="location-badge mb-5 self-start">
            <MapPin size={10} />
            {city}
          </span>
        )}
        {!city && <div className="mb-5" />}

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 mb-4">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="sidebar-btn"
            id="new-chat-btn"
          >
            <RotateCw size={16} />
            New Chat
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`sidebar-btn ${showSettings ? "active" : ""}`}
            id="settings-btn"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`sidebar-btn ${showHelp ? "active" : ""}`}
            id="help-btn"
          >
            <HelpCircle size={16} />
            Help
          </button>
          <ThemeToggle />
        </nav>

        {/* Settings Panel */}
        {showSettings && (
          <div
            className="rounded-xl p-4 mb-4 space-y-3"
            style={{
              background: "var(--th-hover-bg)",
              border: "1px solid var(--th-border-subtle)",
            }}
          >
            <p
              className="text-[13px] font-semibold"
              style={{ color: "var(--th-text-primary)" }}
            >
              Settings
            </p>
            <button
              onClick={clearHistory}
              className="sidebar-btn text-[13px]"
              style={{ color: "var(--th-accent-rose)" }}
              id="clear-history-btn"
            >
              <Trash2 size={14} />
              Clear Chat History
            </button>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="sidebar-btn text-[13px]"
              style={{ color: "var(--th-accent-rose)" }}
              id="logout-btn"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div
            className="rounded-xl p-4 mb-4 space-y-2"
            style={{
              background: "var(--th-hover-bg)",
              border: "1px solid var(--th-border-subtle)",
            }}
          >
            <p
              className="text-[13px] font-semibold"
              style={{ color: "var(--th-text-primary)" }}
            >
              How to use Pathly
            </p>
            {[
              "Ask for routes: \"How to get to Mumbai Central?\"",
              "Check fares: \"Metro fare to AIIMS\"",
              "Find stops: \"Bus stops near me\"",
              "Get ETA: \"When is the next bus?\"",
              "Use voice: Click the mic button to speak",
            ].map((tip, i) => (
              <p
                key={i}
                className="text-[12px] leading-relaxed"
                style={{ color: "var(--th-text-muted)" }}
              >
                • {tip}
              </p>
            ))}
          </div>
        )}

        <div
          className="h-px mb-4"
          style={{ background: "var(--th-border-subtle)" }}
        />

        {/* Chat List */}
        <button
          onClick={() => setShowChatList(!showChatList)}
          className="flex items-center gap-1.5 text-[13px] font-medium mb-3 transition-colors"
          style={{ color: "var(--th-text-muted)" }}
        >
          Chat History
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${
              showChatList ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {showChatList && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
            {todayChats.length > 0 && (
              <div>
                <p
                  className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--th-text-faint)" }}
                >
                  Today
                </p>
                <div className="space-y-0.5">{todayChats.map(renderChatItem)}</div>
              </div>
            )}
            {yesterdayChats.length > 0 && (
              <div>
                <p
                  className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--th-text-faint)" }}
                >
                  Yesterday
                </p>
                <div className="space-y-0.5">
                  {yesterdayChats.map(renderChatItem)}
                </div>
              </div>
            )}
            {olderChats.length > 0 && (
              <div>
                <p
                  className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--th-text-faint)" }}
                >
                  Earlier
                </p>
                <div className="space-y-0.5">{olderChats.map(renderChatItem)}</div>
              </div>
            )}
            {chatHistory.length === 0 && (
              <p
                className="text-[12px] italic"
                style={{ color: "var(--th-text-faint)" }}
              >
                No conversations yet
              </p>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* User info at bottom */}
        {user && (
          <div
            className="flex items-center gap-2.5 mt-4 pt-4"
            style={{ borderTop: "1px solid var(--th-border-subtle)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium flex-shrink-0 overflow-hidden"
              style={{
                background: "var(--th-accent-purple)",
                color: "var(--th-btn-primary-text)",
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name[0].toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-[13px] font-medium leading-tight truncate"
                style={{ color: "var(--th-text-primary)" }}
              >
                {user.name}
              </span>
              <span
                className="text-[11px] leading-tight truncate"
                style={{ color: "var(--th-text-faint)" }}
              >
                {user.email}
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
