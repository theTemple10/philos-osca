import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/repos — Returns repos from the database (fast).
 * Use POST /api/repos/sync to trigger a GitHub re-sync.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const repos = await prisma.userRepo.findMany({
      where: { userId },
      orderBy: { lastPushedAt: "desc" },
    });

    return NextResponse.json({
      repos,
      total: repos.length,
    });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}
