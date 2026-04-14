"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  name: string;
  email: string;
  avatar?: string;
  isGuest: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => void;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = "pathly-auth";

function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = loadUser();
    setUser(saved);
    setIsLoading(false);
  }, []);

  const loginWithGoogle = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google Client ID not set. Using guest mode.");
      loginAsGuest();
      return;
    }

    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          try {
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            const googleUser: User = {
              name: payload.name || "User",
              email: payload.email || "",
              avatar: payload.picture || undefined,
              isGuest: false,
            };
            setUser(googleUser);
            saveUser(googleUser);
          } catch (err) {
            console.error("Google login parse error:", err);
          }
        },
      });
      window.google.accounts.id.prompt();
    } else {
      console.warn("Google Identity Services not loaded");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginAsGuest = useCallback(() => {
    const guest: User = {
      name: "Guest",
      email: "guest@pathly.ai",
      isGuest: true,
    };
    setUser(guest);
    saveUser(guest);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("pathly-chats");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

/* Google Identity Services type */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          prompt: () => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}
