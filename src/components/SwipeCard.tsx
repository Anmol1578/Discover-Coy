"use client";

import React, { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { MapPin, GraduationCap } from "lucide-react";
import { PublicProfile } from "@/types";

interface SwipeCardProps {
  profile: PublicProfile;
  isTop: boolean;
  onSwipe: (direction: "LIKE" | "PASS") => void;
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  // Trigger programmatic swipe (e.g. from buttons or keys)
  triggerDirection?: "LIKE" | "PASS" | null;
  onAnimationComplete?: () => void;
}

export function SwipeCard({
  profile,
  isTop,
  onSwipe,
  isAnimating,
  setIsAnimating,
  triggerDirection,
  onAnimationComplete,
}: SwipeCardProps) {
  const controls = useAnimation();
  const x = useMotionValue(0);

  // Rotation tied to horizontal drag offset
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  // Stamp opacities
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);

  // Handle programmatic swipe trigger (buttons or keyboard)
  useEffect(() => {
    if (isTop && triggerDirection && !isAnimating) {
      setIsAnimating(true);
      const exitX = triggerDirection === "LIKE" ? 500 : -500;
      controls
        .start({
          x: exitX,
          opacity: 0,
          rotate: triggerDirection === "LIKE" ? 20 : -20,
          transition: { duration: 0.28, ease: "easeOut" },
        })
        .then(() => {
          onSwipe(triggerDirection);
          setIsAnimating(false);
          onAnimationComplete?.();
        });
    }
  }, [
    triggerDirection,
    isTop,
    isAnimating,
    controls,
    onSwipe,
    setIsAnimating,
    onAnimationComplete,
  ]);

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isAnimating) return;

    const threshold = 100;
    const velocityThreshold = 450;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> LIKE
      setIsAnimating(true);
      await controls.start({
        x: 500,
        opacity: 0,
        rotate: 20,
        transition: { duration: 0.24, ease: "easeOut" },
      });
      onSwipe("LIKE");
      setIsAnimating(false);
      onAnimationComplete?.();
    } else if (
      info.offset.x < -threshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Swiped Left -> PASS
      setIsAnimating(true);
      await controls.start({
        x: -500,
        opacity: 0,
        rotate: -20,
        transition: { duration: 0.24, ease: "easeOut" },
      });
      onSwipe("PASS");
      setIsAnimating(false);
      onAnimationComplete?.();
    } else {
      // Return to center
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      });
    }
  };

  if (!isTop) {
    // Background card: scaled slightly behind the top card
    return (
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-lg pointer-events-none select-none transition-transform duration-300"
        style={{
          transform: "scale(0.95) translateY(10px)",
          opacity: 0.7,
        }}
      >
        <img
          src={profile.photoUrl}
          alt={profile.name}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/80 to-transparent top-[35%]" />
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {profile.name},{" "}
            <span className="font-normal text-neutral-300">{profile.age}</span>
          </h2>
          <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.city}
            </span>
            <span className="flex items-center gap-1 truncate">
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              {profile.college}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-2xl cursor-grab active:cursor-grabbing select-none touch-none z-10"
      style={{ x, rotate }}
      drag={isAnimating ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      animate={controls}
      onDragEnd={handleDragEnd}
    >
      {/* LIKE Stamp */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 left-6 z-20 pointer-events-none -rotate-12 border-2 border-emerald-400 text-emerald-400 px-3.5 py-1 rounded-md text-xl font-extrabold tracking-widest uppercase bg-emerald-950/30 backdrop-blur-sm"
      >
        LIKE
      </motion.div>

      {/* PASS Stamp */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-6 right-6 z-20 pointer-events-none rotate-12 border-2 border-rose-500 text-rose-500 px-3.5 py-1 rounded-md text-xl font-extrabold tracking-widest uppercase bg-rose-950/30 backdrop-blur-sm"
      >
        PASS
      </motion.div>

      {/* Full-bleed photo (Plain <img> as required for remote SVGs) */}
      <div className="relative w-full h-full bg-[#18181B]">
        <img
          src={profile.photoUrl}
          alt={profile.name}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/85 to-transparent top-[32%] pointer-events-none" />

        {/* Card info content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10 pointer-events-none">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {profile.name}
            </h2>
            <span className="text-xl font-medium text-neutral-300">
              {profile.age}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-300 mt-1 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              {profile.city}
            </span>
            <span className="flex items-center gap-1 truncate">
              <GraduationCap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              {profile.college}
            </span>
          </div>

          <p className="text-xs text-neutral-200 mt-2.5 line-clamp-3 leading-relaxed">
            {profile.bio}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#27272A]/90 text-neutral-200 border border-[#27272A]"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
