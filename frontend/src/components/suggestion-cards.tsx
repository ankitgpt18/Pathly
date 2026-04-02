"use client";

import { Compass, Bus, CircleDollarSign, MapPin } from "lucide-react";

interface SuggestionCardsProps {
  onSelect: (text: string) => void;
}

const suggestions = [
  {
    text: "Find the fastest route to the airport",
    icon: Compass,
  },
  {
    text: "Check real-time bus schedule nearby",
    icon: Bus,
  },
  {
    text: "What's the metro fare to Central Station",
    icon: CircleDollarSign,
  },
  {
    text: "Show nearby bus stops and directions",
    icon: MapPin,
  },
];

export default function SuggestionCards({ onSelect }: SuggestionCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-[680px]">
      {suggestions.map((s, i) => {
        const Icon = s.icon;
        return (
          <button
            key={i}
            onClick={() => onSelect(s.text)}
            className="glass-card rounded-2xl p-4 text-left flex flex-col justify-between min-h-[110px] cursor-pointer group"
          >
            <p className="text-[13px] text-[#444] leading-snug group-hover:text-[#1a1a1a] transition-colors duration-200">
              {s.text}
            </p>
            <Icon
              size={20}
              className="text-[#aaa] mt-3 group-hover:text-[#666] transition-colors duration-200"
            />
          </button>
        );
      })}
    </div>
  );
}
