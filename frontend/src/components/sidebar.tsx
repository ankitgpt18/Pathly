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
  PanelLeftClose,
  SquarePen,
  Search,
  MoreHorizontal,
  Share,
  Pencil,
  Pin,
  Archive,
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
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  city?: string | null;
}

export default function Sidebar({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onClose,
  city,
}: SidebarProps) {
  const [showChatList, setShowChatList] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { user, logout } = useAuth();

  const now = Date.now();
  const oneDay = 86400000;

  const todayChats = chatHistory.filter((c) => now - c.timestamp < oneDay);
  const yesterdayChats = chatHistory.filter(
    (c) => now - c.timestamp >= oneDay && now - c.timestamp < 2 * oneDay
  );
  const olderChats = chatHistory.filter((c) => now - c.timestamp >= 2 * oneDay);

  const renderChatItem = (chat: ChatHistoryItem) => (
    <div key={chat.id} className="relative mb-0.5">
      <button
        onClick={() => {
          onSelectChat(chat.id);
          onClose();
        }}
        className={`group w-full text-left text-[13px] text-ellipsis whitespace-nowrap overflow-hidden py-2 pl-2 pr-8 rounded-lg transition-colors duration-200 ${
          activeChatId === chat.id ? "sidebar-btn active" : "sidebar-btn"
        }`}
        style={{ fontSize: "13px", padding: "6px 8px 6px 8px" }}
      >
        {chat.title}
        
        {/* Right gradient fade simulating the ChatGPT text clipping effect */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--th-glass-sidebar)] to-transparent opacity-100 group-hover:from-black/10 dark:group-hover:from-white/10 pointer-events-none rounded-r-lg" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(openMenuId === chat.id ? null : chat.id);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 opacity-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-md z-10 
          opacity-0 focus:opacity-100 peer-hover:opacity-100 hover:opacity-100 
          transition-opacity"
        style={{ color: "var(--th-text-primary)", opacity: openMenuId === chat.id ? 1 : undefined }}
        // we use a style override to keep opacity 1 if menu is open
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => { if (openMenuId !== chat.id) e.currentTarget.style.opacity = ""; }}
      >
        <MoreHorizontal size={14} />
      </button>

      {openMenuId === chat.id && (
        <div
          className="absolute z-[60] right-0 top-[100%] mt-1 w-36 rounded-xl border p-1 shadow-lg"
          style={{
            background: "var(--th-bg-primary)",
            borderColor: "var(--th-border-subtle)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5 rounded-md" style={{ color: "var(--th-text-primary)" }}>
            <Share size={12} /> Share
          </button>
          <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5 rounded-md" style={{ color: "var(--th-text-primary)" }}>
            <Pencil size={12} /> Rename
          </button>
          <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5 rounded-md" style={{ color: "var(--th-text-primary)" }}>
            <Pin size={12} /> Pin chat
          </button>
          <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5 rounded-md" style={{ color: "var(--th-text-primary)" }}>
            <Archive size={12} /> Archive
          </button>
          <div className="h-px w-full my-1" style={{ background: "var(--th-border-subtle)" }} />
          <button
            onClick={() => {
              onDeleteChat(chat.id);
              setOpenMenuId(null);
            }}
            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[12px] text-red-500 hover:bg-red-500/10 rounded-md"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
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
        className={`glass-sidebar h-full flex flex-col py-6 px-5 z-50 transition-all duration-300 ease-out
          fixed md:relative
          w-[280px] min-w-[280px]
          ${isOpen ? "translate-x-0 ml-0" : "-translate-x-full md:translate-x-0 md:-ml-[280px]"}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: "var(--th-text-muted)" }}
        >
          <PanelLeftClose size={18} />
        </button>

        {/* Logo and Title */}
        <div className="flex items-center gap-2.5 mb-2 pl-1 whitespace-nowrap">
          <img src="/logo.png" alt="Pathly" className="w-[30px] h-[30px] object-cover rounded-md" />
          <h1
            className="text-[19px] font-bold tracking-tight"
            style={{ 
              color: "var(--th-text-primary)",
              fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
            }}
          >
            Pathly
          </h1>
        </div>

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
            <SquarePen size={15} />
            New chat
          </button>
          
          <ThemeToggle />
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`sidebar-btn ${showHelp ? "active" : ""}`}
            id="help-btn"
          >
            <HelpCircle size={15} />
            Help
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`sidebar-btn ${showSettings ? "active" : ""}`}
            id="settings-btn"
          >
            <Settings size={15} />
            Settings
          </button>
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
