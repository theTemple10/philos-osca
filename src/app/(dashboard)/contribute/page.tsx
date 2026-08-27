"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContributionCard } from "@/components/contribution/contribution-card";
import {
  GitPullRequest,
  Code,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface Contribution {
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
}

interface GeneratedCode {
  files: Array<{
    path: string;
    content: string;
    action: string;
    explanation: string;
  }>;
  commitMessage: string;
  prTitle: string;
  prBody: string;
}

export default function ContributePage() {
  const { status } = useSession();
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function fetchContributions() {
    try {
      const res = await fetch("/api/contributions");
      const data = await res.json();
      setContributions(data.contributions || []);
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      startTransition(() => {
        fetchContributions();
      });
    }
  }, [status]);

  async function handleSelect(contributionId: string) {
    const contribution = contributions.find((c) => c.id === contributionId);
    setSelectedContribution(contribution || null);
  }

  async function handleGenerate(contributionId: string) {
    setGenerating(true);
    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionId,
          action: "generate",
        }),
      });

      const data = await res.json();
      if (data.codeResult) {
        setGeneratedCode(data.codeResult);
      }
    } catch (error) {
      console.error("Error generating code:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(contributionId: string) {
    setSubmitting(true);
    try {
      const branchName = `oss-contributor/${Date.now()}`;
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionId,
          action: "submit",
          branchName,
        }),
      });

      const data = await res.json();
      if (data.prUrl) {
        setPrUrl(data.prUrl);
      }
    } catch (error) {
      console.error("Error submitting PR:", error);
    } finally {
      setSubmitting(false);
    }
  }

  // Step indicator
  const steps = [
    { id: 1, name: "Select Issue", done: !!selectedContribution },
    { id: 2, name: "Generate Code", done: !!generatedCode },
    { id: 3, name: "Review", done: false },
    { id: 4, name: "Submit PR", done: !!prUrl },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Contribution Workflow
        </h1>
        <p className="text-gray-600 mt-1">
          Select an issue, generate code, review, and submit your contribution.
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.done
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step.done ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PR Success */}
      {prUrl && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">
                  Pull Request Created!
                </h3>
                <p className="text-green-700">
                  Your contribution has been submitted. View it on GitHub.
                </p>
              </div>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View PR
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Code Preview */}
      {generatedCode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Code</h3>
              <Badge variant="success">Ready for Review</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Commit Message */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Commit Message
                </p>
                <code className="block p-3 bg-gray-50 rounded-lg text-sm">
                  {generatedCode.commitMessage}
                </code>
              </div>

              {/* Files */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Files Changed ({generatedCode.files.length})
                </p>
                <div className="space-y-2">
                  {generatedCode.files.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Badge
                        variant={
                          file.action === "create"
                            ? "success"
                            : file.action === "delete"
                            ? "error"
                            : "warning"
                        }
                      >
                        {file.action}
                      </Badge>
                      <code className="text-sm flex-1">{file.path}</code>
                      <p className="text-xs text-gray-500 max-w-xs truncate">
                        {file.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PR Content */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    PR Title
                  </p>
                  <p className="p-3 bg-gray-50 rounded-lg text-sm">
                    {generatedCode.prTitle}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    PR Description
                  </p>
                  <p className="p-3 bg-gray-50 rounded-lg text-sm line-clamp-3">
                    {generatedCode.prBody}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" onClick={() => setGeneratedCode(null)}>
              Discard
            </Button>
            <Button
              onClick={() =>
                selectedContribution && handleSubmit(selectedContribution.id)
              }
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GitPullRequest className="w-4 h-4 mr-2" />
              )}
              Submit Pull Request
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Contribution List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Contributions
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : contributions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No contributions discovered yet. Go to Discover to find projects.
              </p>
              <Button className="mt-4" onClick={() => router.push("/repos")}>
                Discover Projects
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                onSelect={handleSelect}
                onGenerate={handleGenerate}
                onSubmit={handleSubmit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading State for Generation */}
      {generating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">
                Generating Code...
              </p>
              <p className="text-gray-500 mt-1">
                AI is analyzing the issue and creating a solution
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
