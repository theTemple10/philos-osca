"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, getLanguageColor, truncate } from "@/lib/utils";
import { GitFork, Star, ExternalLink } from "lucide-react";

interface RepoCardProps {
  repo: {
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    language: string | null;
    starsCount: number;
    forksCount: number;
    topics: string[];
  };
  matchScore?: number;
  onClick?: () => void;
  selected?: boolean;
}

export function RepoCard({ repo, matchScore, onClick, selected }: RepoCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[var(--accent-muted)]",
        selected && "ring-2 ring-[var(--accent)]"
      )}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[var(--fg-primary)] truncate">{repo.name}</h3>
              {matchScore !== undefined && (
                <Badge variant={matchScore >= 0.7 ? "success" : matchScore >= 0.4 ? "warning" : "default"}>
                  {Math.round(matchScore * 100)}% match
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--fg-muted)] truncate">{repo.fullName}</p>
          </div>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)] ml-2 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {repo.description && (
          <p className="mt-2 text-sm text-[var(--fg-tertiary)] line-clamp-2">
            {truncate(repo.description, 120)}
          </p>
        )}

        <div className="mt-3 flex items-center gap-4 text-sm text-[var(--fg-muted)]">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: getLanguageColor(repo.language) }}
              />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{formatNumber(repo.starsCount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="w-4 h-4" />
            <span>{formatNumber(repo.forksCount)}</span>
          </div>
        </div>

        {repo.topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {repo.topics.slice(0, 5).map((topic) => (
              <Badge key={topic} variant="info">
                {topic}
              </Badge>
            ))}
            {repo.topics.length > 5 && (
              <Badge variant="default">+{repo.topics.length - 5}</Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
