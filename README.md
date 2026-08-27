# OSS Contributor

An AI-powered assistant that helps developers contribute to open source projects. It analyzes your GitHub profile, identifies your strengths, finds matching contribution opportunities, and generates production-ready code with AI assistance.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-7-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Smart Skill Analysis** - AI analyzes your GitHub repositories to build a comprehensive skill profile
- **Perfect Issue Matching** - Find open source issues that match your expertise level
- **AI Code Generation** - Generate production-ready code following project conventions
- **Full Contribution Workflow** - From discovery to pull request, all in one place
- **Adaptive Difficulty** - Works for beginners to advanced developers
- **Multi-Provider AI** - Choose between OpenAI or Anthropic

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (free tier: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- GitHub OAuth App
- OpenAI or Anthropic API key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/oss-contributor.git
cd oss-contributor
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables) below).

### 3. Database Setup

```bash
npx prisma db push
```

### 4. Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Production (Vercel)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial production setup"
git push origin main
```

### Step 2: Create a Neon Database (Free)

1. Go to [https://neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`)

### Step 3: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New..." → "Project"**
3. Import your `oss-contributor` repository
4. Vercel auto-detects Next.js — leave the settings as-is
5. **Do NOT deploy yet** — first add environment variables:

### Step 4: Set Environment Variables in Vercel

Go to your project → **Settings → Environment Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your Neon connection string | From Step 2 |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` | Random secret for JWT |
| `GITHUB_CLIENT_ID` | From GitHub OAuth App | See Step 5 |
| `GITHUB_CLIENT_SECRET` | From GitHub OAuth App | See Step 5 |
| `OPENAI_API_KEY` | Your OpenAI API key | At least one AI provider needed |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Optional if using OpenAI |

### Step 5: Create GitHub OAuth App

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** OSS Contributor
   - **Homepage URL:** `https://your-project.vercel.app`
   - **Authorization callback URL:** `https://your-project.vercel.app/api/auth/callback/github`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it

### Step 6: Deploy

1. Back in Vercel, click **"Deploy"**
2. Wait for the build to complete
3. Your app is live at `https://your-project.vercel.app`

### Step 7: Set Production URLs

After first deploy, update these in Vercel → Settings → Environment Variables (Production scope):

- `NEXTAUTH_URL` = `https://your-project.vercel.app`
- Update GitHub OAuth App callback URL to your production domain

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
```

## Architecture

```
oss-contributor/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/login/page.tsx     # GitHub login page
│   │   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── api/                      # API routes
│   │   ├── error.tsx                 # Error boundary
│   │   ├── not-found.tsx             # 404 page
│   │   └── layout.tsx                # Root layout
│   ├── components/                   # React components
│   ├── lib/                          # Utilities
│   │   ├── ai/                       # AI provider abstraction
│   │   ├── auth/                     # Authentication
│   │   ├── db/                       # Database client
│   │   ├── github/                   # GitHub API integration
│   │   └── rate-limit.ts             # Rate limiting
│   └── middleware.ts                  # Auth middleware
├── prisma/                           # Database schema
└── package.json
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript 7, Tailwind CSS 4
- **Backend:** Next.js API Routes, Prisma ORM 6
- **Database:** PostgreSQL (Neon free tier)
- **AI:** OpenAI GPT-4o, Anthropic Claude (via Vercel AI SDK)
- **Auth:** NextAuth.js 4 with GitHub Provider
- **GitHub API:** Octokit for repository operations
- **Validation:** Zod for input validation
- **Testing:** Vitest

## How It Works

1. **Connect GitHub** - Sign in with your GitHub account
2. **AI Analysis** - AI scans your repos to build your skill profile
3. **Discover Projects** - Get personalized recommendations for open source projects
4. **Generate & Submit** - Select an issue, let AI generate a solution, review the code, and submit your pull request

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT signing |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret |
| `OPENAI_API_KEY` | One required | OpenAI API key |
| `ANTHROPIC_API_KEY` | One required | Anthropic API key |
| `NEXTAUTH_URL` | No* | App URL (*auto-set by Vercel) |

## Cost Estimate

Running on free tiers:
- **Vercel:** Free (Hobby plan, 100GB bandwidth)
- **Neon PostgreSQL:** Free (0.5GB storage, 24/7 compute)
- **AI API costs:** ~$0.01-0.10 per analysis (depends on usage)
- **GitHub API:** Free (within rate limits)

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
