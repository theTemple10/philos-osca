import { createGitHubClient } from "./client";

export interface FileChange {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface CreatePRParams {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
  files: FileChange[];
}

/**
 * Create a fork of a repository
 */
export async function forkRepository(
  accessToken: string,
  owner: string,
  repo: string
) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.repos.createFork({
    owner,
    repo,
  });
  return data;
}

/**
 * Create or update files in a branch using GitHub's tree API
 */
export async function createOrUpdateFiles(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  files: FileChange[]
) {
  const octokit = createGitHubClient(accessToken);

  // Get the latest commit SHA on the branch
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const latestCommitSha = refData.object.sha;

  // Get the commit tree
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });

  // Create blobs for each file
  const treeItems = await Promise.all(
    files.map(async (file) => {
      if (file.action === "delete") {
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: null as unknown as string,
        };
      }

      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString("base64"),
        encoding: "base64",
      });

      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  // Create a new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: commitData.tree.sha,
    tree: treeItems,
  });

  // Create a new commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: `feat: ${files.map((f) => f.path).join(", ")}`,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update the ref
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return newCommit;
}

/**
 * Create a pull request
 */
export async function createPullRequest(accessToken: string, params: CreatePRParams) {
  const octokit = createGitHubClient(accessToken);

  const branchName = params.head.includes(":")
    ? params.head.split(":")[1]
    : params.head;

  await createOrUpdateFiles(
    accessToken,
    params.owner,
    params.repo,
    branchName,
    params.files
  );

  const { data: pr } = await octokit.rest.pulls.create({
    owner: params.owner,
    repo: params.repo,
    title: params.title,
    body: params.body,
    head: params.head,
    base: params.base,
  });

  return pr;
}

/**
 * Get the current user's GitHub profile
 */
export async function getCurrentUser(accessToken: string) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.users.getAuthenticated();
  return data;
}
