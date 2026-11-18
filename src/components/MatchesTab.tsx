"use client";

import React from "react";
import { Heart, MapPin, GraduationCap, Sparkles } from "lucide-react";
import { PublicMatch } from "@/types";

interface MatchesTabProps {
  matches: PublicMatch[];
  isLoading: boolean;
  onGoToDiscover: () => void;
}

export function MatchesTab({
  matches,
  isLoading,
  onGoToDiscover,
}: MatchesTabProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0D0F]">
      {/* Top Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#27272A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Matches
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            {matches.length}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center py-20 px-4 h-full">
            <div className="w-16 h-16 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-neutral-500 mb-4">
              <Heart className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-semibold text-white">No matches yet</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
              When someone you like also likes you back, they will appear here.
            </p>
            <button
              onClick={onGoToDiscover}
              className="mt-6 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Discover profiles
            </button>
          </div>
        ) : (
          /* Matches List */
          matches.map((match) => (
            <div
              key={match.id}
              className="bg-[#18181B] border border-[#27272A] rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm hover:border-[#3F3F46] transition-colors"
            >
              {/* Photo */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#27272A] border border-[#27272A]">
                <img
                  src={match.photoUrl}
                  alt={match.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate">
                    {match.name},{" "}
                    <span className="font-normal text-neutral-300">
                      {match.age}
                    </span>
                  </h3>
                  <span className="text-[10px] text-rose-400 font-medium bg-rose-500/10 px-1.5 py-0.5 rounded">
                    Mutual
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5 truncate">
                  <span className="flex items-center gap-1 shrink-0">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    {match.city}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <GraduationCap className="w-3 h-3 text-neutral-500 shrink-0" />
                    {match.college}
                  </span>
                </div>

                {/* Interest tags */}
                <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                  {match.interests.slice(0, 3).map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 text-[10px] rounded-md bg-[#27272A] text-neutral-300 font-medium truncate"
                    >
                      {interest}
                    </span>
                  ))}
                  {match.interests.length > 3 && (
                    <span className="text-[10px] text-neutral-500 font-medium">
                      +{match.interests.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
