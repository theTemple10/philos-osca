import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { analyzeUserSkills, analyzeContribution } from "@/lib/ai/analyze";
import { prisma } from "@/lib/db";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { z } from "zod";

const analyzeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("skills") }),
  z.object({
    type: z.literal("contribution"),
    issue: z.object({
      title: z.string(),
      body: z.string(),
      labels: z.array(z.string()),
    }),
    repoContext: z.object({
      languages: z.record(z.string(), z.number()),
      topics: z.array(z.string()),
      description: z.string(),
    }),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const rl = rateLimit(`analyze:${userId}`, { windowMs: 60000, maxRequests: 5 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const parsed = analyzeSchema.parse(body);

    if (parsed.type === "skills") {
      const skillProfile = await analyzeUserSkills(userId);
      return NextResponse.json({ skillProfile });
    }

    if (parsed.type === "contribution") {
      const analysis = await analyzeContribution(
        userId,
        parsed.issue,
        parsed.repoContext
      );
      return NextResponse.json({ analysis });
    }

    return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error during analysis:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id },
      select: { skillProfile: true },
    });

    return NextResponse.json({ skillProfile: user?.skillProfile });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch skill profile" },
      { status: 500 }
    );
  }
}
