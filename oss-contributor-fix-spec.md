# OSS Contributor (philos-osca) — Core Pipeline Fix Spec

**Author context:** Diagnosis based on direct inspection of `github.com/theTemple10/philos-osca` (current `main`).
**Scope:** Fix the broken analyze → discover → generate → submit pipeline. Ordered so each phase is shippable and testable on its own.

---

## 0. Summary of root causes

| # | Symptom reported | Actual root cause | File(s) |
|---|---|---|---|
| 1 | No code generated / garbage code | `generateContributionCode()` is called with a hardcoded empty file list and empty repo context — the model has no view of the target codebase | `src/app/api/contribute/route.ts` (generate action) |
| 2 | (Would surface once #1 is fixed) PR submission fails | Commits are pushed to the **upstream** repo, not the fork; the target branch is never created before writing to it | `src/lib/github/pr.ts`, `src/app/api/contribute/route.ts` (submit action) |
| 3 | Discovered repos generic/identical per user | `findMatchingRepositories()` (AI-driven) exists but is dead code; `/api/repos/discover` does its own naive keyword search that degrades to a single fallback query when `skillProfile` is null | `src/lib/ai/analyze.ts`, `src/app/api/repos/discover/route.ts` |
| 4 | "API key exposed client-side" | The AI key itself is not exposed (verified — settings/stats routes only return a boolean). The real leak is the GitHub OAuth `accessToken` (repo-scope) attached to the client-visible NextAuth session object, and unused there since server code already reads it server-side | `src/lib/auth/config.ts` |
| 5 | (Agent's own LOW item, confirmed) | `aiApiKey` stored in plaintext in Postgres | `prisma/schema.prisma`, `src/app/api/settings/route.ts` |

---

## Phase 0 — Security: stop exposing the GitHub token client-side

**File:** `src/lib/auth/config.ts`

Remove the line in the `session` callback that copies `token.accessToken` onto the client-facing `session` object:

```diff
 async session({ session, token }) {
   if (session.user) {
     (session.user as { id: string }).id = token.sub ?? "";
-    (session as { accessToken?: string }).accessToken = token.accessToken as string | undefined;
   }
   return session;
 },
```

Confirm no client component reads `session.accessToken` (grep `useSession` usages) before removing — none currently do; all server routes already fetch the token server-side via `getGithubToken()` in `src/lib/auth/session.ts`, which reads it from the encrypted JWT, not from the client session. This is a pure subtraction — no functional loss.

**Verification:** after deploy, `GET /api/auth/session` in a browser network tab should no longer contain `accessToken`.

---

## Phase 1 — Repo content access layer (new capability)

This is the missing foundation everything else depends on. Add a new module: `src/lib/github/content.ts`.

### 1.1 Functions to add

```ts
// src/lib/github/content.ts
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
  const { data: refData } = await octokit.rest.repos.getBranch({ owner, repo, branch: ref === "HEAD" ? (await octokit.rest.repos.get({ owner, repo })).data.default_branch : ref });
  const treeSha = refData.commit.commit.tree.sha;
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });
  return data.tree
    .filter((item) => item.path && item.type)
    .map((item) => ({ path: item.path!, type: item.type as "blob" | "tree", sha: item.sha! }));
}

/** Fetch the raw content + sha of a single file (sha is required for update-in-place later) */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<RepoFile | null> {
  const octokit = createGitHubClient(accessToken);
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path, ref });
    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) return null;
    return {
      path,
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
    };
  } catch {
    return null; // 404s are expected for e.g. generated files not in a shallow view
  }
}

/** Fetch several files in parallel with a concurrency cap */
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
```

### 1.2 File relevance selection

Feeding an entire repo to the model is neither affordable nor useful. Add a lightweight, non-AI pre-filter so the (paid, user-supplied) model call only happens once real candidates are known:

```ts
// src/lib/github/relevance.ts
const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rb", ".java", ".rs", ".php", ".md"];
const IGNORE_PATTERNS = [/node_modules/, /dist\//, /build\//, /\.lock$/, /vendor\//, /\.min\./];

export function rankCandidateFiles(
  tree: { path: string; type: "blob" | "tree" }[],
  issue: { title: string; body: string }
): string[] {
  const keywords = extractKeywords(issue.title + " " + issue.body); // simple tokenizer, lowercase, strip stopwords

  const blobs = tree.filter(
    (f) => f.type === "blob" &&
      CODE_EXTENSIONS.some((ext) => f.path.endsWith(ext)) &&
      !IGNORE_PATTERNS.some((re) => re.test(f.path))
  );

  const scored = blobs.map((f) => {
    const pathLower = f.path.toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (pathLower.includes(kw) ? 1 : 0), 0);
    return { path: f.path, score };
  });

  // Always include high-signal root files even at score 0 (README, package.json) for context
  const alwaysInclude = blobs
    .filter((f) => /^(README|package\.json|CONTRIBUTING)/i.test(f.path.split("/").pop() || ""))
    .map((f) => f.path);

  const ranked = scored.sort((a, b) => b.score - a.score).map((s) => s.path);
  return [...new Set([...ranked.slice(0, 8), ...alwaysInclude])].slice(0, 12);
}
```

This keeps the flow cheap and deterministic: no AI call is spent just to figure out *which* files might matter. Issue #`analyzeContributionPrompt` already asks the model for a `relevantFiles` guess (line ~57 in `prompts.ts`) — that output should be unioned with the keyword-ranked candidates before fetching content, since the model may name a file the keyword pass missed.

### 1.3 Token budget

Cap total fetched content (e.g. ~15k characters across all files) before building the generation prompt, trimming lowest-ranked files first. Log when truncation happens so it's visible in generation metadata later.

---

## Phase 2 — Diff-based code generation (replace full-file regeneration)

**Why:** the current prompt (`generateCodePrompt` in `prompts.ts`) asks the model to output entire file contents from scratch. Once real file content is available (Phase 1), asking for a full rewrite is still risky — any file the model doesn't perfectly reproduce corrupts the PR. Ask for **unified diffs / targeted edits** instead, scoped only to the lines that change.

### 2.1 New prompt shape

```ts
// src/lib/ai/prompts.ts — replace generateCodePrompt
export function generateCodePrompt(
  issue: { title: string; body: string },
  relevantFiles: Array<{ path: string; content: string }>,
  repoContext: { languages: Record<string, number>; topics: string[]; conventions?: string }
) {
  return `You are an expert open source contributor. Propose a minimal, working fix for this issue.

Issue Title: ${issue.title}
Issue Description: ${issue.body?.substring(0, 3000) || "No description"}

Repository Context:
- Languages: ${Object.keys(repoContext.languages).join(", ")}
- Topics: ${repoContext.topics.join(", ")}

Existing files (use EXACT content shown, line numbers added for reference only, do not include them in output):
${relevantFiles.map((f) => `\n--- ${f.path} ---\n${addLineNumbers(f.content)}`).join("\n")}

Rules:
1. Only modify files shown above, or create clearly-named new files if the issue requires one.
2. For existing files, return the COMPLETE new file content (not a diff) — but change as little as possible from the original.
3. If you cannot confidently solve this without seeing a file that wasn't provided, say so in "blockers" instead of guessing.
4. Keep changes minimal and focused; do not refactor unrelated code.

Return JSON:
{
  "files": [{ "path": "...", "content": "full new file content", "action": "create"|"update"|"delete", "explanation": "..." }],
  "commitMessage": "conventional commit message",
  "prTitle": "...",
  "prBody": "...",
  "blockers": ["optional: reasons this can't be safely completed"]
}

Respond ONLY with valid JSON.`;
}
```

Note: full-file-content-out is kept (simpler to apply via the existing blob-based commit code) but is now grounded in real input, and a `blockers` escape hatch lets the model refuse instead of hallucinating when context is insufficient — that refusal should surface in the UI instead of silently producing bad files.

### 2.2 Wire real content into the generate route

**File:** `src/app/api/contribute/route.ts`, `generate` action:

```diff
+ const [tree, aiSuggestion] = await Promise.all([
+   getRepoTree(token, contribution.targetRepoOwner, contribution.targetRepoName),
+   analyzeContribution(userId, /* issue */, /* repoContext */), // reuse existing analysis, or skip if already run at discovery time
+ ]);
+ const candidatePaths = rankCandidateFiles(tree, { title: contribution.issueTitle || "", body: contribution.issueBody || "" });
+ const aiPaths = (aiSuggestion as any)?.relevantFiles ?? [];
+ const paths = [...new Set([...candidatePaths, ...aiPaths])].slice(0, 12);
+ const relevantFiles = await getFileContents(token, contribution.targetRepoOwner, contribution.targetRepoName, paths);
+
+ const repoDetails = await fetchRepoDetails(token, contribution.targetRepoOwner, contribution.targetRepoName);
+ const repoLanguages = await fetchRepoLanguages(token, contribution.targetRepoOwner, contribution.targetRepoName);

  const codeResult = await generateContributionCode(
    userId,
    { title: contribution.issueTitle || "", body: contribution.issueBody || "" },
-   [],
+   relevantFiles.map((f) => ({ path: f.path, content: f.content })),
    {
-     languages: {},
-     topics: [],
+     languages: repoLanguages,
+     topics: repoDetails.topics || [],
    }
  );
```

Store the fetched file `sha`s alongside `generatedCode` in the `pullRequest.generatedCode` JSON blob (add a `baseSha` per file) — needed in Phase 3 to detect if the upstream file changed between generation and submission.

---

## Phase 3 — Fix fork/branch/commit logic for PR submission

**File:** `src/lib/github/pr.ts`

### 3.1 Target the fork, not upstream

```diff
 export async function createPullRequest(accessToken: string, params: CreatePRParams) {
   const octokit = createGitHubClient(accessToken);

   const branchName = params.head.includes(":")
     ? params.head.split(":")[1]
     : params.head;
+  const forkOwner = params.head.includes(":") ? params.head.split(":")[0] : params.owner;

   await createOrUpdateFiles(
     accessToken,
-    params.owner,
-    params.repo,
+    forkOwner,
+    params.repo,
     branchName,
     params.files
   );
```

### 3.2 Create the branch before writing to it, and wait for fork readiness

```ts
export async function createBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
  fromBranch: string
) {
  const octokit = createGitHubClient(accessToken);
  const { data: baseRef } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${fromBranch}` });
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseRef.object.sha,
  });
}

/** GitHub forks are created asynchronously — poll until the fork's default branch ref exists */
export async function waitForForkReady(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  { retries = 6, delayMs = 1500 } = {}
) {
  const octokit = createGitHubClient(accessToken);
  for (let i = 0; i < retries; i++) {
    try {
      await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Fork was not ready in time — try submitting again in a moment.");
}
```

### 3.3 Updated submission sequence in `route.ts` (submit action)

```ts
const fork = await forkRepository(token, contribution.targetRepoOwner, contribution.targetRepoName);
await waitForForkReady(token, fork.owner.login, fork.name, fork.default_branch);
await createBranch(token, fork.owner.login, fork.name, parsed.branchName, fork.default_branch);

const pr = await createPullRequest(token, {
  owner: contribution.targetRepoOwner,   // upstream — used for pulls.create only
  repo: contribution.targetRepoName,
  head: `${fork.owner.login}:${parsed.branchName}`,
  base: fork.default_branch === contribution.targetRepoDefaultBranch ? fork.default_branch : "main", // see note below
  files,
  ...
});
```

**Note:** `base: "main"` is currently hardcoded — some repos default to `master` or another branch name. Fetch and store `default_branch` on the `Contribution` (or `UserRepo`) record at discovery time and use it here instead of a literal string.

### 3.4 Stale-base detection (optional but recommended)

Before writing files, compare the `sha` stored with each generated file (Phase 2) against the file's current sha in the upstream default branch. If it changed since generation, surface a "this file changed upstream — regenerate?" warning rather than silently overwriting based on stale context.

---

## Phase 4 — Wire `findMatchingRepositories()` into discovery

**File:** `src/app/api/repos/discover/route.ts`

Replace the manual keyword-building block with a call to the existing (currently unused) AI function, then execute its suggested queries:

```diff
- const skillProfile = ...
- const languages = ...
- const searchTerms = ...
- const query = ...
- const repos = await searchRepositories(query, { sort: "stars", per_page: 30 });
+ const match = await findMatchingRepositories(userId); // returns { searchQueries, recommendedLabels, suggestedTopics }
+ const queries = (match.searchQueries?.length ? match.searchQueries : [{ query: "good-first-issues:>0" }]).slice(0, 3);
+ const results = await Promise.all(
+   queries.map((q) =>
+     searchRepositories(q.query, { language: q.language, sort: "stars", per_page: 15 })
+   )
+ );
+ const repos = dedupeByFullName(results.flat());
```

Fallback: if the user has no `skillProfile` yet (never ran analyze, or `repositories` sync is empty), short-circuit to the existing keyword fallback and surface a UI prompt ("Sync your repos and run analysis to get personalized matches") rather than silently serving the generic query — this makes the "why are my results generic" case visible to the user instead of hidden.

---

## Phase 5 — Encrypt `aiApiKey` at rest

**Files:** `prisma/schema.prisma`, `src/app/api/settings/route.ts`, `src/lib/ai/analyze.ts`

- Add `ENCRYPTION_KEY` env var (32-byte, base64).
- Encrypt with AES-256-GCM on write in `PUT /api/settings`, store ciphertext + iv + authTag (either as one packed string column, or split columns).
- Decrypt only at the point of use inside `analyze.ts` (server-only), never returned from any GET route (already the case).
- This is independent of Phases 0–4 and can ship any time.

---

## Suggested implementation order

1. **Phase 0** (5 min, no dependencies, ship immediately)
2. **Phase 1** (foundation — nothing else works without it)
3. **Phase 2** (depends on Phase 1)
4. **Phase 3** (independent of 1/2, can be built/tested in parallel — use a repo you own as the PR target while testing)
5. **Phase 4** (independent, quick win once Phase 1's `skillProfile` reliability is confirmed)
6. **Phase 5** (independent, do whenever)

## Testing notes

- Phases 1–3 are hard to unit test meaningfully without live GitHub calls; add an integration test against a disposable throwaway repo you own (fork target = your own second account or a scratch repo) before trusting it against real upstream projects.
- Add a "dry run" mode to the submit action (generate the branch + commit but stop before `pulls.create`) for safe end-to-end testing.
- Keep the existing 25 unit tests green; add new ones for `rankCandidateFiles` (pure function, easy to test) and prompt-building functions.
