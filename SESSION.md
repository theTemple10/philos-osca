# SESSION.md — Persistent Session Memory

> **Created:** 2026-09-07
> **Branch:** main
> **Status:** Active development — core pipeline fixed, remaining polish items pending

---

## 1. Project Overview

**OSS Contributor** — An AI-powered assistant that helps developers contribute to open source. Analyzes GitHub repos, builds skill profiles, discovers matching projects, generates code for issues, and submits PRs.

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 6 (PostgreSQL), NextAuth.js 4 (GitHub OAuth), Vercel AI SDK (OpenAI/Anthropic), Octokit, Zod, Zustand, Vitest.

**Deployed at:** https://philos-osca.vercel.app

---

## 2. What Was Fixed (Session 2026-09-07)

### Auth Bug — `OAuthAccountNotLinked`

- **Root cause:** `PrismaAdapter` in `src/lib/auth/config.ts` conflicted with the manual `signIn` callback that does `prisma.user.upsert`. The adapter created User/Account records with its own IDs, then the signIn callback tried to upsert with different IDs — NextAuth saw duplicate emails under different user IDs and threw `OAuthAccountNotLinked`.
- **Fix:** Removed `PrismaAdapter` entirely from `src/lib/auth/config.ts`. Since the project uses JWT strategy and manually manages users in the `signIn` callback, the adapter was redundant and harmful.
- **File changed:** `src/lib/auth/config.ts` — removed `import { PrismaAdapter }` and `adapter: PrismaAdapter(prisma)` line.

### Prisma DB Push Error — `edgesOut`

- **Root cause:** `node_modules` was missing. Running `npx prisma db push` without local install caused npx to download `prisma@8.0.0-rc.13` (a buggy RC version), which crashed with `Cannot read properties of null (reading 'edgesOut')`.
- **Fix:** Run `npm install` first. The project pins `prisma@^6.19.3` in `package.json`.

### Node.js Version Warning

- **Issue:** Local Node is v18.19.1. Most dependencies require Node >=20. Vercel uses Node 22+ so production works, but local dev has warnings.
- **Recommendation:** Upgrade local Node to v20+ or v22.

---

## 3. Known Issues (Pre-existing, Noted During Code Review)

| Issue | Location | Status |
|-------|----------|--------|
| Generated code not committed on submit | `src/app/api/contribute/route.ts` | **Fixed (Session 5)** — Phase 2/3: real file content fetched, stored in generatedCode, submitted to fork |
| `findMatchingRepositories` not wired | `src/lib/ai/analyze.ts` | **Fixed (Session 5)** — Phase 4: wired into discover endpoint with fallback |
| Rate limiter memory leak | `src/lib/rate-limit.ts` | Acknowledged — ephemeral on Vercel, not a real issue |
| GitHub token exposed client-side | `src/lib/auth/config.ts` | **Fixed (Session 5)** — Phase 0: removed from session callback |
| PR targets upstream instead of fork | `src/lib/github/pr.ts` | **Fixed (Session 5)** — Phase 3: commits go to fork, PR targets upstream |
| Branch not created before commit | `src/lib/github/pr.ts` | **Fixed (Session 5)** — Phase 3: `createBranch` + `waitForForkReady` added |
| `aiApiKey` stored in plaintext | `prisma/schema.prisma` | **Fixed (Session 5)** — Phase 5: AES-256-GCM encryption at rest |

---

## 4. Feature Requirements (Pending Implementation)

### 4.1 Settings Page — AI Provider Integration

**Done (Session 4):** Per-user API keys, provider/model selection, client-side key validation, encrypted at rest (Session 5).

### 4.2 Settings — Additional Items

- **Done:** Theme preference (Session 3), Data export/delete (Session 4), GitHub account connection status (Session 4)
- **Pending:** Notification preferences

### 4.3 Dashboard — Clickable Tiles

**Done (Session 4):** Each tile navigates to relevant page.

### 4.4 Dashboard — Fix Average Proficiency

**Done (Session 4):** Works when skillProfile exists after analysis.

### 4.5 Dashboard — Fix "Analyze My Skills" Button

**Done (Session 4):** Error messages shown for missing repos/API key. Loading states added.

### 4.6 Discover Page — Skill-Based Matching

**Current:** Uses AI-driven `findMatchingRepositories()` with keyword fallback. Shows match-relevant results from parallel queries.

**Done (Session 5):**
- `findMatchingRepositories()` wired into discover endpoint
- Parallel query execution with deduplication
- Fallback to skill-profile-based search if AI fails
- Short-circuit with UI message if no profile/API key

### 4.7 Project Click → Issues → Contribution Workflow

**Done (Session 4):** Inline modal on repos page for issue browsing.

**Remaining:** Dedicated `repos/[owner]/[repo]/page.tsx` (LOW priority).

### 4.8 Contributions Page — History

**Done (Session 4):** Dedicated history page at `/history`.

### 4.9 Mobile Responsiveness + UX

**Done (Session 3/4):** Responsive sidebar, filter stacking, progress steps, error toasts, loading skeletons.

**Remaining:** "Suggest desktop" banner for complex operations (MEDIUM priority).

### 4.10 Dark Mode

**Done (Session 3):** Freecodecamp-inspired token-driven approach with semantic CSS variables. System preference detection, manual toggle, full dark: class coverage.

### 4.11 Extra Features (Nice-to-Have)

**Done:**
- Toast notifications (Session 3/4)
- Loading skeletons (Session 3)
- Profile page — pending (HIGH priority)
- Contribution streak/stats visualization — pending (MEDIUM priority)
- Keyboard shortcuts — pending (LOW priority)

---

## 5. Architecture Notes

### AI Call Flow (After Session 5)

```
User clicks "Analyze Skills"
  → POST /api/analyze { type: "skills" }
    → analyzeUserSkills(userId)
      → prisma.user.findUnique(userId) → get repos + aiApiKey + aiProvider + aiModel
      → if (!user.aiApiKey) → return error "Please set your API key in Settings"
      → decrypt(user.aiApiKey) → plaintext key
      → getAIProvider({ provider, model, apiKey })
      → generateText({ model, prompt })
      → prisma.user.update({ skillProfile: result })
```

### Code Generation Flow (After Session 5)

```
User clicks "Generate Code"
  → POST /api/contribute { action: "generate", contributionId }
    → getRepoTree(token, owner, repo)           — fetch full file tree
    → rankCandidateFiles(tree, issue)            — keyword pre-filter (no AI cost)
    → getFileContents(token, owner, repo, paths) — fetch relevant file content
    → fetchRepoDetails + fetchRepoLanguages      — repo metadata
    → generateContributionCode(userId, issue, relevantFiles, repoContext)
      → decrypt(user.aiApiKey)
      → generateText with grounded prompt (real file content + line numbers)
      → JSON: { files, commitMessage, prTitle, prBody, blockers }
    → store in PullRequest.generatedCode (with base SHAs for staleness detection)
```

### PR Submission Flow (After Session 5)

```
User clicks "Submit PR"
  → POST /api/contribute { action: "submit", contributionId, branchName }
    → forkRepository(token, owner, repo)
    → waitForForkReady(token, forkOwner, forkName, defaultBranch)
    → createBranch(token, forkOwner, forkName, branchName, defaultBranch)
    → createPullRequest(token, { owner: upstream, head: fork:branch, base: defaultBranch, files })
      → createOrUpdateFiles on FORK (not upstream)
      → pulls.create on upstream
```

### Auth Flow (Updated Session 5)

```
User clicks "Sign in with GitHub"
  → redirect to GitHub OAuth
  → GitHub redirects to /api/auth/callback/github
  → NextAuth exchanges code for tokens
  → signIn callback fires:
    → prisma.user.upsert({ id: user.id, ... githubId, accessToken })
  → jwt callback fires:
    → token.accessToken = account.access_token
  → session callback fires:
    → session.user.id = token.sub (NO accessToken on client session)
  → redirect to /dashboard
```

getGithubToken() reads accessToken from DB via prisma.user.findUnique, not from session.

---

## 6. Key File Reference

| File | Purpose |
|------|---------|
| `src/lib/auth/config.ts` | NextAuth config — providers, callbacks, JWT strategy |
| `src/lib/auth/session.ts` | Session helpers — getSession, getGithubToken (reads from DB) |
| `src/lib/ai/providers.ts` | AI provider abstraction — getAIProvider, AVAILABLE_MODELS |
| `src/lib/ai/analyze.ts` | AI analysis functions — analyzeUserSkills, generateContributionCode (decrypts keys) |
| `src/lib/ai/prompts.ts` | Prompt templates — includes line-numbered file content, blockers escape hatch |
| `src/lib/github/repos.ts` | GitHub API — fetchUserRepos, searchRepositories, fetchRepoIssues |
| `src/lib/github/pr.ts` | GitHub PR — forkRepository, createBranch, waitForForkReady, createPullRequest |
| `src/lib/github/content.ts` | **New** — getRepoTree, getFileContent, getFileContents (repo content access layer) |
| `src/lib/github/relevance.ts` | **New** — rankCandidateFiles (keyword pre-filter for file selection) |
| `src/lib/crypto.ts` | **New** — encrypt/decrypt (AES-256-GCM for API key storage) |
| `src/lib/db/index.ts` | Prisma client singleton |
| `src/lib/rate-limit.ts` | In-memory rate limiter |
| `src/middleware.ts` | Auth middleware — protects dashboard + API routes |
| `prisma/schema.prisma` | Database schema — User, UserRepo, Contribution, PullRequest |
| `src/app/api/analyze/route.ts` | POST/GET for skill analysis |
| `src/app/api/repos/route.ts` | GET — sync user repos from GitHub |
| `src/app/api/repos/discover/route.ts` | GET — AI-driven discovery with fallback |
| `src/app/api/contribute/route.ts` | POST — create/generate/submit (wired to real content + fork logic) |
| `src/app/api/contributions/route.ts` | GET — list user contributions |
| `src/app/api/settings/route.ts` | GET/PUT — user settings (encrypts API keys on write) |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout — sidebar navigation |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard — stats, skill map, quick actions |
| `src/app/(dashboard)/repos/page.tsx` | Discover page — repos + discovered projects |
| `src/app/(dashboard)/contribute/page.tsx` | Contribute page — workflow, code gen, PR submit |
| `src/app/(dashboard)/settings/page.tsx` | Settings — AI provider, difficulty, privacy |

---

## 7. Implementation Order (Suggested)

1. ~~**Per-user AI keys** — Foundation for everything else (4.1)~~ ✅ Session 4
2. ~~**Settings page redesign** — API key input, provider selection (4.1, 4.2)~~ ✅ Session 4
3. ~~**Fix Analyze button + proficiency** — Depends on AI keys working (4.4, 4.5)~~ ✅ Session 4
4. ~~**Dashboard tile clicks** — Quick win (4.3)~~ ✅ Session 4
5. ~~**Discover page improvements** — Skill-based matching (4.6)~~ ✅ Session 5
6. ~~**Issue browsing** — New page, integrates with contribute flow (4.7)~~ ✅ Session 4
7. ~~**Contributions history page** — New page (4.8)~~ ✅ Session 4
8. ~~**Dark mode** — Tailwind dark classes + toggle (4.10)~~ ✅ Session 3
9. ~~**Mobile responsiveness** — Responsive sidebar, breakpoints (4.9)~~ ✅ Session 3
10. ~~**UX polish** — Toasts, loading states, error messages (4.9, 4.11)~~ ✅ Session 3/4
11. ~~**Core pipeline fix** — analyze → discover → generate → submit (fix spec)~~ ✅ Session 5
12. **Profile page** — Full skill breakdown (4.11)
13. **Topic filtering** — Filter UI on discover page
14. **Mobile suggest desktop** — Banner for complex operations

---

## 8. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Which free AI providers? Groq is straightforward (OpenAI-compatible). MiMo needs evaluation. | Pending user input |
| 2 | Encrypt API keys in DB or plain storage? | **Resolved** — AES-256-GCM encryption via `ENCRYPTION_KEY` env var |
| 3 | Dashboard tile clicks — navigate to pages or show modals? | **Resolved** — navigate to pages |
| 4 | Issue browsing — new page or modal on discover? | **Resolved** — inline modal on repos page |
| 5 | Mobile "suggest desktop" — dismissable banner or overlay? | Pending user input |

---

## 9. Session Checklist

- [x] Understood codebase structure
- [x] Fixed OAuthAccountNotLinked auth bug
- [x] Fixed prisma db push error
- [x] Documented all requirements
- [x] Analyzed architecture impact
- [x] Implement per-user AI key storage
- [x] Redesign settings page (AI provider, difficulty, privacy)
- [x] Fix analyze button + proficiency display
- [x] Make dashboard tiles clickable
- [x] Improve discover page matching (match score calculation)
- [x] Add issue browsing (inline modal in repos page)
- [x] Add contributions history page
- [x] Implement dark mode (freecodecamp token-driven approach, semantic CSS variables)
- [x] Improve mobile responsive sidebar, filter stacking, progress steps
- [x] UX polish (toasts, loading skeletons, error boundaries per route)
- [x] Fix generated code not being committed on PR submit
- [x] Add ARIA labels and accessibility to all interactive elements
- [x] Add theme preference selector in Settings page
- [x] Remove unused @next-auth/prisma-adapter dependency

### Session 5 Checklist

- [x] Phase 0: Remove GitHub token from client-side session (security fix)
- [x] Phase 1: Create repo content access layer (content.ts, relevance.ts)
- [x] Phase 2: Diff-based code generation with grounded prompt
- [x] Phase 3: Fix fork/branch/commit logic for PR submission
- [x] Phase 4: Wire findMatchingRepositories() into discovery
- [x] Phase 5: Encrypt aiApiKey at rest (AES-256-GCM)
- [x] Verify: 0 TS errors, 25/25 tests passing, 0 lint errors

### Session 3 Work (2026-09-09)

#### Dark Mode Overhaul
- Restructured globals.css with freecodecamp-inspired semantic CSS custom properties
- Dark-first design with full token coverage for backgrounds, foregrounds, borders, accent, semantic colors
- Updated ALL components (Card, Button, Badge, Toast, ThemeToggle) to use var() tokens
- Fixed login page, error page, not-found page dark mode (30+ hardcoded classes replaced)
- Landing page redesigned with animated background (grid, gradient orbs, floating icons)

#### Bug Fixes
- **PR submit files bug**: Generated code now stored in PullRequest.generatedCode during generate step, used during submit step (was sending `files: []`)
- **Middleware gap**: Added `/history/:path*` to middleware matcher (was unprotected)

#### New Features
- Loading skeleton components (Skeleton, CardSkeleton, RepoCardSkeleton, StatCardSkeleton, DashboardSkeleton, ReposSkeleton, HistorySkeleton)
- Per-route loading.tsx files for all dashboard pages (streaming Suspense boundaries)
- Per-route error.tsx files for all dashboard pages (contextual error recovery)
- Theme preference selector in Settings page (light/dark/system with visual radio buttons)

#### UX Improvements
- Toast notifications on repos discover, issue select, code generate, PR submit
- Error toasts replacing silent console.error on repos, contribute pages
- ARIA labels on all interactive elements (provider/model/difficulty radios, checkboxes, search, filter, close buttons)
- Semantic HTML (ol/li for progress steps, aria-current, aria-checked)
- Mobile responsive: filter/search bar stacks on small screens, progress step labels hidden on mobile, PR preview grid stacks on mobile

#### Cleanup
- Removed unused `@next-auth/prisma-adapter` from package.json

### Session 4 Work (2026-09-11) — Recommendations Implementation

Comprehensive fix/optimization/feature pass based on code review recommendations.

#### Bug Fixes
- **Fixed broken `node_modules`**: Ran `npm install`; `tsc` and `vitest` now available
- **Fixed test assertions** (`utils.test.ts`): Tests now match implementation output (CSS variable strings like `text-[var(--color-success)]`)
- **Fixed contribution card status flow**: State machine now transitions `discovered → selected → analyzing → reviewing` properly. Added `updateStatus` action to `/api/contribute`. Cards show correct buttons per status. Previously `selected` status was never set, so "Generate Code" button never appeared.
- **Fixed `window.location.href` lint error** in settings: Now uses `router.push()`

#### API Optimizations
- **Consolidated dashboard API**: New `POST /api/dashboard/stats` endpoint replaces 3 sequential calls (repos, analyze, settings). No more re-syncing repos on every dashboard load.
- **Separated repo sync from fetch**: `GET /api/repos` now reads from DB only (fast). New `POST /api/repos/sync` does GitHub re-sync with rate limiting (5 req/5min per user). Manual "Sync Repos" button added to repos page header.
- **Auth env var validation** (`config.ts`): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_SECRET` now throw clear startup errors if missing instead of cryptic runtime failures.
- **Middleware updated**: Added `/dashboard/stats`, `/repos/sync`, `/user/data` to matcher.

#### Features
- **API key format validation** (client-side settings): Checks provider-specific key prefixes (sk- for OpenAI, sk-ant- for Anthropic, gsk_ for Groq, sk-or- for OpenRouter) before saving.
- **Confirmation dialogs**: PR submit warns before forking/creating PR. AI code generation warns about API credit usage. Uses inline confirmations (lightweight, no dialog library needed).
- **Error toasts everywhere**: Repos sync, issue loading, contribution creation, skill profile fetch, settings save all show user-facing toasts via Sonner.
- **Zustand store** (`src/lib/stores/dashboard-store.ts`): Shared dashboard state (skill profile, user settings, stats) across pages. Dashboard page now reads from store instead of refetching on every render.
- **Data export/delete** (GDPR): New `GET/DELETE /api/user/data` endpoint. Export returns JSON with user info, repos, contributions, pull requests, settings. Delete removes all user data with confirmation.
- **GitHub connection status** in Settings: Shows connected (with username) or not connected state, fetched from `/api/settings`.
- **Watch Demo button fixed**: Now smooth-scrolls to "How It Works" section instead of broken link.

#### Environment / Tooling
- **Vitest downgraded** from 4.x to 3.x: 4.x requires Node 20+, environment has Node 18.19.1. Compatible version installed.

#### Verification
- **TypeScript**: 0 errors (`npx tsc --noEmit`)
- **Tests**: 25/25 passing (`npm test`)
- **Lint**: 0 errors (`npm run lint`) — 6 pre-existing warnings (all useEffect dependency arrays, unchanged)

#### Files Changed
- `src/lib/utils.test.ts` — test assertions fixed
- `src/app/api/contribute/route.ts` — added `updateStatus` action
- `src/components/contribution/contribution-card.tsx` — status flow buttons fixed
- `src/app/(dashboard)/contribute/page.tsx` — flow fix, confirmation dialogs, error toasts
- `src/app/api/dashboard/stats/route.ts` — **new** consolidated stats endpoint
- `src/app/api/repos/sync/route.ts` — **new** dedicated sync endpoint with rate limiting
- `src/app/api/repos/route.ts` — GET now reads DB only (no re-sync)
- `src/app/api/user/data/route.ts` — **new** export/delete endpoint
- `src/app/api/settings/route.ts` — now returns GitHub connection status
- `src/app/(dashboard)/dashboard/page.tsx` — uses Zustand store + consolidated stats API
- `src/app/(dashboard)/repos/page.tsx` — uses sync endpoint, error toasts, sync button
- `src/app/(dashboard)/settings/page.tsx` — API key validation, data export/delete, GitHub status
- `src/app/page.tsx` — Watch Demo smooth-scroll fix
- `src/lib/auth/config.ts` — env var validation
- `src/middleware.ts` — new route matchers
- `src/lib/stores/dashboard-store.ts` — **new** Zustand store

### Session 5 Work (2026-09-16) — Core Pipeline Fix Spec

Executed all 6 phases from `oss-contributor-fix-spec.md`. Fixes the broken analyze → discover → generate → submit pipeline.

#### Phase 0 — Security: Stop exposing GitHub token client-side
- Removed `session.accessToken` from the NextAuth session callback (`config.ts`)
- `getGithubToken()` now reads from DB via `prisma.user.findUnique` instead of from session
- Removed `accessToken` from Session type augmentation
- **Verification:** `GET /api/auth/session` no longer contains `accessToken`

#### Phase 1 — Repo content access layer (new capability)
- **New file:** `src/lib/github/content.ts` — `getRepoTree`, `getFileContent`, `getFileContents`
  - Recursive file tree via GitHub Trees API (paths + SHAs, no content)
  - Single/parallel file fetch with base64 decode
- **New file:** `src/lib/github/relevance.ts` — `rankCandidateFiles`
  - Keyword extraction from issue title/body (stopword-filtered)
  - Scores files by keyword match in path
  - Always includes high-signal root files (README, package.json)
  - Returns top 12 candidates

#### Phase 2 — Diff-based code generation
- Replaced `generateCodePrompt` in `prompts.ts`:
  - Now includes real file content with line numbers (reference only, not in output)
  - `blockers` escape hatch — model can refuse instead of hallucinating
  - Rules: minimal changes, only modify shown files, create new files only if needed
- Wired real content into `contribute/route.ts` generate action:
  - Parallel fetch: tree + repo details + languages
  - `rankCandidateFiles` pre-filter → `getFileContents` → pass to `generateContributionCode`

#### Phase 3 — Fix fork/branch/commit logic
- **`pr.ts`** — New functions:
  - `createBranch(accessToken, owner, repo, branchName, fromBranch)` — creates ref from base
  - `waitForForkReady(accessToken, owner, repo, branch, { retries, delayMs })` — polls until fork ref exists
- **`pr.ts`** — Fixed `createPullRequest`:
  - Commits go to `forkOwner` (extracted from `head`), not `params.owner`
  - PR creation still targets upstream
- **`contribute/route.ts`** submit action:
  - `forkRepository` → `waitForForkReady` → `createBranch` → `createPullRequest`
  - Uses `fork.default_branch` instead of hardcoded `"main"`

#### Phase 4 — Wire findMatchingRepositories() into discovery
- `discover/route.ts` now calls `findMatchingRepositories(userId)` (AI-driven)
- Falls back to skill-profile-based keyword search if AI call fails
- Short-circuits to generic query if no `skillProfile` or `aiApiKey` (with UI message)
- Added `dedupeByFullName` helper for parallel search results

#### Phase 5 — Encrypt aiApiKey at rest
- **New file:** `src/lib/crypto.ts` — AES-256-GCM encrypt/decrypt
  - Packed format: `iv:authTag:ciphertext` (all base64)
  - Key from `ENCRYPTION_KEY` env var (32-byte base64)
- `settings/route.ts` — encrypts on `PUT`, never returns raw key
- `analyze.ts` — decrypts at point of use (server-only)
- `.env.example` updated with `ENCRYPTION_KEY` documentation

#### Verification
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **Tests:** 25/25 passing (`npm test`)
- **Lint:** 0 errors (`npm run lint`) — 6 pre-existing warnings (all useEffect dependency arrays)

#### Files Changed
- `src/lib/auth/config.ts` — removed accessToken from session callback
- `src/lib/auth/session.ts` — getGithubToken reads from DB, removed accessToken from Session type
- `src/lib/ai/prompts.ts` — replaced generateCodePrompt with grounded version + blockers
- `src/lib/ai/analyze.ts` — added decrypt import, all functions decrypt API key
- `src/lib/github/pr.ts` — added createBranch, waitForForkReady, fixed createPullRequest to target fork
- `src/lib/github/content.ts` — **new** repo content access layer
- `src/lib/github/relevance.ts` — **new** keyword-based file relevance ranking
- `src/lib/crypto.ts` — **new** AES-256-GCM encryption utility
- `src/app/api/contribute/route.ts` — wired real content into generate, fixed submit flow
- `src/app/api/repos/discover/route.ts` — wired findMatchingRepositories with fallback
- `src/app/api/settings/route.ts` — encrypts API keys on write
- `.env.example` — added ENCRYPTION_KEY documentation

### Remaining Work (Prioritized)

#### HIGH Priority
- [ ] Implement profile page with full skill breakdown (section 4.11)

#### MEDIUM Priority
- [ ] Add topic-based filtering UI on discover page
- [ ] Add match score filtering (show only 70%+ matches)
- [ ] Add "suggest desktop" banner for complex operations on mobile
- [ ] Notification preferences in settings (section 4.2)
- [ ] Contribution streak/stats visualization (section 4.11)

#### LOW Priority (Nice-to-Have)
- [ ] Keyboard shortcuts for power users (section 4.11)
- [ ] Dedicated `repos/[owner]/[repo]/page.tsx` for issue browsing (vs. current inline modal)
- [ ] Contribution guide fallback when code generation fails

---

*This file serves as persistent session memory. Reference it when resuming development.*
