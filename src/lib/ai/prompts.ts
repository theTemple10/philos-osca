/**
 * Prompt for analyzing a user's skill profile from their repositories
 */
export function analyzeUserSkillsPrompt(repos: Array<{
  name: string;
  language: string | null;
  languages: Record<string, number> | null;
  topics: string[];
  description: string | null;
  starsCount: number;
}>) {
  return `Analyze the following GitHub repositories to determine the developer's skill profile.
Return a JSON object with the following structure:
{
  "languages": [{ "name": "TypeScript", "proficiency": 0.85, "yearsOfExperience": "estimated" }],
  "frameworks": ["React", "Next.js", "Node.js"],
  "strengths": ["Frontend development", "API design"],
  "weaknesses": ["Testing", "DevOps"],
  "experienceLevel": "intermediate", // beginner, intermediate, advanced
  "primaryFocus": "fullstack", // frontend, backend, fullstack, mobile, devops
  "suggestedContributionAreas": ["React ecosystem", "TypeScript projects"]
}

Repositories:
${JSON.stringify(repos.slice(0, 20), null, 2)}

Respond ONLY with valid JSON.`;
}

/**
 * Prompt for analyzing a contribution opportunity
 */
export function analyzeContributionPrompt(
  issue: { title: string; body: string; labels: string[] },
  userSkills: Record<string, unknown> | null,
  repoContext: { languages: Record<string, number>; topics: string[]; description: string }
) {
  return `Analyze this open source issue and determine if it's a good match for the developer.

Developer Skills:
${JSON.stringify(userSkills, null, 2)}

Repository Context:
${JSON.stringify(repoContext, null, 2)}

Issue:
Title: ${issue.title}
Labels: ${issue.labels.join(", ")}
Description: ${issue.body?.substring(0, 2000) || "No description provided"}

Return a JSON object:
{
  "skillMatch": 0.85, // 0.0 - 1.0 how well skills match
  "difficulty": "medium", // easy, medium, hard
  "estimatedTime": "2-4 hours",
  "suggestedApproach": "Brief description of how to approach this",
  "relevantFiles": ["file/path.ts"], // likely files to modify
  "learningOpportunity": "What the developer can learn",
  "confidence": 0.9 // How confident we are in this assessment
}

Respond ONLY with valid JSON.`;
}

/**
 * Prompt for generating code for a contribution
 */
export function generateCodePrompt(
  issue: { title: string; body: string },
  relevantFiles: Array<{ path: string; content: string }>,
  repoContext: { languages: Record<string, number>; topics: string[]; conventions?: string }
) {
  return `You are an expert open source contributor. Generate code to solve this issue.

Issue Title: ${issue.title}
Issue Description: ${issue.body?.substring(0, 3000) || "No description"}

Repository Context:
- Languages: ${Object.keys(repoContext.languages).join(", ")}
- Topics: ${repoContext.topics.join(", ")}
${repoContext.conventions ? `- Code Conventions: ${repoContext.conventions}` : ""}

Existing Code (relevant files):
${relevantFiles.map((f) => `\n--- ${f.path} ---\n${f.content.substring(0, 3000)}`).join("\n")}

Generate the solution following these rules:
1. Follow the existing code style and conventions
2. Add appropriate comments for complex logic
3. Handle edge cases
4. Include error handling where appropriate
5. Keep changes minimal and focused on the issue

Return a JSON object:
{
  "files": [
    {
      "path": "path/to/file.ts",
      "content": "full file content",
      "action": "create" | "update" | "delete",
      "explanation": "Why this change is needed"
    }
  ],
  "commitMessage": "conventional commit message",
  "prTitle": "PR title",
  "prBody": "PR description with context"
}

Respond ONLY with valid JSON.`;
}

/**
 * Prompt for finding matching repositories
 */
export function findMatchingReposPrompt(
  userSkills: Record<string, unknown> | null,
  preferences?: { languages?: string[]; topics?: string[]; difficulty?: string }
) {
  return `Based on the developer's skill profile, suggest open source repositories they could contribute to.

Developer Skills:
${JSON.stringify(userSkills, null, 2)}

${preferences ? `Preferences:\n${JSON.stringify(preferences, null, 2)}` : ""}

Return a JSON object with search queries and filters:
{
  "searchQueries": [
    { "query": "react component library", "language": "TypeScript", "reason": "Matches frontend skills" },
    { "query": "cli tool", "language": "Go", "reason": "Good for learning Go" }
  ],
  "recommendedLabels": ["good first issue", "help wanted", "beginner friendly"],
  "suggestedTopics": ["react", "typescript", "nextjs"]
}

Respond ONLY with valid JSON.`;
}
