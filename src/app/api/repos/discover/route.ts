import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchRepositories } from "@/lib/github/repos";
import { findMatchingRepositories } from "@/lib/ai/analyze";

function dedupeByFullName<T extends { full_name: string }>(repos: T[]): T[] {
  const seen = new Set<string>();
  return repos.filter((r) => {
    if (seen.has(r.full_name)) return false;
    seen.add(r.full_name);
    return true;
  });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const user = await import("@/lib/db").then((m) =>
      m.prisma.user.findUnique({
        where: { id: userId },
        select: { skillProfile: true, aiApiKey: true },
      })
    );

    // If user has no skill profile or no API key, fall back to generic query
    if (!user?.skillProfile || !user?.aiApiKey) {
      const repos = await searchRepositories("good-first-issues:>0", {
        sort: "stars",
        per_page: 30,
      });

      return NextResponse.json({
        repos: repos.map((r) => ({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          description: r.description,
          html_url: r.html_url,
          language: r.language,
          stargazers_count: r.stargazers_count,
          forks_count: r.forks_count,
          topics: r.topics,
        })),
        message: !user?.skillProfile
          ? "Sync your repos and run analysis to get personalized matches"
          : "Set your API key in Settings for personalized matches",
      });
    }

    // Use AI-driven matching
    let match;
    try {
      match = (await findMatchingRepositories(userId)) as {
        searchQueries?: Array<{ query: string; language?: string }>;
      };
    } catch {
      // If AI call fails, fall back to skill-profile-based search
      const skillProfile = user.skillProfile as {
        languages?: { name: string }[];
        frameworks?: string[];
      } | null;
      const languages = skillProfile?.languages?.map((l) => l.name) || [];
      const topics = skillProfile?.frameworks || [];

      const searchTerms: string[] = [];
      if (languages.length > 0) {
        searchTerms.push(
          ...languages.slice(0, 3).map((lang) => `language:${lang.toLowerCase()}`)
        );
      }
      if (topics.length > 0) {
        searchTerms.push(...topics.slice(0, 3).map((t) => t.toLowerCase()));
      }
      if (searchTerms.length === 0) {
        searchTerms.push("good-first-issues:>0");
      }

      match = {
        searchQueries: [{ query: searchTerms.slice(0, 5).join(" ") }],
      };
    }

    const queries = (match.searchQueries?.length
      ? match.searchQueries
      : [{ query: "good-first-issues:>0" }]
    ).slice(0, 3);

    const results = await Promise.all(
      queries.map((q) =>
        searchRepositories(q.query, {
          language: q.language,
          sort: "stars",
          per_page: 15,
        })
      )
    );

    const repos = dedupeByFullName(results.flat());

    return NextResponse.json({
      repos: repos.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        topics: r.topics,
      })),
    });
  } catch (error) {
    console.error("Error discovering repos:", error);
    return NextResponse.json(
      { error: "Failed to discover repositories" },
      { status: 500 }
    );
  }
}
