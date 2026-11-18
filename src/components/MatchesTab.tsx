"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, GraduationCap, Sparkles, MessageCircle } from "lucide-react";
import { PublicMatch } from "@/types";

interface MatchesTabProps {
  matches: PublicMatch[];
  isLoading: boolean;
  onGoToDiscover: () => void;
}

const PASTEL_BG = [
  "bg-[#FFE1CF]", // peach
  "bg-[#D7ECFF]", // sky
  "bg-[#CBF4E0]", // mint
  "bg-[#FFE4EF]", // soft pink
  "bg-[#E7E0FF]", // lilac
  "bg-[#FFE45C]", // yellow
];

export function MatchesTab({
  matches,
  isLoading,
  onGoToDiscover,
}: MatchesTabProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F6F4FA]">
      {/* Top Header */}
      <div className="px-5 pt-4 pb-3 bg-white border-b-2 border-[#15121D] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black text-[#15121D] tracking-tight">
            Mutual Matches
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FF3D81] text-white border-2 border-[#15121D] shadow-[2px_2px_0_#15121D]">
            {matches.length}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {isLoading && matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#FF3D81] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[#6D6979]">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 h-full">
            <div className="w-20 h-20 rounded-full bg-white border-2 border-[#15121D] flex items-center justify-center text-[#FF3D81] mb-4 shadow-coy">
              <Heart className="w-10 h-10 fill-[#FFE4EF] stroke-[#FF3D81] stroke-[2.2]" />
            </div>
            <h3 className="text-2xl font-black text-[#15121D]">No matches yet</h3>
            <p className="text-xs font-semibold text-[#6D6979] mt-2 max-w-xs leading-relaxed">
              When someone you like secretly likes you back, they will appear here. The core promise of Coy: nobody else ever finds out.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={onGoToDiscover}
              className="mt-6 px-6 py-3 rounded-full bg-[#FF3D81] text-white text-xs font-black flex items-center gap-2 border-2 border-[#15121D] shadow-coy active:shadow-coy-active transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Discover profiles
            </motion.button>
          </div>
        ) : (
          /* Staggered Matches List */
          matches.map((match, idx) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25 }}
              className="bg-white border-2 border-[#15121D] rounded-2xl p-4 flex flex-col gap-3 shadow-coy hover:shadow-coy-lg transition-all"
            >
              <div className="flex items-center gap-3.5">
                {/* Photo with avatar ring */}
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-[#15121D] shadow-[2px_2px_0_#15121D] ${
                    PASTEL_BG[idx % PASTEL_BG.length]
                  }`}
                >
                  <img
                    src={match.photoUrl}
                    alt={match.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#15121D] truncate">
                      {match.name},{" "}
                      <span className="font-semibold text-[#6D6979]">
                        {match.age}
                      </span>
                    </h3>
                    <span className="text-[10px] font-black bg-[#CBF4E0] text-[#15121D] px-2 py-0.5 rounded-full border-2 border-[#15121D] shadow-[1.5px_1.5px_0_#15121D]">
                      Mutual Crush
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-[#6D6979] mt-0.5 truncate">
                    <span className="flex items-center gap-1 shrink-0 text-[#15121D]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF3D81]" />
                      {match.city}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate text-[#15121D]">
                      <GraduationCap className="w-3.5 h-3.5 text-[#15121D] shrink-0" />
                      {match.college}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio snippet */}
              <p className="text-xs font-medium text-[#15121D] bg-[#F6F4FA] p-2.5 rounded-xl border border-[#ECE9F2]">
                &ldquo;{match.bio}&rdquo;
              </p>

              {/* Interest tags & Coy WhatsApp-style CTA */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {match.interests.slice(0, 3).map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#E7E0FF] text-[#15121D] border border-[#15121D]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                <a
                  href={`https://api.whatsapp.com/send?text=Hey%20${encodeURIComponent(
                    match.name
                  )},%20we%20just%20matched%20on%20Coy!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#25D366] text-[#15121D] text-[11px] font-black rounded-full border-2 border-[#15121D] shadow-[2px_2px_0_#15121D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  Say Hi
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
