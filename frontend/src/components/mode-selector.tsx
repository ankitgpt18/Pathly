"use client";

import { Map, DollarSign, Compass, CalendarClock, Navigation } from "lucide-react";

export interface ModeOption {
  id: string;
  label: string;
  icon: typeof Map;
  description: string;
}

export const MODES: ModeOption[] = [
  { id: "general", label: "Chat", icon: Compass, description: "Ask anything about transport" },
  { id: "journey", label: "Journey", icon: Map, description: "Plan multi-modal trips" },
  { id: "fare", label: "Fares", icon: DollarSign, description: "Compare fares across modes" },
  { id: "navigate", label: "Navigate", icon: Navigation, description: "Turn-by-turn directions" },
  { id: "schedule", label: "Schedule", icon: CalendarClock, description: "Check timings & arrivals" },
];

interface ModeSelectorProps {
  value: string;
  onChange: (mode: string) => void;
}

export default function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector-row">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={`mode-pill ${active ? "active" : ""}`}
            title={mode.description}
            id={`mode-${mode.id}`}
          >
            <Icon size={13} />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
