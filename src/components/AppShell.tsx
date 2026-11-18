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
    <div className="w-full h-[100dvh] bg-[#ECE9F2] flex items-center justify-center sm:p-4">
      {/* Shell: Centered max-w-[430px] on desktop with Coy 2px border and hard shadow, full-bleed on mobile */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:max-h-[96vh] flex flex-col overflow-hidden sm:rounded-[36px] sm:border-2 sm:border-[#15121D] sm:shadow-coy-xl relative bg-[#F6F4FA]">
        {/* Tab Content Views */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === "home" && (
            <HomeTab onGoToDiscover={() => setActiveTab("discover")} />
          )}

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
          match={matchedProfile}
          isOpen={matchedProfile !== null}
          onClose={handleCloseModal}
          onViewMatches={handleViewMatches}
        />
      </div>
    </div>
  );
}
