"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

interface HomeTabProps {
  onGoToDiscover?: () => void;
}

export function HomeTab({ onGoToDiscover }: HomeTabProps) {
  return (
    <div className="flex-1 w-full bg-[#F6F4FA] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-xs bg-white border-2 border-[#15121D] rounded-3xl p-6 shadow-coy text-center">
        <div className="w-14 h-14 rounded-full bg-[#FFE45C] border-2 border-[#15121D] flex items-center justify-center text-[#15121D] mx-auto mb-3 shadow-coy-sm">
          <Sparkles className="w-7 h-7 fill-[#15121D]" />
        </div>
        <h2 className="text-xl font-black text-[#15121D] tracking-tight">
          Home Tab
        </h2>
        <p className="text-xs font-semibold text-[#6D6979] mt-2 leading-relaxed">
          Intentionally blank per the Coy assignment specifications.
        </p>

        {onGoToDiscover && (
          <div className="mt-5">
            <button
              onClick={onGoToDiscover}
              className="w-full py-2.5 px-4 rounded-full bg-[#FF3D81] text-white text-xs font-black border-2 border-[#15121D] shadow-coy active:shadow-coy-active transition-all flex items-center justify-center gap-1.5"
            >
              Go to Discover Deck
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
