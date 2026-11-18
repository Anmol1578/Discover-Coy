"use client";

import React from "react";
import { Home, Flame, Heart } from "lucide-react";
import { TabType } from "@/types";

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  matchesCount: number;
}

export function TabBar({
  activeTab,
  onTabChange,
  matchesCount,
}: TabBarProps) {
  const tabs = [
    {
      id: "home" as TabType,
      label: "Home",
      icon: Home,
    },
    {
      id: "discover" as TabType,
      label: "Discover",
      icon: Flame,
    },
    {
      id: "matches" as TabType,
      label: "Matches",
      icon: Heart,
      badge: matchesCount,
    },
  ];

  return (
    <nav className="h-16 bg-[#18181B] border-t border-[#27272A] flex items-center justify-around px-4 shrink-0 z-30 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center relative w-20 py-1 transition-colors ${
              isActive
                ? "text-rose-500 font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-6 h-6 transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
              />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 min-w-[18px] h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none border border-[#18181B]">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
