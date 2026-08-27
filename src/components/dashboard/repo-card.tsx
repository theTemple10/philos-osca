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
  onClick?: () => void;
  selected?: boolean;
}

export function RepoCard({ repo, onClick, selected }: RepoCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-indigo-500"
      )}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{repo.name}</h3>
            <p className="text-sm text-gray-500 truncate">{repo.fullName}</p>
          </div>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {repo.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {truncate(repo.description, 120)}
          </p>
        )}

        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
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
