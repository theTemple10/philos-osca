import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        skillProfile: true,
        hasApiKey: true,
        aiApiKey: true,
        _count: {
          select: {
            repositories: true,
            contributions: true,
            pullRequests: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalRepos: user?._count.repositories ?? 0,
      totalContributions: user?._count.contributions ?? 0,
      totalPRs: user?._count.pullRequests ?? 0,
      skillProfile: user?.skillProfile ?? null,
      hasApiKey: !!(user?.aiApiKey),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
