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
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: "text-green-500",
    medium: "text-yellow-500",
    hard: "text-red-500",
  };

  return colors[difficulty.toLowerCase()] || "text-gray-500";
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    discovered: "bg-blue-100 text-blue-800",
    selected: "bg-purple-100 text-purple-800",
    analyzing: "bg-yellow-100 text-yellow-800",
    coding: "bg-orange-100 text-orange-800",
    reviewing: "bg-cyan-100 text-cyan-800",
    pr_created: "bg-green-100 text-green-800",
    merged: "bg-emerald-100 text-emerald-800",
    declined: "bg-red-100 text-red-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
}
