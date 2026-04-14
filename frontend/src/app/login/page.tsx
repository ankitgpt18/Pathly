"use client";

import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MapPin, Mic, Route, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, loginAsGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  return (
    <div className="login-bg flex items-center justify-center min-h-screen px-4">
      <div className="login-card w-full max-w-[420px] p-8 md:p-10">
        {/* Orb */}
        <div className="flex justify-center mb-6">
          <div className="orb-container">
            <div className="orb" />
            <div className="orb-shadow" />
          </div>
        </div>

        {/* Branding */}
        <h1
          className="text-center text-[32px] md:text-[36px] leading-tight mb-1"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            color: "var(--th-text-primary)",
          }}
        >
          Pathly
        </h1>
        <p
          className="text-center text-[14px] mb-8"
          style={{ color: "var(--th-text-muted)" }}
        >
          AI-powered transport assistant for all of India
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: MapPin, label: "Live Location" },
            { icon: Mic, label: "Voice Control" },
            { icon: Route, label: "Smart Routes" },
          ].map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
              style={{
                color: "var(--th-text-muted)",
                background: "var(--th-hover-bg)",
                border: "1px solid var(--th-border-subtle)",
              }}
            >
              <f.icon size={12} />
              {f.label}
            </span>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="space-y-3">
          <button
            onClick={loginWithGoogle}
            className="google-btn"
            id="google-login-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <div
            className="flex items-center gap-3 text-[12px]"
            style={{ color: "var(--th-text-faint)" }}
          >
            <div
              className="flex-1 h-px"
              style={{ background: "var(--th-border)" }}
            />
            or
            <div
              className="flex-1 h-px"
              style={{ background: "var(--th-border)" }}
            />
          </div>

          <button
            onClick={loginAsGuest}
            className="guest-btn"
            id="guest-login-btn"
          >
            Continue as Guest
            <ArrowRight size={16} />
          </button>
        </div>

        <p
          className="text-center text-[11px] mt-6"
          style={{ color: "var(--th-text-faint)" }}
        >
          Works across all Indian cities • Voice + text • No sign-up required
        </p>
      </div>
    </div>
  );
}
