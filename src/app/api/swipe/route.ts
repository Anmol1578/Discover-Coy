import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMutualMatch, toPublicProfile } from "@/lib/profiles";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/swipe
 * Body: { profileId: string, direction: "LIKE" | "PASS" }
 *
 * Privacy Promise:
 * Response is strictly `{ matched: true, match: { ...publicFields, matchedAt } }`
 * or `{ matched: false }`. No hint is ever given regarding whether an un-matched
 * profile had liked the user.
 */
export async function POST(req: NextRequest) {
  let body: { profileId?: unknown; direction?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { profileId, direction } = body;

  if (
    typeof profileId !== "string" ||
    !profileId.trim() ||
    (direction !== "LIKE" && direction !== "PASS")
  ) {
    return NextResponse.json(
      { error: "Invalid body: profileId (string) and direction ('LIKE' | 'PASS') are required" },
      { status: 400 }
    );
  }

  // Verify profile exists
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  // Pre-check for existing swipe
  const existingSwipe = await prisma.swipe.findUnique({
    where: { profileId },
  });

  if (existingSwipe) {
    return NextResponse.json(
      { error: "Profile already swiped" },
      { status: 409 }
    );
  }

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Record the swipe (unique constraint on profileId protects against race conditions)
      await tx.swipe.create({
        data: {
          profileId,
          direction,
        },
      });

      // Check mutual match condition
      const matched = isMutualMatch(direction, profile.hasLikedCurrentUser);

      if (matched) {
        const matchRecord = await tx.match.create({
          data: {
            profileId,
          },
        });
        return { matched: true as const, matchedAt: matchRecord.matchedAt };
      }

      return { matched: false as const };
    });

    if (transactionResult.matched) {
      return NextResponse.json({
        matched: true,
        match: {
          ...toPublicProfile(profile),
          matchedAt: transactionResult.matchedAt,
        },
      });
    }

    return NextResponse.json({ matched: false });
  } catch (error) {
    // Treat Prisma unique constraint violation (P2002) as 409 Conflict
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Profile already swiped" },
        { status: 409 }
      );
    }

    console.error("POST /api/swipe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
