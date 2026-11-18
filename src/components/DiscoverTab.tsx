"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Heart, RotateCcw, Sparkles } from "lucide-react";
import { SwipeCard } from "./SwipeCard";
import { PublicProfile } from "@/types";

interface DiscoverTabProps {
  isActive: boolean;
  isModalOpen: boolean;
  onMatch: (matchedProfile: PublicProfile) => void;
  onRefreshMatches: () => void;
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

  // Load feed from GET /api/feed on mount
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

  // Handle swipe completion (both drag and button/keyboard)
  const handleSwipe = useCallback(
    (direction: "LIKE" | "PASS") => {
      if (feed.length === 0) return;

      const swipedProfile = feed[0];

      // Optimistically advance the deck
      setFeed((prev) => prev.slice(1));
      setTriggerDirection(null);

      // Background API call: POST /api/swipe
      fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: swipedProfile.id,
          direction,
        }),
      })
        .then(async (res) => {
          if (res.status === 409) {
            // Already swiped - ignore gracefully
            return;
          }
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

  // Programmatic swipe via buttons or arrow keys
  const handleProgrammaticSwipe = useCallback(
    (direction: "LIKE" | "PASS") => {
      if (isAnimating || feed.length === 0 || !isActive || isModalOpen) return;
      setTriggerDirection(direction);
    },
    [isAnimating, feed.length, isActive, isModalOpen]
  );

  // Desktop keyboard shortcuts (ArrowLeft = PASS, ArrowRight = LIKE)
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

  // Demo reset helper
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
    <div className="flex-1 flex flex-col h-full bg-[#0D0D0F] overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Discover
          </h1>
        </div>
        <span className="text-xs text-neutral-500 font-medium">
          {feed.length > 0 ? `${feed.length} profiles left` : "Deck empty"}
        </span>
      </div>

      {/* Card Arena */}
      <div className="flex-1 relative mx-3 my-2 flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-neutral-500">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading profiles...</p>
          </div>
        ) : feed.length === 0 ? (
          /* Empty State */
          <div className="w-full h-full max-h-[540px] rounded-2xl bg-[#18181B] border border-[#27272A] p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-[#27272A] flex items-center justify-center text-rose-500 mb-4 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              You&apos;ve seen everyone for now
            </h3>
            <p className="text-xs text-neutral-400 mt-2 max-w-xs leading-relaxed">
              Check back later for new profiles, or reset the demo deck to test swiping again.
            </p>

            <button
              onClick={handleReset}
              disabled={isResetting}
              className="mt-6 px-5 py-2.5 rounded-xl bg-[#27272A] hover:bg-[#323236] text-neutral-200 text-xs font-semibold flex items-center gap-2 border border-[#3F3F46] transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`}
              />
              {isResetting ? "Resetting..." : "Reset demo profiles"}
            </button>
          </div>
        ) : (
          /* Card Stack */
          <div className="relative w-full h-full max-h-[580px]">
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

      {/* Action Buttons (Pass ✕ and Like ♥) */}
      <div className="px-6 py-3 flex items-center justify-center gap-6 shrink-0">
        <button
          onClick={() => handleProgrammaticSwipe("PASS")}
          disabled={isAnimating || feed.length === 0}
          title="Pass (Left arrow)"
          aria-label="Pass profile"
          className="w-14 h-14 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-neutral-400 hover:text-white hover:border-rose-500/50 hover:bg-[#222226] shadow-lg transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
        >
          <X className="w-7 h-7 stroke-[2.2]" />
        </button>

        <button
          onClick={() => handleProgrammaticSwipe("LIKE")}
          disabled={isAnimating || feed.length === 0}
          title="Like (Right arrow)"
          aria-label="Like profile"
          className="w-14 h-14 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-rose-500 hover:text-rose-400 hover:border-rose-500 hover:bg-rose-500/10 shadow-lg transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Heart className="w-7 h-7 fill-rose-500/20 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
}
