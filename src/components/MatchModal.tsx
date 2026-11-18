"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";
import { PublicProfile } from "@/types";

interface MatchModalProps {
  match: PublicProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onViewMatches: () => void;
}

export function MatchModal({
  match,
  isOpen,
  onClose,
  onViewMatches,
}: MatchModalProps) {
  if (!isOpen || !match) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-sm bg-[#18181B] border border-[#27272A] rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Subtle warm glow background */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Sparkle icon badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-4">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            It&apos;s a match!
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            You and <span className="text-neutral-100 font-semibold">{match.name}</span> liked each other.
          </p>

          {/* Matched Avatar */}
          <div className="relative my-6 inline-block">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-rose-500 shadow-lg shadow-rose-950/50 bg-[#27272A] mx-auto">
              <img
                src={match.photoUrl}
                alt={match.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-rose-500 rounded-full p-2 text-white border-2 border-[#18181B]">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-2">
            <button
              onClick={onViewMatches}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all shadow-md active:scale-[0.98]"
            >
              View matches
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-[#27272A] hover:bg-[#323236] text-neutral-200 font-semibold text-sm border border-[#3F3F46] transition-all active:scale-[0.98]"
            >
              Keep swiping
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
