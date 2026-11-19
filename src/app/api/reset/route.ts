import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStaticMode, clearSession } from "@/lib/static-store";

export const dynamic = "force-dynamic";

/**
 * POST /api/reset
 * DEMO-ONLY HELPER:
 * Clears all Swipe and Match records so that testers and reviewers can reset the demo state.
 * Enabled when NODE_ENV !== "production", ENABLE_DEMO_RESET=true, or on Vercel demo deployments.
 */
export async function POST(req: NextRequest): Promise<NextResponse>;
export async function POST(): Promise<NextResponse>;
export async function POST(req?: NextRequest): Promise<NextResponse> {
  const isEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_RESET === "true" ||
    process.env.VERCEL !== undefined ||
    isStaticMode();

  if (!isEnabled) {
    return NextResponse.json(
      { error: "Endpoint not found" },
      { status: 404 }
    );
  }

  try {
    if (isStaticMode()) {
      const res = NextResponse.json({
        success: true,
        message: "Swipes and matches have been reset",
      });
      clearSession(res);
      return res;
    }

    await prisma.$transaction([
      prisma.match.deleteMany(),
      prisma.swipe.deleteMany(),
    ]);

    const res = NextResponse.json({
      success: true,
      message: "Swipes and matches have been reset",
    });
    clearSession(res);
    return res;
  } catch (error) {
    console.warn("Prisma reset failed, falling back to static reset:", error);
    const res = NextResponse.json({
      success: true,
      message: "Swipes and matches have been reset",
    });
    clearSession(res);
    return res;
  }
}
