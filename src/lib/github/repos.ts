import { createGitHubClient } from "./client";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
}

export interface RepoLanguages {
  [language: string]: number; // percentage
}

/**
 * Fetch all repositories for the authenticated user
 */
export async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const octokit = createGitHubClient(accessToken);
  const repos: GitHubRepo[] = [];

  // Fetch paginated repos (up to 100 repos for analysis)
  let page = 1;
  while (page <= 5) {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "pushed",
      direction: "desc",
      per_page: 100,
      page,
    });

    repos.push(...data as GitHubRepo[]);

    if (data.length < 100) break;
    page++;
  }

  return repos;
}

/**
 * Fetch language breakdown for a repository
 */
export async function fetchRepoLanguages(
  accessToken: string,
  owner: string,
  repo: string
): Promise<RepoLanguages> {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.repos.listLanguages({ owner, repo });
  return data as RepoLanguages;
}

/**
 * Fetch repository details including topics
 */
export async function fetchRepoDetails(
  accessToken: string,
  owner: string,
  repo: string
) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

/**
 * Fetch issues from a repository
 */
export async function fetchRepoIssues(
  accessToken: string,
  owner: string,
  repo: string,
  labels?: string[]
) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    labels: labels?.join(","),
    per_page: 50,
  });

  // Filter out pull requests (they also appear in issues endpoint)
  return data.filter((issue) => !issue.pull_request);
}

/**
 * Search for repositories matching a query
 */
export async function searchRepositories(
  query: string,
  options?: {
    language?: string;
    sort?: "stars" | "forks" | "updated";
    per_page?: number;
  }
) {
  // Use unauthenticated Octokit for public search
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit();

  const searchQuery = [
    query,
    options?.language ? `language:${options.language}` : "",
    "good-first-issues:>0", // Prefer repos with beginner-friendly issues
  ]
    .filter(Boolean)
    .join(" ");

  const { data } = await octokit.rest.search.repos({
    q: searchQuery,
    sort: options?.sort || "stars",
    per_page: options?.per_page || 30,
  });

  return data.items;
}
