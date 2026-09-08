import { generateText } from "ai";
import { getAIProvider, type AIProvider } from "./providers";
import {
  analyzeUserSkillsPrompt,
  analyzeContributionPrompt,
  generateCodePrompt,
  findMatchingReposPrompt,
} from "./prompts";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface SkillProfile {
  languages: Array<{ name: string; proficiency: number }>;
  frameworks: string[];
  strengths: string[];
  weaknesses: string[];
  experienceLevel: string;
  primaryFocus: string;
  suggestedContributionAreas: string[];
}

interface CodeResult {
  files: Array<{ path: string; content: string; action: string; explanation: string }>;
  commitMessage: string;
  prTitle: string;
  prBody: string;
  suggested_approach?: string;
}

function safeParseJSON<T>(text: string, context: string): T {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = jsonMatch ? jsonMatch[1].trim() : trimmed;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      `AI returned invalid JSON for ${context}. Response starts with: ${raw.substring(0, 200)}`
    );
  }
}

/**
 * Analyze a user's repositories to build a skill profile
 */
export async function analyzeUserSkills(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { repositories: true },
  });

  if (!user || !user.accessToken) {
    throw new Error("User not found or no GitHub access token");
  }

  if (!user.aiApiKey) {
    throw new Error("Please set your API key in Settings to use AI features.");
  }

  const providerConfig = {
    provider: (user.aiProvider || user.preferredAiProvider || "openai") as AIProvider,
    model: user.aiModel || user.preferredAiModel || undefined,
    apiKey: user.aiApiKey,
  };

  const prompt = analyzeUserSkillsPrompt(
    user.repositories.map((repo) => ({
      name: repo.name,
      language: repo.language,
      languages: (repo.languages as Record<string, number>) || null,
      topics: (repo.topics as string[]) || [],
      description: repo.description,
      starsCount: repo.starsCount,
    }))
  );

  const { text } = await generateText({
    model: getAIProvider(providerConfig),
    prompt,
    temperature: 0.3,
  });

  const skillProfile = safeParseJSON<SkillProfile>(text, "skill analysis");

  await prisma.user.update({
    where: { id: userId },
    data: { skillProfile: skillProfile as unknown as Prisma.InputJsonValue },
  });

  return skillProfile;
}

/**
 * Analyze a contribution opportunity
 */
export async function analyzeContribution(
  userId: string,
  issue: { title: string; body: string; labels: string[] },
  repoContext: {
    languages: Record<string, number>;
    topics: string[];
    description: string;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  if (!user.aiApiKey) {
    throw new Error("Please set your API key in Settings to use AI features.");
  }

  const providerConfig = {
    provider: (user.aiProvider || user.preferredAiProvider || "openai") as AIProvider,
    model: user.aiModel || user.preferredAiModel || undefined,
    apiKey: user.aiApiKey,
  };

  const prompt = analyzeContributionPrompt(issue, user.skillProfile as Record<string, unknown> | null, repoContext);

  const { text } = await generateText({
    model: getAIProvider(providerConfig),
    prompt,
    temperature: 0.2,
  });

  return safeParseJSON(text, "contribution analysis");
}

/**
 * Generate code for a contribution
 */
export async function generateContributionCode(
  userId: string,
  issue: { title: string; body: string },
  relevantFiles: Array<{ path: string; content: string }>,
  repoContext: {
    languages: Record<string, number>;
    topics: string[];
    conventions?: string;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  if (!user.aiApiKey) {
    throw new Error("Please set your API key in Settings to use AI features.");
  }

  const providerConfig = {
    provider: (user.aiProvider || user.preferredAiProvider || "openai") as AIProvider,
    model: user.aiModel || user.preferredAiModel || undefined,
    apiKey: user.aiApiKey,
  };

  const prompt = generateCodePrompt(issue, relevantFiles, repoContext);

  const { text } = await generateText({
    model: getAIProvider(providerConfig),
    prompt,
    temperature: 0.4,
  });

  return safeParseJSON<CodeResult>(text, "code generation");
}

/**
 * Find matching repositories for a user
 */
export async function findMatchingRepositories(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  if (!user.aiApiKey) {
    throw new Error("Please set your API key in Settings to use AI features.");
  }

  const providerConfig = {
    provider: (user.aiProvider || user.preferredAiProvider || "openai") as AIProvider,
    model: user.aiModel || user.preferredAiModel || undefined,
    apiKey: user.aiApiKey,
  };

  const prompt = findMatchingReposPrompt(user.skillProfile as Record<string, unknown> | null, {
    difficulty: user.difficultyLevel || undefined,
  });

  const { text } = await generateText({
    model: getAIProvider(providerConfig),
    prompt,
    temperature: 0.3,
  });

  return safeParseJSON(text, "repo discovery");
}
