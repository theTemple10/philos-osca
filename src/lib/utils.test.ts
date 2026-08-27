import { describe, it, expect } from "vitest";
import { cn, formatNumber, truncate, getLanguageColor, getDifficultyColor } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).not.toContain("hidden");
    expect(result).toContain("extra");
  });
});

describe("formatNumber", () => {
  it("formats numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("handles small numbers", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(42)).toBe("42");
  });
});

describe("truncate", () => {
  it("returns original text if within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("getLanguageColor", () => {
  it("returns correct color for known languages", () => {
    expect(getLanguageColor("TypeScript")).toBe("#3178C6");
    expect(getLanguageColor("Python")).toBe("#3572A5");
    expect(getLanguageColor("Go")).toBe("#00ADD8");
  });

  it("returns default for unknown languages", () => {
    expect(getLanguageColor("Zig")).toBe("#6B7280");
  });

  it("returns default for null", () => {
    expect(getLanguageColor(null)).toBe("#6B7280");
  });
});

describe("getDifficultyColor", () => {
  it("returns correct colors", () => {
    expect(getDifficultyColor("easy")).toBe("text-green-500");
    expect(getDifficultyColor("medium")).toBe("text-yellow-500");
    expect(getDifficultyColor("hard")).toBe("text-red-500");
  });

  it("is case insensitive", () => {
    expect(getDifficultyColor("Easy")).toBe("text-green-500");
  });

  it("returns default for unknown", () => {
    expect(getDifficultyColor("unknown")).toBe("text-gray-500");
  });
});
