"use client";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getDifficultyColor } from "@/lib/utils";
import { ExternalLink, Clock, Zap, ArrowRight } from "lucide-react";

interface ContributionCardProps {
  contribution: {
    id: string;
    targetRepoOwner: string;
    targetRepoName: string;
    targetRepoUrl: string;
    issueNumber: number | null;
    issueTitle: string | null;
    issueUrl: string | null;
    difficulty: string | null;
    skillMatch: number | null;
    suggestedApproach: string | null;
    status: string;
  };
  onSelect?: (id: string) => void;
  onGenerate?: (id: string) => void;
  onSubmit?: (id: string) => void;
}

export function ContributionCard({
  contribution,
  onSelect,
  onGenerate,
  onSubmit,
}: ContributionCardProps) {
  const difficultyLabel = contribution.difficulty
    ? contribution.difficulty.charAt(0).toUpperCase() + contribution.difficulty.slice(1)
    : "Unknown";

  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:border-[var(--accent-muted)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--fg-primary)] line-clamp-2">
              {contribution.issueTitle || "Untitled Issue"}
            </h3>
            <p className="text-sm text-[var(--fg-muted)] mt-1">
              {contribution.targetRepoOwner}/{contribution.targetRepoName}
              {contribution.issueNumber && ` #${contribution.issueNumber}`}
            </p>
          </div>
          {contribution.issueUrl && (
            <a
              href={contribution.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm">
          {contribution.skillMatch !== null && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-[var(--fg-tertiary)]">Match:</span>
              <span className="font-medium text-[var(--fg-primary)]">
                {Math.round(contribution.skillMatch * 100)}%
              </span>
            </div>
          )}

          {contribution.difficulty && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--fg-muted)]" />
              <span className={cn("font-medium", getDifficultyColor(contribution.difficulty))}>
                {difficultyLabel}
              </span>
            </div>
          )}

          <Badge variant={getStatusVariant(contribution.status)}>
            {contribution.status.replace("_", " ")}
          </Badge>
        </div>

        {contribution.suggestedApproach && (
          <p className="mt-3 text-sm text-[var(--fg-tertiary)] line-clamp-2">
            {contribution.suggestedApproach}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        {contribution.status === "discovered" && (
          <Button size="sm" onClick={() => onSelect?.(contribution.id)}>
            Select
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        {contribution.status === "selected" && (
          <Button size="sm" onClick={() => onGenerate?.(contribution.id)}>
            Generate Code
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        {(contribution.status === "analyzing" || contribution.status === "coding") && (
          <Button size="sm" disabled>
            Processing...
          </Button>
        )}
        {contribution.status === "reviewing" && (
          <Button size="sm" onClick={() => onSubmit?.(contribution.id)}>
            Submit PR
          </Button>
        )}
        {(contribution.status === "pr_created" || contribution.status === "merged") && (
          <span className="text-sm text-[var(--color-success)] font-medium">Completed</span>
        )}
      </CardFooter>
    </Card>
  );
}

function getStatusVariant(
  status: string
): "default" | "success" | "warning" | "error" | "info" {
  const variants: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
    discovered: "info",
    selected: "default",
    analyzing: "warning",
    coding: "warning",
    reviewing: "info",
    pr_created: "success",
    merged: "success",
    declined: "error",
  };
  return variants[status] || "default";
}
