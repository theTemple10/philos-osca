import { NextRequest, NextResponse } from "next/server";
import { getSession, getGithubToken } from "@/lib/auth/session";
import { generateContributionCode } from "@/lib/ai/analyze";
import { createPullRequest, forkRepository } from "@/lib/github/pr";
import { prisma } from "@/lib/db";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { z } from "zod";

const generateSchema = z.object({
  contributionId: z.string().min(1),
  action: z.literal("generate"),
});

const submitSchema = z.object({
  contributionId: z.string().min(1),
  action: z.literal("submit"),
  branchName: z.string().min(1),
});

const createContributionSchema = z.object({
  action: z.literal("create"),
  targetRepoOwner: z.string().min(1),
  targetRepoName: z.string().min(1),
  targetRepoUrl: z.string().url(),
  issueNumber: z.number().int().positive().optional(),
  issueTitle: z.string().optional(),
  issueBody: z.string().optional(),
  issueLabels: z.array(z.string()).optional(),
  issueUrl: z.string().url().optional(),
  difficulty: z.string().optional(),
  skillMatch: z.number().min(0).max(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const token = await getGithubToken();

    if (!token) {
      return NextResponse.json({ error: "No GitHub token" }, { status: 401 });
    }

    const rl = rateLimit(`contribute:${userId}`, { windowMs: 60000, maxRequests: 10 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const body = await request.json();

    if (body.action === "create") {
      const parsed = createContributionSchema.parse(body);

      const contribution = await prisma.contribution.create({
        data: {
          userId,
          targetRepoOwner: parsed.targetRepoOwner,
          targetRepoName: parsed.targetRepoName,
          targetRepoUrl: parsed.targetRepoUrl,
          issueNumber: parsed.issueNumber ?? undefined,
          issueTitle: parsed.issueTitle ?? undefined,
          issueBody: parsed.issueBody ?? undefined,
          issueLabels: parsed.issueLabels ?? undefined,
          issueUrl: parsed.issueUrl ?? undefined,
          difficulty: parsed.difficulty ?? undefined,
          skillMatch: parsed.skillMatch ?? undefined,
          status: "discovered",
        },
      });

      return NextResponse.json({ contribution });
    }

    if (body.action === "generate") {
      const parsed = generateSchema.parse(body);

      const contribution = await prisma.contribution.findUnique({
        where: { id: parsed.contributionId },
      });

      if (!contribution) {
        return NextResponse.json(
          { error: "Contribution not found" },
          { status: 404 }
        );
      }

      if (contribution.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const codeResult = (await generateContributionCode(
        userId,
        {
          title: contribution.issueTitle || "",
          body: contribution.issueBody || "",
        },
        [],
        {
          languages: {},
          topics: [],
        }
      )) as {
        suggested_approach?: string;
        files?: Array<{ path: string; content: string; action: string; explanation: string }>;
        commitMessage?: string;
        prTitle?: string;
        prBody?: string;
      };

      await prisma.contribution.update({
        where: { id: parsed.contributionId },
        data: {
          status: "coding",
          suggestedApproach: codeResult.suggested_approach || null,
        },
      });

      return NextResponse.json({ codeResult });
    }

    if (body.action === "submit") {
      const parsed = submitSchema.parse(body);

      const contribution = await prisma.contribution.findUnique({
        where: { id: parsed.contributionId },
      });

      if (!contribution) {
        return NextResponse.json(
          { error: "Contribution not found" },
          { status: 404 }
        );
      }

      if (contribution.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const existingPr = await prisma.pullRequest.findFirst({
        where: {
          contributionId: parsed.contributionId,
          status: { in: ["submitted", "approved"] },
        },
      });

      if (existingPr) {
        return NextResponse.json(
          { error: "Pull request already submitted for this contribution" },
          { status: 409 }
        );
      }

      const fork = await forkRepository(
        token,
        contribution.targetRepoOwner,
        contribution.targetRepoName
      );

      const pr = await createPullRequest(token, {
        owner: contribution.targetRepoOwner,
        repo: contribution.targetRepoName,
        title: `feat: ${contribution.issueTitle || "contribution"}`,
        body: [
          `## Changes`,
          contribution.issueNumber ? `Closes #${contribution.issueNumber}` : "",
          "",
          `## Description`,
          `Automated contribution generated by OSS Contributor.`,
          contribution.suggestedApproach ? `\n### Approach\n${contribution.suggestedApproach}` : "",
        ].filter(Boolean).join("\n"),
        head: `${fork.owner.login}:${parsed.branchName}`,
        base: "main",
        files: [],
      });

      const pullRequest = await prisma.pullRequest.create({
        data: {
          userId,
          contributionId: parsed.contributionId,
          githubPrNumber: pr.number,
          githubPrUrl: pr.html_url,
          githubPrId: pr.id,
          title: pr.title,
          body: pr.body || "",
          branchName: parsed.branchName,
          status: "submitted",
        },
      });

      await prisma.contribution.update({
        where: { id: parsed.contributionId },
        data: { status: "pr_created" },
      });

      return NextResponse.json({ pullRequest, prUrl: pr.html_url });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error during contribution:", error);
    return NextResponse.json(
      { error: "Contribution failed" },
      { status: 500 }
    );
  }
}
