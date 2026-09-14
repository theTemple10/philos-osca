const CODE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rb",
  ".java",
  ".rs",
  ".php",
  ".md",
];
const IGNORE_PATTERNS = [
  /node_modules/,
  /dist\//,
  /build\//,
  /\.lock$/,
  /vendor\//,
  /\.min\./,
];
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "in",
  "to",
  "and",
  "of",
  "for",
  "on",
  "with",
  "it",
  "this",
  "that",
  "or",
  "be",
  "are",
  "was",
  "were",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "but",
  "not",
  "no",
  "so",
  "if",
  "at",
  "by",
  "from",
  "as",
  "into",
  "about",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function rankCandidateFiles(
  tree: { path: string; type: "blob" | "tree" }[],
  issue: { title: string; body: string }
): string[] {
  const keywords = extractKeywords(issue.title + " " + issue.body);

  const blobs = tree.filter(
    (f) =>
      f.type === "blob" &&
      CODE_EXTENSIONS.some((ext) => f.path.endsWith(ext)) &&
      !IGNORE_PATTERNS.some((re) => re.test(f.path))
  );

  const scored = blobs.map((f) => {
    const pathLower = f.path.toLowerCase();
    const score = keywords.reduce(
      (acc, kw) => acc + (pathLower.includes(kw) ? 1 : 0),
      0
    );
    return { path: f.path, score };
  });

  const alwaysInclude = blobs
    .filter((f) =>
      /^(README|package\.json|CONTRIBUTING)/i.test(f.path.split("/").pop() || "")
    )
    .map((f) => f.path);

  const ranked = scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.path);
  return [...new Set([...ranked.slice(0, 8), ...alwaysInclude])].slice(0, 12);
}
