"use client";

import React from "react";
import { motion } from "framer-motion";
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
    <nav className="h-16 bg-white border-t-2 border-[#15121D] flex items-center justify-around px-4 shrink-0 z-30 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center relative w-20 py-1 transition-all ${
              isActive
                ? "text-[#FF3D81] font-black"
                : "text-[#6D6979] hover:text-[#15121D] font-bold"
            }`}
          >
            <div className="relative">
              <motion.div
                animate={isActive ? { scale: [1, 1.25, 1.1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
              >
                <Icon
                  className={`w-6 h-6 stroke-[2.4] ${
                    isActive ? "fill-[#FFE4EF]" : ""
                  }`}
                />
              </motion.div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-3 px-1.5 min-w-[18px] h-4 rounded-full bg-[#FF3D81] text-white text-[10px] font-black flex items-center justify-center leading-none border border-[#15121D] shadow-[1px_1px_0_#15121D]">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight font-black">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
