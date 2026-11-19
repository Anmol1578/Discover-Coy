import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getFeed } from "@/app/api/feed/route";
import { POST as postSwipe } from "@/app/api/swipe/route";
import { GET as getMatches } from "@/app/api/matches/route";
import { POST as postReset } from "@/app/api/reset/route";
import { resetFallbackSession, STATIC_PROFILES, COOKIE_NAME } from "@/lib/static-store";

function makeSwipeRequest(body: unknown, cookieHeader?: string): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  return new NextRequest("http://localhost:3000/api/swipe", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function makeGetRequest(url: string, cookieHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  return new NextRequest(url, { method: "GET", headers });
}

describe("Static Data Engine & Vercel Compatibility", () => {
  beforeEach(async () => {
    // Enable static mode for this test suite
    process.env.USE_STATIC_DATA = "true";
    resetFallbackSession();
  });

  it("1. Static profiles contain 35 profiles with 12 likedUser=true and match density in first 4", () => {
    expect(STATIC_PROFILES.length).toBe(35);
    const likedCount = STATIC_PROFILES.filter((p) => p.hasLikedCurrentUser).length;
    expect(likedCount).toBe(12);

    const firstFour = STATIC_PROFILES.slice(0, 4);
    const firstFourLiked = firstFour.filter((p) => p.hasLikedCurrentUser).length;
    expect(firstFourLiked).toBeGreaterThanOrEqual(2);
  });

  it("2. GET /api/feed returns all 35 profiles and never exposes private fields", async () => {
    const res = await getFeed();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(35);

    for (const p of data) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("interests");
      expect(Array.isArray(p.interests)).toBe(true);
      expect(p).not.toHaveProperty("hasLikedCurrentUser");
      expect(p).not.toHaveProperty("likedUser");
    }
  });

  it("3. Swiping PASS and LIKE updates state and removes them from subsequent feed", async () => {
    // PASS profile 1
    const passRes = await postSwipe(
      makeSwipeRequest({ profileId: "1", direction: "PASS" })
    );
    expect(passRes.status).toBe(200);
    const passBody = await passRes.json();
    expect(passBody).toEqual({ matched: false });

    // LIKE profile 10 (likedUser: true)
    const likeRes = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    expect(likeRes.status).toBe(200);
    const likeBody = await likeRes.json();
    expect(likeBody.matched).toBe(true);
    expect(likeBody.match.id).toBe("10");

    // Check feed: 33 profiles remaining, neither 1 nor 10 present
    const updatedRes = await getFeed();
    const updatedData = await updatedRes.json();
    expect(updatedData.length).toBe(33);
    const ids = updatedData.map((p: { id: string }) => p.id);
    expect(ids).not.toContain("1");
    expect(ids).not.toContain("10");
  });

  it("4. LIKE on non-liked profile returns matched: false", async () => {
    const res = await postSwipe(
      makeSwipeRequest({ profileId: "1", direction: "LIKE" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ matched: false });

    const matchesRes = await getMatches();
    const matches = await matchesRes.json();
    expect(matches.length).toBe(0);
  });

  it("5. Duplicate swipe returns 409 Conflict", async () => {
    const res1 = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    expect(res1.status).toBe(200);

    const dupRes = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    expect(dupRes.status).toBe(409);
  });

  it("6. Matches appear in GET /api/matches with strict public projection", async () => {
    await postSwipe(makeSwipeRequest({ profileId: "10", direction: "LIKE" }));

    const res = await getMatches();
    expect(res.status).toBe(200);
    const matches = await res.json();
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe("10");
    expect(matches[0]).toHaveProperty("matchedAt");
    expect(matches[0]).not.toHaveProperty("hasLikedCurrentUser");
  });

  it("7. Cookie-based session isolation allows stateless serverless persistence", async () => {
    // Simulate request with custom cookie
    const customSession = {
      swipes: { "1": "PASS" },
      matches: [],
    };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(customSession))}`;

    const req = makeGetRequest("http://localhost:3000/api/feed", cookieHeader);
    const res = await getFeed(req);
    const feed = await res.json();
    expect(feed.length).toBe(34);
    expect(feed.map((p: { id: string }) => p.id)).not.toContain("1");
  });

  it("8. POST /api/reset restores full deck and clears matches", async () => {
    await postSwipe(makeSwipeRequest({ profileId: "1", direction: "PASS" }));
    await postSwipe(makeSwipeRequest({ profileId: "10", direction: "LIKE" }));

    const resetRes = await postReset();
    expect(resetRes.status).toBe(200);

    const feedRes = await getFeed();
    const feed = await feedRes.json();
    expect(feed.length).toBe(35);

    const matchesRes = await getMatches();
    const matches = await matchesRes.json();
    expect(matches.length).toBe(0);
  });
});
