import { describe, it, expect } from "vitest";
import {
  analyzeUserSkillsPrompt,
  analyzeContributionPrompt,
  generateCodePrompt,
  findMatchingReposPrompt,
} from "./prompts";

describe("analyzeUserSkillsPrompt", () => {
  it("returns a string containing repo data", () => {
    const repos = [
      {
        name: "my-app",
        language: "TypeScript",
        languages: { TypeScript: 80, JavaScript: 20 },
        topics: ["react", "nextjs"],
        description: "A web app",
        starsCount: 10,
      },
    ];
    const result = analyzeUserSkillsPrompt(repos);
    expect(result).toContain("my-app");
    expect(result).toContain("TypeScript");
    expect(result).toContain("JSON");
  });

  it("limits repos to 20", () => {
    const repos = Array.from({ length: 30 }, (_, i) => ({
      name: `repo-${i}`,
      language: "TypeScript",
      languages: null,
      topics: [],
      description: null,
      starsCount: 0,
    }));
    const result = analyzeUserSkillsPrompt(repos);
    expect(result).toContain("repo-19");
    expect(result).not.toContain("repo-20");
  });
});

describe("analyzeContributionPrompt", () => {
  it("includes issue title and body", () => {
    const result = analyzeContributionPrompt(
      { title: "Fix login bug", body: "Users cannot login", labels: ["bug"] },
      { languages: [{ name: "TypeScript" }] },
      { languages: { TypeScript: 100 }, topics: [], description: "App" }
    );
    expect(result).toContain("Fix login bug");
    expect(result).toContain("Users cannot login");
    expect(result).toContain("bug");
  });
});

describe("generateCodePrompt", () => {
  it("includes issue and file context", () => {
    const result = generateCodePrompt(
      { title: "Add dark mode", body: "Implement dark mode toggle" },
      [{ path: "src/App.tsx", content: "export default function App() {}" }],
      { languages: { TypeScript: 100 }, topics: ["react"] }
    );
    expect(result).toContain("Add dark mode");
    expect(result).toContain("App.tsx");
    expect(result).toContain("JSON");
  });
});

describe("findMatchingReposPrompt", () => {
  it("includes skill profile", () => {
    const result = findMatchingReposPrompt(
      { languages: [{ name: "TypeScript" }], frameworks: ["React"] },
      { difficulty: "beginner" }
    );
    expect(result).toContain("TypeScript");
    expect(result).toContain("React");
    expect(result).toContain("JSON");
  });

  it("works without preferences", () => {
    const result = findMatchingReposPrompt(
      { languages: [{ name: "Python" }] }
    );
    expect(result).toContain("Python");
  });
});
