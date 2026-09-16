import { createGitHubClient } from "./client";

export interface RepoFile {
  path: string;
  content: string;
  sha: string;
}

/** Get the full recursive file tree (paths + types only, no content) */
export async function getRepoTree(
  accessToken: string,
  owner: string,
  repo: string,
  ref: string = "HEAD"
): Promise<{ path: string; type: "blob" | "tree"; sha: string }[]> {
  const octokit = createGitHubClient(accessToken);

  // Get the default branch name if ref is HEAD
  let branchName = ref;
  if (ref === "HEAD") {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    branchName = repoData.default_branch;
  }

  const { data: refData } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: branchName,
  });
  const treeSha = refData.commit.commit.tree.sha;
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });
  return data.tree
    .filter((item) => item.path && item.type)
    .map((item) => ({
      path: item.path!,
      type: item.type as "blob" | "tree",
      sha: item.sha!,
    }));
}

/** Fetch the raw content + sha of a single file */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<RepoFile | null> {
  const octokit = createGitHubClient(accessToken);
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    if (Array.isArray(data) || data.type !== "file" || !("content" in data))
      return null;
    return {
      path,
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

/** Fetch several files in parallel */
export async function getFileContents(
  accessToken: string,
  owner: string,
  repo: string,
  paths: string[],
  ref?: string
): Promise<RepoFile[]> {
  const results = await Promise.all(
    paths.map((p) => getFileContent(accessToken, owner, repo, p, ref))
  );
  return results.filter((f): f is RepoFile => f !== null);
}
