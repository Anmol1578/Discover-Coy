import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import rawProfiles from "../../data/profiles.json";
import { toPublicProfile, PublicProfile, PublicMatch } from "./profiles";

export interface RawProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  college: string;
  bio: string;
  interests: string[];
  photo: string;
  likedUser: boolean;
}

export interface InternalProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  college: string;
  bio: string;
  photoUrl: string;
  interests: string[];
  hasLikedCurrentUser: boolean;
}

export interface SessionData {
  swipes: Record<string, "LIKE" | "PASS">;
  matches: Array<{ profileId: string; matchedAt: string }>;
}

export const COOKIE_NAME = "coy_session";

// Replicate exact ID swaps as in prisma/seed.ts:
// Swap id 3 (likedUser: false) with id 5 (likedUser: true).
// Swap id 7 (likedUser: true) with id 10 (likedUser: false).
// Guarantees at least 2 profiles with hasLikedCurrentUser = true in the first 4 profiles.
const idSwapMap: Record<number, number> = {
  3: 5,
  5: 3,
  7: 10,
  10: 7,
};

export const STATIC_PROFILES: InternalProfile[] = (rawProfiles as RawProfile[])
  .map((raw) => {
    const assignedId = idSwapMap[raw.id] !== undefined ? idSwapMap[raw.id] : raw.id;
    return {
      id: String(assignedId),
      name: raw.name,
      age: raw.age,
      city: raw.city,
      college: raw.college,
      bio: raw.bio,
      photoUrl: raw.photo,
      interests: raw.interests,
      hasLikedCurrentUser: raw.likedUser,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id)); // Lexical sort matching SQLite's `orderBy: { id: "asc" }`

export function getStaticProfileById(id: string): InternalProfile | undefined {
  return STATIC_PROFILES.find((p) => p.id === id);
}

// Global in-memory fallback session for headless or cookie-less requests
const globalState = globalThis as unknown as {
  __coy_fallback_session?: SessionData;
};

if (!globalState.__coy_fallback_session) {
  globalState.__coy_fallback_session = {
    swipes: {},
    matches: [],
  };
}

export function getFallbackSession(): SessionData {
  return globalState.__coy_fallback_session!;
}

export function resetFallbackSession(): void {
  globalState.__coy_fallback_session = {
    swipes: {},
    matches: [],
  };
}

/**
 * Reads session state from:
 * 1. NextRequest cookies / Cookie header
 * 2. next/headers cookies() (App Router server runtime)
 * 3. In-memory fallback
 */
export function getSession(req?: NextRequest): SessionData {
  let cookieVal: string | undefined;

  if (req) {
    cookieVal = req.cookies?.get(COOKIE_NAME)?.value;
    if (!cookieVal) {
      const cookieHeader = req.headers?.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
        if (match) {
          cookieVal = decodeURIComponent(match[1]);
        }
      }
    }
  }

  if (!cookieVal) {
    try {
      const cookieStore = cookies();
      cookieVal = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // In tests or outside server request context
    }
  }

  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      if (parsed && typeof parsed === "object") {
        return {
          swipes: parsed.swipes && typeof parsed.swipes === "object" ? parsed.swipes : {},
          matches: Array.isArray(parsed.matches) ? parsed.matches : [],
        };
      }
    } catch {
      // Invalid cookie JSON, use fallback
    }
  }

  return {
    swipes: { ...getFallbackSession().swipes },
    matches: [...getFallbackSession().matches],
  };
}

/**
 * Saves session state into response cookies (7-day persistence) and updates the in-memory fallback.
 */
export function saveSession(res: NextResponse, session: SessionData): void {
  // Update in-memory fallback
  globalState.__coy_fallback_session = {
    swipes: { ...session.swipes },
    matches: [...session.matches],
  };

  // Set cookie for browser
  res.cookies.set(COOKIE_NAME, JSON.stringify(session), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears session cookie and resets in-memory fallback.
 */
export function clearSession(res: NextResponse): void {
  resetFallbackSession();
  res.cookies.set(COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });
}

/**
 * Returns public profiles that have not yet been swiped.
 * Server-side projection strictly strips `hasLikedCurrentUser`.
 */
export function getStaticFeed(req?: NextRequest): PublicProfile[] {
  const session = getSession(req);
  const unswiped = STATIC_PROFILES.filter((p) => !session.swipes[p.id]);
  return unswiped.map(toPublicProfile);
}

/**
 * Returns list of mutual matches ordered by matchedAt descending.
 * Strict public projection (no private fields).
 */
export function getStaticMatches(req?: NextRequest): PublicMatch[] {
  const session = getSession(req);
  const sortedMatches = [...session.matches].sort(
    (a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
  );

  const results: PublicMatch[] = [];
  for (const m of sortedMatches) {
    const profile = getStaticProfileById(m.profileId);
    if (profile) {
      results.push({
        ...toPublicProfile(profile),
        matchedAt: m.matchedAt,
      });
    }
  }

  return results;
}

/**
 * Evaluates whether the application should run with static data:
 * - Always false in test mode (vitest integration tests test Prisma directly)
 * - True on Vercel deployment (VERCEL env var is automatically set)
 * - True when USE_STATIC_DATA=true is explicitly set
 * - True in production if no valid external database URL is configured
 */
export function isStaticMode(): boolean {
  if (process.env.USE_STATIC_DATA === "true") {
    return true;
  }
  if (process.env.VERCEL) {
    return true;
  }
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:"))
  ) {
    return true;
  }
  return false;
}
