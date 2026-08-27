import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchRepositories } from "@/lib/github/repos";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await import("@/lib/db").then((m) =>
      m.prisma.user.findUnique({
        where: { id: (session.user as { id: string }).id },
        select: { skillProfile: true, difficultyLevel: true },
      })
    );

    const skillProfile = user?.skillProfile as {
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

    const query = searchTerms.slice(0, 5).join(" ") + " good-first-issues:>0";

    const repos = await searchRepositories(query, {
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
    });
  } catch (error) {
    console.error("Error discovering repos:", error);
    return NextResponse.json(
      { error: "Failed to discover repositories" },
      { status: 500 }
    );
  }
}
