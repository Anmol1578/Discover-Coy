"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, RotateCcw, Sparkles, ShieldCheck } from "lucide-react";
import { SwipeCard } from "./SwipeCard";
import { PublicProfile } from "@/types";

interface DiscoverTabProps {
  isActive: boolean;
  isModalOpen: boolean;
  onMatch: (matchedProfile: PublicProfile) => void;
  onRefreshMatches: () => void;
}

interface FloatingHeart {
  id: number;
  xOffset: number;
  yOffset: number;
  scale: number;
}

export function DiscoverTab({
  isActive,
  isModalOpen,
  onMatch,
  onRefreshMatches,
}: DiscoverTabProps) {
  const [feed, setFeed] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [triggerDirection, setTriggerDirection] = useState<"LIKE" | "PASS" | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data: PublicProfile[] = await res.json();
        setFeed(data);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const triggerHeartBurst = () => {
    const burst = Array.from({ length: 7 }).map((_, i) => ({
      id: Date.now() + i,
      xOffset: (Math.random() - 0.5) * 120,
      yOffset: -80 - Math.random() * 80,
      scale: 0.6 + Math.random() * 0.7,
    }));
    setFloatingHearts((prev) => [...prev, ...burst]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !burst.some((b) => b.id === h.id)));
    }, 900);
  };

  const handleSwipe = useCallback(
    (direction: "LIKE" | "PASS") => {
      if (feed.length === 0) return;

      const swipedProfile = feed[0];
      if (direction === "LIKE") {
        triggerHeartBurst();
      }

      setFeed((prev) => prev.slice(1));
      setTriggerDirection(null);

      fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: swipedProfile.id,
          direction,
        }),
      })
        .then(async (res) => {
          if (res.status === 409) return;
          if (res.ok) {
            const data = await res.json();
            if (data.matched && data.match) {
              onMatch(data.match);
              onRefreshMatches();
            }
          }
        })
        .catch((error) => {
          console.error("Error submitting swipe:", error);
        });
    },
    [feed, onMatch, onRefreshMatches]
  );

  const handleProgrammaticSwipe = useCallback(
    (direction: "LIKE" | "PASS") => {
      if (isAnimating || feed.length === 0 || !isActive || isModalOpen) return;
      if (direction === "LIKE") {
        triggerHeartBurst();
      }
      setTriggerDirection(direction);
    },
    [isAnimating, feed.length, isActive, isModalOpen]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isModalOpen || isAnimating || feed.length === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleProgrammaticSwipe("PASS");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleProgrammaticSwipe("LIKE");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isModalOpen, isAnimating, feed.length, handleProgrammaticSwipe]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        await fetchFeed();
        onRefreshMatches();
      }
    } catch (err) {
      console.error("Failed to reset:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const currentProfile = feed[0];
  const nextProfile = feed[1];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F6F4FA] overflow-hidden select-none relative">
      <div className="px-5 pt-3.5 pb-2.5 flex items-center justify-between shrink-0 bg-[#FFE4EF] border-b-2 border-[#15121D]">
        <div className="flex items-center gap-2.5">
          <img
            src="/coy-wordmark.svg"
            alt="Coy"
            className="h-7 w-auto block select-none pointer-events-none"
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE45C] border-2 border-[#15121D] text-[11px] font-black shadow-[1.5px_1.5px_0_#15121D] -rotate-1">
            <ShieldCheck className="w-3 h-3 text-[#15121D]" />
            100% private
          </span>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#CBF4E0] border-2 border-[#15121D] text-[11px] font-black text-[#15121D] shadow-[2px_2px_0_#15121D]">
          {feed.length > 0 ? `${feed.length} profiles` : "Deck empty"}
        </span>
      </div>

      <div className="flex-1 relative mx-4 my-3 flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#FF3D81] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#6D6979]">Loading crush feed...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="w-full h-full max-h-[520px] rounded-[28px] bg-white border-2 border-[#15121D] p-6 flex flex-col items-center justify-center text-center shadow-coy-lg">
            <div className="w-18 h-18 rounded-full bg-[#FFE4EF] border-2 border-[#15121D] flex items-center justify-center text-[#FF3D81] mb-4 shadow-coy p-4">
              <Sparkles className="w-9 h-9 fill-[#FF3D81]" />
            </div>
            <h3 className="text-2xl font-black text-[#15121D] tracking-tight">
              You&apos;ve seen everyone!
            </h3>
            <p className="text-xs text-[#6D6979] font-medium mt-2 max-w-xs leading-relaxed">
              You&apos;re all caught up. No one knows you swiped unless they also add you secretly. Reset below to test swiping again.
            </p>

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={handleReset}
              disabled={isResetting}
              className="mt-6 px-6 py-3 rounded-full bg-[#FF3D81] text-white text-xs font-black flex items-center gap-2 border-2 border-[#15121D] shadow-coy active:shadow-coy-active transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`} />
              {isResetting ? "Resetting..." : "Reset demo profiles"}
            </motion.button>
          </div>
        ) : (
          <div className="relative w-full h-full max-h-[560px]">
            {nextProfile && (
              <SwipeCard
                key={nextProfile.id}
                profile={nextProfile}
                isTop={false}
                onSwipe={handleSwipe}
                isAnimating={isAnimating}
                setIsAnimating={setIsAnimating}
              />
            )}

            {currentProfile && (
              <SwipeCard
                key={currentProfile.id}
                profile={currentProfile}
                isTop={true}
                onSwipe={handleSwipe}
                isAnimating={isAnimating}
                setIsAnimating={setIsAnimating}
                triggerDirection={triggerDirection}
                onAnimationComplete={() => setTriggerDirection(null)}
              />
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {floatingHearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: h.scale,
              x: h.xOffset,
              y: h.yOffset,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="absolute bottom-20 left-1/2 pointer-events-none z-50 -translate-x-1/2"
          >
            <div className="w-8 h-8 rounded-full bg-[#FF3D81] border-2 border-[#15121D] flex items-center justify-center text-white shadow-coy-sm">
              <Heart className="w-4 h-4 fill-white stroke-[2.5]" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="px-6 py-3 flex items-center justify-center gap-7 shrink-0 bg-[#FFE1CF] border-t-2 border-[#15121D]">
        <motion.button
          whileHover={{ scale: 1.08, rotate: -6, y: -2 }}
          whileTap={{ scale: 0.9, rotate: 0, y: 2 }}
          onClick={() => handleProgrammaticSwipe("PASS")}
          disabled={isAnimating || feed.length === 0}
          title="Pass (Left arrow)"
          aria-label="Pass profile"
          className="w-14 h-14 rounded-full bg-white border-2 border-[#15121D] flex items-center justify-center text-[#15121D] hover:bg-[#FFE1CF] shadow-coy active:shadow-coy-active transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <X className="w-7 h-7 stroke-[2.8]" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={handleReset}
          disabled={isResetting}
          title="Reset Demo Profiles"
          aria-label="Reset demo profiles"
          className="w-10 h-10 rounded-full bg-[#FFE45C] border-2 border-[#15121D] flex items-center justify-center text-[#15121D] shadow-coy-sm active:shadow-coy-active"
        >
          <RotateCcw className={`w-4 h-4 stroke-[2.5] ${isResetting ? "animate-spin" : ""}`} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 6, y: -3 }}
          whileTap={{ scale: 0.88, rotate: 0, y: 3 }}
          onClick={() => handleProgrammaticSwipe("LIKE")}
          disabled={isAnimating || feed.length === 0}
          title="Like (Right arrow)"
          aria-label="Like profile"
          className="w-16 h-16 rounded-full bg-[#FF3D81] border-2 border-[#15121D] flex items-center justify-center text-white shadow-coy-lg active:shadow-coy-active transition-all disabled:opacity-40 disabled:pointer-events-none relative group"
        >
          <Heart className="w-8 h-8 fill-white stroke-[2.2] group-hover:scale-110 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
}
