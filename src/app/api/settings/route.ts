import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSettingsSchema = z.object({
  aiProvider: z.enum(["openai", "anthropic"]).optional(),
  aiModel: z.string().min(1).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "adaptive"]).optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id },
      select: {
        preferredAiProvider: true,
        preferredAiModel: true,
        difficultyLevel: true,
      },
    });

    return NextResponse.json({
      aiProvider: user?.preferredAiProvider || "openai",
      aiModel: user?.preferredAiModel || "gpt-4o",
      difficulty: user?.difficultyLevel || "adaptive",
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSettingsSchema.parse(body);

    await prisma.user.update({
      where: { id: (session.user as { id: string }).id },
      data: {
        ...(parsed.aiProvider && { preferredAiProvider: parsed.aiProvider }),
        ...(parsed.aiModel && { preferredAiModel: parsed.aiModel }),
        ...(parsed.difficulty && { difficultyLevel: parsed.difficulty }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
