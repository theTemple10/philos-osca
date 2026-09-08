import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchRepoIssues } from "@/lib/github/repos";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = (session as { accessToken?: string }).accessToken;
    if (!token) {
      return NextResponse.json({ error: "No GitHub token" }, { status: 401 });
    }

    const { owner, repo } = await params;
    const issues = await fetchRepoIssues(token, owner, repo);

    return NextResponse.json({
      issues: issues.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body,
        labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name || "")),
        html_url: issue.html_url,
        created_at: issue.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}