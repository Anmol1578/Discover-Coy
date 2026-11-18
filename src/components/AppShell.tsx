"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TabType, PublicProfile, PublicMatch } from "@/types";
import { DiscoverTab } from "./DiscoverTab";
import { MatchesTab } from "./MatchesTab";
import { HomeTab } from "./HomeTab";
import { TabBar } from "./TabBar";
import { MatchModal } from "./MatchModal";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabType>("discover");
  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<PublicProfile | null>(null);

  // Fetch matches from GET /api/matches
  const fetchMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data: PublicMatch[] = await res.json();
        setMatches(data);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  // Fetch matches on initial mount
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Refetch when switching to matches tab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "matches") {
      fetchMatches();
    }
  };

  const handleMatch = (profile: PublicProfile) => {
    setMatchedProfile(profile);
    fetchMatches();
  };

  const handleViewMatches = () => {
    setMatchedProfile(null);
    setActiveTab("matches");
    fetchMatches();
  };

  const handleCloseModal = () => {
    setMatchedProfile(null);
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0D0D0F] flex justify-center">
      {/* Shell: Centered max-w-[430px] on desktop, full-bleed on mobile */}
      <div className="w-full max-w-[430px] h-[100dvh] flex flex-col overflow-hidden border-x border-[#27272A] relative bg-[#0D0D0F]">
        {/* Tab Content Views */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === "home" && <HomeTab />}

          {/* Keep Discover mounted to preserve card stack state across tab switching */}
          <div
            className={`flex-1 flex flex-col overflow-hidden ${
              activeTab === "discover" ? "block" : "hidden"
            }`}
          >
            <DiscoverTab
              isActive={activeTab === "discover"}
              isModalOpen={matchedProfile !== null}
              onMatch={handleMatch}
              onRefreshMatches={fetchMatches}
            />
          </div>

          {activeTab === "matches" && (
            <MatchesTab
              matches={matches}
              isLoading={isLoadingMatches}
              onGoToDiscover={() => setActiveTab("discover")}
            />
          )}
        </div>

        {/* Fixed Bottom Tab Bar */}
        <TabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          matchesCount={matches.length}
        />

        {/* Mutual Match Modal */}
        <MatchModal
          isOpen={matchedProfile !== null}
          match={matchedProfile}
          onClose={handleCloseModal}
          onViewMatches={handleViewMatches}
        />
      </div>
    </div>
  );
}
