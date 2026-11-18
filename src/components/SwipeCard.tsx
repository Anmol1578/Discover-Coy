"use client";

import React, { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { MapPin, GraduationCap, Heart, X, Sparkles } from "lucide-react";
import { PublicProfile } from "@/types";

interface SwipeCardProps {
  profile: PublicProfile;
  isTop: boolean;
  onSwipe: (direction: "LIKE" | "PASS") => void;
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  triggerDirection?: "LIKE" | "PASS" | null;
  onAnimationComplete?: () => void;
}

// Pastel color palette for interest tags matching getcoy.com
const TAG_COLORS = [
  "bg-[#FFE45C] text-[#15121D]", // yellow
  "bg-[#CBF4E0] text-[#15121D]", // mint
  "bg-[#D7ECFF] text-[#15121D]", // sky
  "bg-[#FFE1CF] text-[#15121D]", // peach
  "bg-[#E7E0FF] text-[#15121D]", // lilac
  "bg-[#FFE4EF] text-[#D81E63]", // soft pink
];

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

  // Dynamic rotation linked to drag distance
  const rotate = useTransform(x, [-240, 240], [-18, 18]);

  // Stamp opacities & scale for juicy feedback
  const likeOpacity = useTransform(x, [25, 110], [0, 1]);
  const likeScale = useTransform(x, [25, 120], [0.8, 1.12]);

  const passOpacity = useTransform(x, [-110, -25], [1, 0]);
  const passScale = useTransform(x, [-120, -25], [1.12, 0.8]);

  // Handle programmatic swipe trigger (e.g., buttons or arrow keys)
  useEffect(() => {
    if (isTop && triggerDirection && !isAnimating) {
      setIsAnimating(true);
      const exitX = triggerDirection === "LIKE" ? 550 : -550;
      controls
        .start({
          x: exitX,
          opacity: 0,
          rotate: triggerDirection === "LIKE" ? 22 : -22,
          transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
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

    const threshold = 110;
    const velocityThreshold = 450;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> LIKE
      setIsAnimating(true);
      await controls.start({
        x: 550,
        opacity: 0,
        rotate: 22,
        transition: { duration: 0.26, ease: "easeOut" },
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
        x: -550,
        opacity: 0,
        rotate: -22,
        transition: { duration: 0.26, ease: "easeOut" },
      });
      onSwipe("PASS");
      setIsAnimating(false);
      onAnimationComplete?.();
    } else {
      // Snap smoothly back to center with spring
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 450, damping: 28 },
      });
    }
  };

  if (!isTop) {
    // Background card: sits neatly stacked underneath with slight scale and hard shadow
    return (
      <div
        className="absolute inset-0 rounded-[28px] overflow-hidden bg-[#FFFFFF] border-2 border-[#15121D] shadow-coy pointer-events-none select-none transition-all duration-300 flex flex-col"
        style={{
          transform: "scale(0.95) translateY(12px)",
          opacity: 0.85,
        }}
      >
        {/* Photo Container */}
        <div className="relative w-full h-[60%] bg-[#F6F4FA] overflow-hidden border-b-2 border-[#15121D]">
          <img
            src={profile.photoUrl}
            alt={profile.name}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>

        {/* Card info content */}
        <div className="p-4 flex-1 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#15121D] tracking-tight">
                {profile.name},{" "}
                <span className="font-semibold text-[#6D6979]">{profile.age}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6D6979] mt-1 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF3D81]" />
                {profile.city}
              </span>
              <span>•</span>
              <span className="truncate flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#15121D]" />
                {profile.college}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-[28px] overflow-hidden bg-[#FFFFFF] border-2 border-[#15121D] shadow-coy-lg cursor-grab active:cursor-grabbing select-none touch-none z-10 flex flex-col"
      style={{ x, rotate }}
      drag={isAnimating ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      animate={controls}
      onDragEnd={handleDragEnd}
    >
      {/* LIKE Stamp: Coy Signature Pink Sticker */}
      <motion.div
        style={{ opacity: likeOpacity, scale: likeScale }}
        className="absolute top-5 left-5 z-30 pointer-events-none -rotate-12 bg-[#FF3D81] text-white border-2 border-[#15121D] px-4 py-1.5 rounded-full text-lg font-black tracking-wider uppercase shadow-coy flex items-center gap-1.5"
      >
        <Heart className="w-5 h-5 fill-white stroke-[2.5]" />
        LIKE
      </motion.div>

      {/* PASS Stamp: Coy Bold Dark Sticker */}
      <motion.div
        style={{ opacity: passOpacity, scale: passScale }}
        className="absolute top-5 right-5 z-30 pointer-events-none rotate-12 bg-[#15121D] text-[#FFE45C] border-2 border-[#15121D] px-4 py-1.5 rounded-full text-lg font-black tracking-wider uppercase shadow-coy flex items-center gap-1.5"
      >
        <X className="w-5 h-5 stroke-[3]" />
        PASS
      </motion.div>

      {/* Top Floating Badge (Coy-style sticker) */}
      <div className="absolute top-3 left-4 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFE45C] text-[#15121D] text-xs font-black rounded-full border-2 border-[#15121D] shadow-coy-sm -rotate-2">
          <Sparkles className="w-3 h-3 fill-[#15121D]" />
          Crush Candidate
        </span>
      </div>

      {/* Photo area */}
      <div className="relative w-full h-[58%] bg-[#F6F4FA] overflow-hidden border-b-2 border-[#15121D]">
        <img
          src={profile.photoUrl}
          alt={profile.name}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Subtle decorative Coy wave pattern or light gradient at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Bottom Profile Information */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white overflow-hidden pointer-events-none">
        <div>
          {/* Name & Age Header */}
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-[#15121D] tracking-tight">
              {profile.name}
              <span className="text-lg font-bold text-[#6D6979] ml-2">
                {profile.age}
              </span>
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E7E0FF] border-2 border-[#15121D] text-[#15121D]">
              Secret List
            </span>
          </div>

          {/* Location & College info with Coy styling */}
          <div className="flex items-center gap-2.5 text-xs text-[#6D6979] mt-1 font-semibold">
            <span className="flex items-center gap-1 text-[#15121D]">
              <MapPin className="w-3.5 h-3.5 text-[#FF3D81] shrink-0" />
              {profile.city}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate text-[#15121D]">
              <GraduationCap className="w-3.5 h-3.5 text-[#15121D] shrink-0" />
              {profile.college}
            </span>
          </div>

          {/* Short Bio */}
          <p className="text-xs text-[#15121D] font-medium mt-2 line-clamp-2 leading-relaxed bg-[#F6F4FA] p-2.5 rounded-xl border border-[#ECE9F2]">
            &ldquo;{profile.bio}&rdquo;
          </p>
        </div>

        {/* Interests: Playful pastel pills matching Coy */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {profile.interests.map((interest, idx) => {
            const colorClass = TAG_COLORS[idx % TAG_COLORS.length];
            return (
              <span
                key={interest}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full border-[1.5px] border-[#15121D] shadow-[1.5px_1.5px_0_#15121D] ${colorClass}`}
              >
                {interest}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
