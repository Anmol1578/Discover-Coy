import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProfile } from "@/lib/profiles";

export const dynamic = "force-dynamic";

/**
 * GET /api/matches
 * Returns all matches ordered by matchedAt descending, joined with public profile fields.
 * Public fields only: `hasLikedCurrentUser` is strictly stripped.
 */
export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: {
        matchedAt: "desc",
      },
      include: {
        profile: true,
      },
    });

    const publicMatches = matches.map((m) => ({
      ...toPublicProfile(m.profile),
      matchedAt: m.matchedAt,
    }));

    return NextResponse.json(publicMatches);
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json(
      { error: "Failed to load matches" },
      { status: 500 }
    );
  }
}
