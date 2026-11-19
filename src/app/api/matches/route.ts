import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProfile } from "@/lib/profiles";
import { isStaticMode, getStaticMatches } from "@/lib/static-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/matches
 * Returns all matches ordered by matchedAt descending, joined with public profile fields.
 * Public fields only: `hasLikedCurrentUser` is strictly stripped.
 */
export async function GET(req: NextRequest): Promise<NextResponse>;
export async function GET(): Promise<NextResponse>;
export async function GET(req?: NextRequest): Promise<NextResponse> {
  try {
    if (isStaticMode()) {
      const publicMatches = getStaticMatches(req);
      return NextResponse.json(publicMatches);
    }

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
    console.warn("Prisma GET /api/matches failed, falling back to static data:", error);
    try {
      const publicMatches = getStaticMatches(req);
      return NextResponse.json(publicMatches);
    } catch (staticErr) {
      console.error("GET /api/matches error:", staticErr);
      return NextResponse.json(
        { error: "Failed to load matches" },
        { status: 500 }
      );
    }
  }
}
