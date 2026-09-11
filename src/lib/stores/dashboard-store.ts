import { create } from "zustand";

interface SkillProfile {
  languages?: Array<{ name: string; proficiency: number }>;
  frameworks?: string[];
  strengths?: string[];
  weaknesses?: string[];
  experienceLevel?: string;
  primaryFocus?: string;
  suggestedContributionAreas?: string[];
}

interface DashboardState {
  // Skill profile
  skillProfile: SkillProfile | null;
  setSkillProfile: (profile: SkillProfile | null) => void;

  // User settings
  hasApiKey: boolean;
  aiProvider: string;
  aiModel: string;
  difficulty: string;
  setSettings: (settings: {
    hasApiKey?: boolean;
    aiProvider?: string;
    aiModel?: string;
    difficulty?: string;
  }) => void;

  // Repos
  reposCount: number;
  setReposCount: (count: number) => void;

  // Stats
  totalContributions: number;
  totalPRs: number;
  setStats: (stats: { totalContributions?: number; totalPRs?: number }) => void;

  // Loading states
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Skill profile
  skillProfile: null,
  setSkillProfile: (profile) => set({ skillProfile: profile }),

  // User settings
  hasApiKey: false,
  aiProvider: "openai",
  aiModel: "gpt-4o",
  difficulty: "adaptive",
  setSettings: (settings) =>
    set((state) => ({
      ...state,
      ...(settings.hasApiKey !== undefined && { hasApiKey: settings.hasApiKey }),
      ...(settings.aiProvider && { aiProvider: settings.aiProvider }),
      ...(settings.aiModel && { aiModel: settings.aiModel }),
      ...(settings.difficulty && { difficulty: settings.difficulty }),
    })),

  // Repos
  reposCount: 0,
  setReposCount: (count) => set({ reposCount: count }),

  // Stats
  totalContributions: 0,
  totalPRs: 0,
  setStats: (stats) =>
    set((state) => ({
      ...state,
      ...(stats.totalContributions !== undefined && {
        totalContributions: stats.totalContributions,
      }),
      ...(stats.totalPRs !== undefined && { totalPRs: stats.totalPRs }),
    })),

  // Loading states
  isAnalyzing: false,
  setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),
}));
