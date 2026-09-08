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

    const contributions = await prisma.contribution.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        pullRequests: {
          select: {
            id: true,
            githubPrNumber: true,
            githubPrUrl: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ contributions });
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}
