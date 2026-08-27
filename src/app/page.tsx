"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GitPullRequest,
  Brain,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GitPullRequest className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">OSS Contributor</span>
            </div>
            <Button onClick={() => signIn("github")}>
              <GitPullRequest className="w-4 h-4 mr-2" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            Contribute to Open Source
            <span className="text-indigo-600"> with AI Power</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            Automatically discover projects matching your skills, generate high-quality code,
            and submit pull requests — all with AI assistance and your oversight.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => signIn("github")}>
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => signIn("github")}>
              View Demo
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Smart Skill Analysis
              </h3>
              <p className="mt-2 text-gray-600">
                Our AI analyzes your GitHub repositories to understand your
                strengths and suggest the perfect contribution opportunities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Find Perfect Issues
              </h3>
              <p className="mt-2 text-gray-600">
                Discover open source issues that match your expertise level,
                from beginner-friendly to advanced challenges.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                AI Code Generation
              </h3>
              <p className="mt-2 text-gray-600">
                Get production-ready code suggestions that follow best
                practices and project conventions, ready for review.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Connect GitHub",
                description: "Sign in with your GitHub account to analyze your profile.",
              },
              {
                step: 2,
                title: "AI Analysis",
                description: "Our AI scans your repos to build your skill profile.",
              },
              {
                step: 3,
                title: "Select Issues",
                description: "Browse curated issues matched to your expertise.",
              },
              {
                step: 4,
                title: "Submit PR",
                description: "Review generated code and submit your contribution.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Built with ❤️ for the open source community</p>
        </div>
      </footer>
    </div>
  );
}
