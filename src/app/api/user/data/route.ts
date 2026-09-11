import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
        name: true,
        email: true,
        githubLogin: true,
        skillProfile: true,
        preferredAiProvider: true,
        preferredAiModel: true,
        difficultyLevel: true,
        aiProvider: true,
        aiModel: true,
        createdAt: true,
        repositories: {
          select: { name: true, fullName: true, language: true, starsCount: true },
        },
        contributions: {
          select: {
            targetRepoName: true,
            issueTitle: true,
            status: true,
            createdAt: true,
          },
        },
        pullRequests: {
          select: {
            title: true,
            githubPrNumber: true,
            githubPrUrl: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        name: user.name,
        email: user.email,
        githubLogin: user.githubLogin,
        joinedAt: user.createdAt,
      },
      settings: {
        aiProvider: user.aiProvider || user.preferredAiProvider,
        aiModel: user.aiModel || user.preferredAiModel,
        difficulty: user.difficultyLevel,
      },
      skillProfile: user.skillProfile,
      repositories: user.repositories,
      contributions: user.contributions,
      pullRequests: user.pullRequests,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="oss-contributor-data-${userId.slice(0, 8)}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  confirm: z.literal("DELETE_MY_DATA"),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    deleteSchema.parse(body); // Validate input

    const userId = (session.user as { id: string }).id;

    // Delete all user data in order (cascade handles most, but be explicit)
    await prisma.pullRequest.deleteMany({ where: { userId } });
    await prisma.contribution.deleteMany({ where: { userId } });
    await prisma.userRepo.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please type DELETE_MY_DATA to confirm" },
        { status: 400 }
      );
    }
    console.error("Error deleting user data:", error);
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
