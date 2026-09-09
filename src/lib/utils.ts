import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Get language color based on language name
 */
export function getLanguageColor(language: string | null): string {
  const colors: Record<string, string> = {
    TypeScript: "#3178C6",
    JavaScript: "#F7DF1E",
    Python: "#3572A5",
    Java: "#B07219",
    Go: "#00ADD8",
    Rust: "#DEA584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    "C++": "#F34B7D",
    C: "#555555",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    HTML: "#E34C26",
    CSS: "#563D7C",
    Shell: "#89E051",
  };

  return colors[language || ""] || "#6B7280";
}

/**
 * Get difficulty color using semantic tokens
 */
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: "text-[var(--color-success)]",
    medium: "text-[var(--color-warning)]",
    hard: "text-[var(--color-danger)]",
  };

  return colors[difficulty.toLowerCase()] || "text-[var(--fg-muted)]";
}

/**
 * Get status color using semantic tokens
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    discovered: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
    selected: "bg-[var(--accent-light)] text-[var(--accent)]",
    analyzing: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
    coding: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
    reviewing: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
    pr_created: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
    merged: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
    declined: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  };

  return colors[status] || "bg-[var(--bg-tertiary)] text-[var(--fg-muted)]";
}
