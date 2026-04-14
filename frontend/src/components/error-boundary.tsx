"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Pathly Error]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="h-screen flex items-center justify-center px-4"
          style={{ background: "var(--th-bg-primary)" }}
        >
          <div className="glass-card rounded-2xl p-8 max-w-[400px] w-full text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(191, 91, 127, 0.1)" }}
            >
              <AlertTriangle size={22} style={{ color: "var(--th-accent-rose)" }} />
            </div>
            <h2
              className="text-[18px] font-semibold mb-2"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                color: "var(--th-text-primary)",
              }}
            >
              Something went wrong
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--th-text-muted)" }}>
              Pathly encountered an unexpected error. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200"
              style={{
                background: "var(--th-btn-primary-bg)",
                color: "var(--th-btn-primary-text)",
              }}
            >
              <RotateCw size={15} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
