import { NextResponse } from "next/server";
import { getSession, getGithubToken } from "@/lib/auth/session";
import { fetchUserRepos, fetchRepoLanguages } from "@/lib/github/repos";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getGithubToken();
    if (!token) {
      return NextResponse.json({ error: "No GitHub token" }, { status: 401 });
    }

    const githubRepos = await fetchUserRepos(token);
    const userId = (session.user as { id: string }).id;
    const repoBatch = githubRepos.slice(0, 50);

    const languageResults = await Promise.allSettled(
      repoBatch.map((repo) =>
        fetchRepoLanguages(
          token,
          repo.full_name.split("/")[0],
          repo.name
        ).catch(() => ({}))
      )
    );

    const syncedRepos = await Promise.all(
      repoBatch.map((repo, i) => {
        const languages =
          languageResults[i].status === "fulfilled"
            ? languageResults[i].value
            : {};
        return prisma.userRepo.upsert({
          where: {
            userId_githubRepoId: {
              userId,
              githubRepoId: repo.id,
            },
          },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            language: repo.language,
            languages,
            topics: repo.topics,
            starsCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            lastPushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
          },
          create: {
            userId,
            githubRepoId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            language: repo.language,
            languages,
            topics: repo.topics,
            starsCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            lastPushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
          },
        });
      })
    );

    return NextResponse.json({
      repos: syncedRepos,
      total: syncedRepos.length,
    });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
