import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET as getFeed } from "@/app/api/feed/route";
import { POST as postSwipe } from "@/app/api/swipe/route";
import { GET as getMatches } from "@/app/api/matches/route";
import { POST as postReset } from "@/app/api/reset/route";

function makeSwipeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/swipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Backend API Routes & Privacy Verification", () => {
  it("1. /api/feed returns unswiped profiles and no object contains hasLikedCurrentUser", async () => {
    const res = await getFeed();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(35);

    for (const profile of data) {
      expect(profile).toHaveProperty("id");
      expect(profile).toHaveProperty("name");
      expect(profile).toHaveProperty("age");
      expect(profile).toHaveProperty("photoUrl");
      expect(profile).toHaveProperty("bio");
      expect(profile).toHaveProperty("city");
      expect(profile).toHaveProperty("college");
      expect(profile).toHaveProperty("interests");
      expect(Array.isArray(profile.interests)).toBe(true);
      expect(profile).not.toHaveProperty("hasLikedCurrentUser");
      expect(profile).not.toHaveProperty("likedUser");
    }
  });

  it("2. After swiping PASS or LIKE, that profile never appears in the feed again", async () => {
    // Initial feed count
    const initialRes = await getFeed();
    const initialFeed = await initialRes.json();
    expect(initialFeed.length).toBe(35);

    // Swipe PASS on profile "1"
    const passRes = await postSwipe(
      makeSwipeRequest({ profileId: "1", direction: "PASS" })
    );
    expect(passRes.status).toBe(200);

    // Swipe LIKE on profile "10"
    const likeRes = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    expect(likeRes.status).toBe(200);

    // Check feed: both profiles 1 and 10 must be gone
    const updatedRes = await getFeed();
    const updatedFeed = await updatedRes.json();
    expect(updatedFeed.length).toBe(33);

    const ids = updatedFeed.map((p: { id: string }) => p.id);
    expect(ids).not.toContain("1");
    expect(ids).not.toContain("10");
  });

  it("3. LIKE on a profile with hasLikedCurrentUser = false returns { matched: false } and creates zero Match rows", async () => {
    // Profile 1 has hasLikedCurrentUser = false
    const target = await prisma.profile.findUnique({ where: { id: "1" } });
    expect(target?.hasLikedCurrentUser).toBe(false);

    const res = await postSwipe(
      makeSwipeRequest({ profileId: "1", direction: "LIKE" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ matched: false });

    const matchCount = await prisma.match.count();
    expect(matchCount).toBe(0);

    const swipeRecord = await prisma.swipe.findUnique({
      where: { profileId: "1" },
    });
    expect(swipeRecord).not.toBeNull();
    expect(swipeRecord?.direction).toBe("LIKE");
  });

  it("4. PASS on a profile with hasLikedCurrentUser = true returns { matched: false } and creates zero Match rows", async () => {
    // Profile 10 has hasLikedCurrentUser = true
    const target = await prisma.profile.findUnique({ where: { id: "10" } });
    expect(target?.hasLikedCurrentUser).toBe(true);

    const res = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "PASS" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ matched: false });

    const matchCount = await prisma.match.count();
    expect(matchCount).toBe(0);

    const swipeRecord = await prisma.swipe.findUnique({
      where: { profileId: "10" },
    });
    expect(swipeRecord).not.toBeNull();
    expect(swipeRecord?.direction).toBe("PASS");
  });

  it("5. LIKE on a profile with hasLikedCurrentUser = true returns matched: true and the profile shows up in /api/matches", async () => {
    // Profile 10 has hasLikedCurrentUser = true
    const target = await prisma.profile.findUnique({ where: { id: "10" } });
    expect(target?.hasLikedCurrentUser).toBe(true);

    const res = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(true);
    expect(body.match).toBeDefined();
    expect(body.match.id).toBe("10");
    expect(body.match.name).toBe(target?.name);
    expect(body.match).toHaveProperty("matchedAt");
    expect(body.match).not.toHaveProperty("hasLikedCurrentUser");
    expect(body.match).not.toHaveProperty("likedUser");

    // Verify it shows up in GET /api/matches
    const matchesRes = await getMatches();
    expect(matchesRes.status).toBe(200);
    const matches = await matchesRes.json();
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe("10");
    expect(matches[0].name).toBe(target?.name);
    expect(matches[0]).not.toHaveProperty("hasLikedCurrentUser");
  });

  it("6. A duplicate swipe on the same profile returns 409 and leaves exactly one Swipe row and at most one Match row", async () => {
    // First swipe
    const firstRes = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    expect(firstRes.status).toBe(200);

    // Duplicate swipe with same direction
    const dupRes = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    expect(dupRes.status).toBe(409);
    const dupBody = await dupRes.json();
    expect(dupBody).toHaveProperty("error");

    // Duplicate swipe with opposite direction
    const passRes = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "PASS" })
    );
    expect(passRes.status).toBe(409);

    const swipeCount = await prisma.swipe.count({
      where: { profileId: "10" },
    });
    expect(swipeCount).toBe(1);

    const matchCount = await prisma.match.count({
      where: { profileId: "10" },
    });
    expect(matchCount).toBe(1);
  });

  it("7. Invalid direction or missing profileId returns 400; unknown profile returns 404", async () => {
    // Missing body or empty object
    const emptyRes = await postSwipe(makeSwipeRequest({}));
    expect(emptyRes.status).toBe(400);

    // Missing profileId
    const noProfileRes = await postSwipe(
      makeSwipeRequest({ direction: "LIKE" })
    );
    expect(noProfileRes.status).toBe(400);

    // Invalid direction
    const badDirRes = await postSwipe(
      makeSwipeRequest({ profileId: "1", direction: "SUPERLIKE" })
    );
    expect(badDirRes.status).toBe(400);

    // Unknown profile
    const unknownRes = await postSwipe(
      makeSwipeRequest({ profileId: "nonexistent-9999", direction: "LIKE" })
    );
    expect(unknownRes.status).toBe(404);
  });

  it("8. Privacy: the JSON bodies of /api/feed, /api/swipe (both matched and unmatched cases), and /api/matches do not contain the string hasLikedCurrentUser or likedUser anywhere", async () => {
    // 1. Feed response
    const feedRes = await getFeed();
    const feedText = await feedRes.text();
    expect(feedText).not.toContain("hasLikedCurrentUser");
    expect(feedText).not.toContain("likedUser");

    // 2. Swipe unmatched response (PASS on profile 1)
    const unmatchedRes = await postSwipe(
      makeSwipeRequest({ profileId: "1", direction: "PASS" })
    );
    const unmatchedText = await unmatchedRes.text();
    expect(unmatchedText).not.toContain("hasLikedCurrentUser");
    expect(unmatchedText).not.toContain("likedUser");

    // 3. Swipe matched response (LIKE on profile 10)
    const matchedRes = await postSwipe(
      makeSwipeRequest({ profileId: "10", direction: "LIKE" })
    );
    const matchedText = await matchedRes.text();
    expect(matchedText).not.toContain("hasLikedCurrentUser");
    expect(matchedText).not.toContain("likedUser");

    // 4. Matches response
    const matchesRes = await getMatches();
    const matchesText = await matchesRes.text();
    expect(matchesText).not.toContain("hasLikedCurrentUser");
    expect(matchesText).not.toContain("likedUser");
  });

  it("9. /api/reset clears swipes and matches and the feed is full again", async () => {
    // Create swipes and a match
    await postSwipe(makeSwipeRequest({ profileId: "1", direction: "PASS" }));
    await postSwipe(makeSwipeRequest({ profileId: "10", direction: "LIKE" }));

    // Verify state before reset
    const midFeedRes = await getFeed();
    const midFeed = await midFeedRes.json();
    expect(midFeed.length).toBe(33);

    const midMatchesRes = await getMatches();
    const midMatches = await midMatchesRes.json();
    expect(midMatches.length).toBe(1);

    // Call POST /api/reset
    const resetRes = await postReset();
    expect(resetRes.status).toBe(200);

    // Feed should be full (35)
    const resetFeedRes = await getFeed();
    const resetFeed = await resetFeedRes.json();
    expect(resetFeed.length).toBe(35);

    // Matches should be empty (0)
    const resetMatchesRes = await getMatches();
    const resetMatches = await resetMatchesRes.json();
    expect(resetMatches.length).toBe(0);

    // Database counts must be 0
    const swipeCount = await prisma.swipe.count();
    const matchCount = await prisma.match.count();
    expect(swipeCount).toBe(0);
    expect(matchCount).toBe(0);
  });
});
