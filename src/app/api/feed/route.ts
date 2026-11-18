import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProfile } from "@/lib/profiles";

export const dynamic = "force-dynamic";

/**
 * GET /api/feed
 * Returns all profiles that have not been swiped yet, ordered by id ascending.
 * Strictly projects all results through `toPublicProfile` so `hasLikedCurrentUser`
 * is never sent to the client.
 */
export async function GET() {
  try {
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
    console.error("GET /api/feed error:", error);
    return NextResponse.json(
      { error: "Failed to load feed" },
      { status: 500 }
    );
  }
}
