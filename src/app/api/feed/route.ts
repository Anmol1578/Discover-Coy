import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProfile } from "@/lib/profiles";
import { isStaticMode, getStaticFeed } from "@/lib/static-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/feed
 * Returns all profiles that have not been swiped yet, ordered by id ascending.
 * Strictly projects all results through `toPublicProfile` so `hasLikedCurrentUser`
 * is never sent to the client.
 */
export async function GET(req: NextRequest): Promise<NextResponse>;
export async function GET(): Promise<NextResponse>;
export async function GET(req?: NextRequest): Promise<NextResponse> {
  try {
    if (isStaticMode()) {
      const publicProfiles = getStaticFeed(req);
      return NextResponse.json(publicProfiles);
    }

    const unswipedProfiles = await prisma.profile.findMany({
      where: {
        swipe: null,
      },
      orderBy: {
        id: "asc",
      },
    });

    const publicProfiles = unswipedProfiles.map(toPublicProfile);
    return NextResponse.json(publicProfiles);
  } catch (error) {
    console.warn("Prisma GET /api/feed failed, falling back to static data:", error);
    try {
      const publicProfiles = getStaticFeed(req);
      return NextResponse.json(publicProfiles);
    } catch (staticErr) {
      console.error("GET /api/feed error:", staticErr);
      return NextResponse.json(
        { error: "Failed to load feed" },
        { status: 500 }
      );
    }
  }
}
