"use client";

import { Compass, Bus, CircleDollarSign, MapPin, Navigation, Clock, Route, Wallet } from "lucide-react";

interface SuggestionCardsProps {
  onSelect: (text: string) => void;
  mode?: string;
}

const MODE_SUGGESTIONS: Record<string, Array<{ text: string; icon: typeof Compass; gradient: string }>> = {
  general: [
    { text: "Find the fastest route to the airport", icon: Compass, gradient: "var(--th-accent-blue)" },
    { text: "What's the metro fare to Central Station?", icon: CircleDollarSign, gradient: "var(--th-accent-purple)" },
    { text: "Show nearby bus stops and directions", icon: MapPin, gradient: "var(--th-accent-rose)" },
    { text: "When is the next bus arriving?", icon: Clock, gradient: "var(--th-accent-green)" },
    { text: "Navigate me to the railway station", icon: Navigation, gradient: "var(--th-accent-blue)" },
    { text: "Plan my trip from here to the mall", icon: Route, gradient: "var(--th-accent-purple)" },
  ],
  journey: [
    { text: "Plan cheapest trip to the airport", icon: Wallet, gradient: "var(--th-accent-green)" },
    { text: "Best metro + bus combo to University", icon: Route, gradient: "var(--th-accent-blue)" },
    { text: "3 options to reach Central Market from here", icon: Compass, gradient: "var(--th-accent-purple)" },
    { text: "How to reach the hospital fastest?", icon: Navigation, gradient: "var(--th-accent-rose)" },
  ],
  fare: [
    { text: "Compare all fares to the airport", icon: CircleDollarSign, gradient: "var(--th-accent-purple)" },
    { text: "Metro vs auto fare to Connaught Place", icon: Wallet, gradient: "var(--th-accent-green)" },
    { text: "How much does Ola cost to the station?", icon: CircleDollarSign, gradient: "var(--th-accent-blue)" },
    { text: "Cheapest way to travel 15km in this city", icon: Bus, gradient: "var(--th-accent-rose)" },
  ],
  navigate: [
    { text: "Walk me to the nearest metro station", icon: Navigation, gradient: "var(--th-accent-blue)" },
    { text: "Driving directions to the airport", icon: Compass, gradient: "var(--th-accent-green)" },
    { text: "Navigate to the bus terminal", icon: MapPin, gradient: "var(--th-accent-rose)" },
    { text: "Step-by-step route to the railway station", icon: Route, gradient: "var(--th-accent-purple)" },
  ],
  schedule: [
    { text: "Next bus at my nearest stop", icon: Bus, gradient: "var(--th-accent-green)" },
    { text: "Metro timings at the closest station", icon: Clock, gradient: "var(--th-accent-blue)" },
    { text: "Show all upcoming transport near me", icon: MapPin, gradient: "var(--th-accent-rose)" },
    { text: "Is this peak hour for buses?", icon: Clock, gradient: "var(--th-accent-purple)" },
  ],
};

export default function SuggestionCards({ onSelect, mode = "general" }: SuggestionCardsProps) {
  const suggestions = MODE_SUGGESTIONS[mode] || MODE_SUGGESTIONS.general;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3 w-full max-w-[700px]">
      {suggestions.map((s, i) => {
        const Icon = s.icon;
        return (
          <button
            key={`${mode}-${i}`}
            onClick={() => onSelect(s.text)}
            className="glass-card rounded-2xl p-3.5 md:p-4 text-left flex flex-col justify-between min-h-[80px] md:min-h-[100px] cursor-pointer group"
            id={`suggestion-card-${i}`}
          >
            <p
              className="text-[12px] md:text-[13px] leading-snug transition-colors duration-200"
              style={{ color: "var(--th-text-secondary)" }}
            >
              {s.text}
            </p>
            <Icon
              size={16}
              className="mt-2 transition-all duration-200 group-hover:translate-x-0.5"
              style={{ color: s.gradient, opacity: 0.7 }}
            />
          </button>
        );
      })}
    </div>
  );
}
