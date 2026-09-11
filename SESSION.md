# SESSION.md — Persistent Session Memory

> **Created:** 2026-09-07
> **Branch:** main
> **Status:** Active development — large feature set pending

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

| Issue | Location | Description |
|-------|----------|-------------|
| Generated code not committed on submit | `src/app/api/contribute/route.ts:161-182` | The `submit` action calls `createPullRequest` with `files: []` — the AI-generated code from the `generate` step is never stored or applied. |
| `findMatchingRepositories` not wired | `src/lib/ai/analyze.ts:160-183` | Function exists in lib but no API route calls it. Discover endpoint uses basic GitHub search instead. |
| Rate limiter memory leak | `src/lib/rate-limit.ts:55-66` | Cleanup interval runs in serverless, which is ephemeral. Not a real issue on Vercel but worth noting. |

---

## 4. Feature Requirements (Pending Implementation)

### 4.1 Settings Page — AI Provider Integration

**Priority:** HIGH — foundational change

**Current state:** Shows OpenAI/Anthropic as radio buttons. Static warning says "set API key in env vars." API keys are global (`.env`), not per-user.

**Target state:**
- Users input their **own API key** directly on the settings page
- Users choose which provider and model to use
- If no paid key, offer **free providers** (Groq, MiMo, etc.)
- Remove the env-var warning entirely
- App is universally usable — each user brings their own key

**Architectural impact:**
- API keys move from global env vars to **per-user storage** in the database
- `src/lib/ai/providers.ts` — must accept user-specific keys instead of `process.env`
- `src/lib/ai/analyze.ts` — all AI functions must receive user's key/config
- `prisma/schema.prisma` — User model needs fields for API key, provider, model preferences
- `src/app/api/settings/route.ts` — must handle API key storage/retrieval
- `src/app/(dashboard)/settings/page.tsx` — complete redesign of AI section

**Providers to support:**
- OpenAI (user brings key) — already integrated via `@ai-sdk/openai`
- Anthropic (user brings key) — already integrated via `@ai-sdk/anthropic`
- Groq (free tier, fast inference) — needs `@ai-sdk/groq` or OpenAI-compatible wrapper
- MiMo / other free models — evaluate SDK support
- OpenRouter (catch-all aggregator) — OpenAI-compatible API

**New Prisma fields needed on User model:**
```prisma
aiApiKey        String?   // Encrypted API key
aiProvider      String?   // "openai" | "anthropic" | "groq" | "mimo" | "openrouter"
aiModel         String?   // Model ID
```

### 4.2 Settings — Additional Items

- Theme preference (ties into dark mode)
- Notification preferences
- Data export/delete (privacy)
- GitHub account connection status
- Logo "OSS Contributor" should be clickable → `/dashboard`

### 4.3 Dashboard — Clickable Tiles

**Current:** Three static `<Card>` components showing Repositories, Contributions, Pull Requests counts.

**Target:** Each tile clickable → navigates to relevant page (`/repos`, `/contribute`, etc.) or shows detailed breakdown.

### 4.4 Dashboard — Fix Average Proficiency

**Current:** Shows "—" when `skillProfile` is null (because analysis never ran or failed).

**Fix:** Ensure the analyze button works first (4.5), then the proficiency calculation at `dashboard/page.tsx:158-166` should work automatically.

### 4.5 Dashboard — Fix "Analyze My Skills" Button

**Current:** Calls `POST /api/analyze` with `{ type: "skills" }`. Likely fails because:
1. No repos synced yet (user must visit `/repos` first)
2. AI API key not configured
3. Error is caught silently

**Fix:**
- Check if repos are synced before allowing analysis
- Show clear error messages to user
- Handle the case where no API key is configured (prompt user to set one or use free provider)
- Show progress/loading state during analysis

### 4.6 Discover Page — Skill-Based Matching

**Current:** Basic GitHub keyword search from skill profile languages/frameworks.

**Target:** Smarter matching after repos are scanned:
- Weight results by language match percentage
- Filter by topic alignment
- Show a "match score" on each repo card
- Only show projects closely related to user's demonstrated skills

**Files:** `src/app/api/repos/discover/route.ts`, `src/app/(dashboard)/repos/page.tsx`

### 4.7 Project Click → Issues → Contribution Workflow

**Current:** Contribute page shows pre-created contributions. No way to browse issues from discovered projects.

**Target flow:**
1. Click a project on Discover page
2. See available issues for that project (fetched from GitHub Issues API)
3. Select an issue → enters contribution workflow
4. AI generates code (or describes approach if too complex)
5. Review → Submit PR

**If code generation fails:** Produce a detailed contribution guide instead of failing silently.

**New files needed:**
- `src/app/(dashboard)/repos/[owner]/[repo]/page.tsx` — issue browser
- `src/app/api/repos/[owner]/[repo]/issues/route.ts` — issues endpoint
- Update `src/app/(dashboard)/contribute/page.tsx` — integrate with issue selection

**Existing GitHub issue fetch:** `src/lib/github/repos.ts:75-92` — `fetchRepoIssues()`

### 4.8 Contributions Page — History

**Current:** `GET /api/contributions` returns all contributions. Contribute page shows them inline.

**Target:** Dedicated page showing contribution history over time — status, PRs, outcomes.

**New file:** `src/app/(dashboard)/history/page.tsx`
**Update:** `src/app/(dashboard)/layout.tsx` — add to navigation

### 4.9 Mobile Responsiveness + UX

**Current:** Fixed sidebar (`w-64`). No mobile handling.

**Target:**
- Responsive sidebar (hamburger menu on mobile)
- Breakpoint detection — suggest desktop for complex operations
- Better error messages throughout
- Loading states, empty states, success/error toasts
- Quality of life improvements for usability

### 4.10 Dark Mode

**Target:**
- System preference detection (`prefers-color-scheme`)
- Manual toggle in settings or header
- Tailwind `dark:` classes throughout
- Consistent theming

**Files:** `src/app/globals.css`, all components, `src/app/layout.tsx`

### 4.11 Extra Features (Nice-to-Have)

- Toast notifications for actions (PR created, settings saved, etc.)
- Loading skeletons instead of spinners
- Keyboard shortcuts for power users
- Contribution streak/stats visualization
- Profile page with full skill breakdown

---

## 5. Architecture Notes

### Current Data Flow for AI Calls

```
User clicks "Analyze Skills"
  → POST /api/analyze { type: "skills" }
    → analyzeUserSkills(userId)
      → prisma.user.findUnique(userId) → get repos
      → getDefaultProvider(user.preferredAiProvider, user.preferredAiModel)
        → reads from process.env.OPENAI_API_KEY or ANTHROPIC_API_KEY
      → generateText({ model: getAIProvider(config), prompt })
      → prisma.user.update({ skillProfile: result })
```

**After per-user keys:**
```
User clicks "Analyze Skills"
  → POST /api/analyze { type: "skills" }
    → analyzeUserSkills(userId)
      → prisma.user.findUnique(userId) → get repos + aiApiKey + aiProvider + aiModel
      → if (!user.aiApiKey) → return error "Please set your API key in Settings"
      → getAIProvider({ provider: user.aiProvider, model: user.aiModel, apiKey: user.aiApiKey })
      → generateText({ model, prompt })
      → prisma.user.update({ skillProfile: result })
```

### Auth Flow (Fixed)

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
    → session.accessToken = token.accessToken
  → redirect to /dashboard
```

No PrismaAdapter involved. JWT handles sessions. signIn callback handles user persistence.

---

## 6. Key File Reference

| File | Purpose |
|------|---------|
| `src/lib/auth/config.ts` | NextAuth config — providers, callbacks, JWT strategy |
| `src/lib/auth/session.ts` | Session helpers — getSession, getGithubToken |
| `src/lib/ai/providers.ts` | AI provider abstraction — getAIProvider, AVAILABLE_MODELS |
| `src/lib/ai/analyze.ts` | AI analysis functions — analyzeUserSkills, generateContributionCode |
| `src/lib/ai/prompts.ts` | Prompt templates for all AI calls |
| `src/lib/github/repos.ts` | GitHub API — fetchUserRepos, searchRepositories, fetchRepoIssues |
| `src/lib/github/pr.ts` | GitHub PR operations — forkRepository, createPullRequest |
| `src/lib/db/index.ts` | Prisma client singleton |
| `src/lib/rate-limit.ts` | In-memory rate limiter |
| `src/middleware.ts` | Auth middleware — protects dashboard + API routes |
| `prisma/schema.prisma` | Database schema — User, UserRepo, Contribution, PullRequest |
| `src/app/api/analyze/route.ts` | POST/GET for skill analysis |
| `src/app/api/repos/route.ts` | GET — sync user repos from GitHub |
| `src/app/api/repos/discover/route.ts` | GET — discover matching repos |
| `src/app/api/contribute/route.ts` | POST — create/generate/submit contributions |
| `src/app/api/contributions/route.ts` | GET — list user contributions |
| `src/app/api/settings/route.ts` | GET/PUT — user settings |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout — sidebar navigation |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard — stats, skill map, quick actions |
| `src/app/(dashboard)/repos/page.tsx` | Discover page — repos + discovered projects |
| `src/app/(dashboard)/contribute/page.tsx` | Contribute page — workflow, code gen, PR submit |
| `src/app/(dashboard)/settings/page.tsx` | Settings — AI provider, difficulty, privacy |

---

## 7. Implementation Order (Suggested)

1. **Per-user AI keys** — Foundation for everything else (4.1)
2. **Settings page redesign** — API key input, provider selection (4.1, 4.2)
3. **Fix Analyze button + proficiency** — Depends on AI keys working (4.4, 4.5)
4. **Dashboard tile clicks** — Quick win (4.3)
5. **Discover page improvements** — Skill-based matching (4.6)
6. **Issue browsing** — New page, integrates with contribute flow (4.7)
7. **Contributions history page** — New page (4.8)
8. **Dark mode** — Tailwind dark classes + toggle (4.10)
9. **Mobile responsiveness** — Responsive sidebar, breakpoints (4.9)
10. **UX polish** — Toasts, loading states, error messages (4.9, 4.11)

---

## 8. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Which free AI providers? Groq is straightforward (OpenAI-compatible). MiMo needs evaluation. | Pending user input |
| 2 | Encrypt API keys in DB or plain storage? | Pending user input |
| 3 | Dashboard tile clicks — navigate to pages or show modals? | Pending user input |
| 4 | Issue browsing — new page or modal on discover? | Pending user input |
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

### Remaining Work (Prioritized)

#### HIGH Priority
- [ ] Wire `findMatchingRepositories()` from analyze.ts into discover endpoint
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
- [ ] Encrypt API keys in database (currently plaintext)

---

*This file serves as persistent session memory. Reference it when resuming development.*
