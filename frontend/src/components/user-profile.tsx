"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "./auth-context";

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div
      className="absolute top-4 right-4 md:top-5 md:right-6 z-20"
      ref={dropdownRef}
    >
      <button
        onClick={() => setOpen(!open)}
        className="glass-card rounded-full py-1.5 pl-1.5 pr-3 flex items-center gap-2 cursor-pointer"
        id="user-profile-btn"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium overflow-hidden flex-shrink-0"
          style={{
            background: user.avatar ? "transparent" : "var(--th-accent-purple)",
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
            <User size={14} />
          )}
        </div>
        <span
          className="text-[13px] font-medium leading-tight hidden md:block"
          style={{ color: "var(--th-text-primary)" }}
        >
          {user.name}
        </span>
        <ChevronDown
          size={12}
          className={`hidden md:block transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--th-text-muted)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[200px] rounded-xl overflow-hidden"
          style={{
            background: "var(--th-bg-secondary)",
            border: "1px solid var(--th-border)",
            boxShadow: "0 8px 24px var(--th-shadow-md)",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--th-border-subtle)" }}
          >
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--th-text-primary)" }}
            >
              {user.name}
            </p>
            <p className="text-[11px]" style={{ color: "var(--th-text-faint)" }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors"
            style={{ color: "var(--th-accent-rose)" }}
            id="dropdown-logout-btn"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
