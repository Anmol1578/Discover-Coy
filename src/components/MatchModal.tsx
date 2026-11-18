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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15121D]/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -5, y: 30 }}
          animate={{ opacity: 1, scale: 1, rotate: 2, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotate: -5, y: 30 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          className="w-full max-w-sm bg-[#FF3D81] border-2 border-[#15121D] rounded-[32px] p-6 text-center shadow-coy-xl relative overflow-hidden"
        >
          {/* Top Decorative Coy Sticker */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#FFE45C] text-[#15121D] font-black text-xs rounded-full border-2 border-[#15121D] shadow-coy-sm mb-4 -rotate-3">
            <Sparkles className="w-3.5 h-3.5 fill-[#15121D]" />
            Double-Blind Match!
          </div>

          {/* Heading */}
          <h2 className="text-4xl font-black text-[#15121D] tracking-tight leading-tight">
            It&apos;s a match!
          </h2>
          <p className="text-xs font-bold text-[#15121D]/80 mt-1.5 max-w-[260px] mx-auto">
            You and <span className="underline decoration-2">{match.name}</span> secretly liked each other on Coy.
          </p>

          {/* Overlapping Avatar Pair: Exactly matching getcoy.com hero art */}
          <div className="flex items-center justify-center my-6 select-none">
            {/* "You" avatar */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring" }}
              className="w-20 h-20 rounded-full bg-[#FFE1CF] border-2 border-[#15121D] flex items-center justify-center text-[#15121D] font-black text-lg shadow-coy-sm"
            >
              You
            </motion.div>

            {/* Overlapping heart badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.25, 1] }}
              transition={{ delay: 0.3, type: "spring", stiffness: 450 }}
              className="w-12 h-12 rounded-full bg-white border-2 border-[#15121D] flex items-center justify-center text-[#FF3D81] shadow-coy-sm -mx-4 z-20"
            >
              <Heart className="w-6 h-6 fill-[#FF3D81] stroke-[2.5]" />
            </motion.div>

            {/* "Them" avatar with photo */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring" }}
              className="w-20 h-20 rounded-full bg-[#D7ECFF] border-2 border-[#15121D] overflow-hidden shadow-coy-sm flex items-center justify-center"
            >
              <img
                src={match.photoUrl}
                alt={match.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Match Info Tag */}
          <div className="bg-white/90 border-2 border-[#15121D] rounded-xl px-3 py-2 text-xs font-bold text-[#15121D] mb-5 shadow-coy-sm">
            📍 {match.city} • 🎓 {match.college}
          </div>

          {/* Action CTAs: Neo-brutalist pill buttons */}
          <div className="flex flex-col gap-2.5">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96, y: 2 }}
              onClick={onViewMatches}
              className="w-full py-3.5 px-4 rounded-full bg-[#15121D] hover:bg-[#252033] text-white font-black text-sm border-2 border-[#15121D] shadow-coy active:shadow-coy-active transition-all"
            >
              View in Matches
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96, y: 2 }}
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-[#F6F4FA] text-[#15121D] font-black text-sm border-2 border-[#15121D] shadow-coy active:shadow-coy-active transition-all"
            >
              Keep Swiping
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
