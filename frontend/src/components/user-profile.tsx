"use client";

import { User } from "lucide-react";

interface UserProfileProps {
  name: string;
  email: string;
}

export default function UserProfile({ name, email }: UserProfileProps) {
  return (
    <div className="absolute top-5 right-6 flex items-center gap-2.5 glass-card rounded-full py-1.5 pl-1.5 pr-4 cursor-pointer">
      <div className="w-7 h-7 rounded-full bg-[#e8e4ef] flex items-center justify-center">
        <User size={14} className="text-[#777]" />
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-[#1a1a1a] leading-tight">
          {name}
        </span>
        <span className="text-[11px] text-[#999] leading-tight">{email}</span>
      </div>
    </div>
  );
}
