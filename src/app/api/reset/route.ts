import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/reset
 * DEMO-ONLY HELPER:
 * Clears all Swipe and Match records so that testers and reviewers can reset the demo state.
 * Enabled only when NODE_ENV !== "production" or ENABLE_DEMO_RESET=true.
 * Returns 404 in production to ensure safety.
 */
export async function POST() {
  const isEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_RESET === "true";

  if (!isEnabled) {
    return NextResponse.json(
      { error: "Endpoint not found" },
      { status: 404 }
    );
  }

  try {
    await prisma.$transaction([
      prisma.match.deleteMany(),
      prisma.swipe.deleteMany(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Swipes and matches have been reset",
    });
  } catch (error) {
    console.error("POST /api/reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset demo data" },
      { status: 500 }
    );
  }
}
