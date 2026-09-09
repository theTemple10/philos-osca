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
  Play,
  Zap,
  Shield,
  Code,
  GitBranch,
  Globe,
  Rocket,
  Star,
  Terminal,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Skill Analysis",
    description:
      "AI scans your GitHub repos to understand your strengths and suggest the perfect contribution opportunities.",
    color: "bg-[var(--accent-light)]",
    iconColor: "text-[var(--accent)]",
  },
  {
    icon: Target,
    title: "Find Perfect Issues",
    description:
      "Discover open source issues that match your expertise level, from beginner-friendly to advanced challenges.",
    color: "bg-[var(--color-success-bg)]",
    iconColor: "text-[var(--color-success)]",
  },
  {
    icon: Sparkles,
    title: "AI Code Generation",
    description:
      "Get production-ready code suggestions that follow best practices, ready for review and PR submission.",
    color: "bg-[var(--color-warning-bg)]",
    iconColor: "text-[var(--color-warning)]",
  },
];

const steps = [
  {
    step: 1,
    title: "Connect GitHub",
    description: "Sign in with your GitHub account to analyze your profile.",
    icon: GitBranch,
  },
  {
    step: 2,
    title: "AI Analysis",
    description: "Our AI scans your repos to build your skill profile.",
    icon: Brain,
  },
  {
    step: 3,
    title: "Select Issues",
    description: "Browse curated issues matched to your expertise.",
    icon: Target,
  },
  {
    step: 4,
    title: "Submit PR",
    description: "Review generated code and submit your contribution.",
    icon: Rocket,
  },
];

const stats = [
  { value: "AI-Powered", icon: Zap },
  { value: "Open Source", icon: Globe },
  { value: "Secure", icon: Shield },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-[var(--border-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-105">
                <GitPullRequest className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-xl text-[var(--fg-primary)] tracking-tight">
                OSS Contributor
              </span>
            </div>
            <Button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="shadow-sm"
            >
              <GitPullRequest className="w-4 h-4 mr-2" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid pattern */}
          <div className="absolute inset-0 hero-grid opacity-60" />

          {/* Gradient orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[var(--accent)] rounded-full blur-[128px] opacity-[0.07] animate-pulse-glow" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[128px] opacity-[0.05] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-500 rounded-full blur-[128px] opacity-[0.04] animate-pulse-glow" style={{ animationDelay: "3s" }} />

          {/* Floating code symbols */}
          <div className="absolute top-32 left-[10%] animate-float opacity-20 dark:opacity-10">
            <Code className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div className="absolute top-48 right-[15%] animate-float opacity-20 dark:opacity-10" style={{ animationDelay: "2s" }}>
            <Terminal className="w-6 h-6 text-[var(--color-success)]" />
          </div>
          <div className="absolute bottom-32 left-[20%] animate-float opacity-20 dark:opacity-10" style={{ animationDelay: "4s" }}>
            <Layers className="w-7 h-7 text-purple-500" />
          </div>
          <div className="absolute top-60 left-[60%] animate-float opacity-20 dark:opacity-10" style={{ animationDelay: "1s" }}>
            <GitBranch className="w-6 h-6 text-[var(--color-warning)]" />
          </div>

          {/* Decorative dots */}
          <div className="absolute top-0 left-0 w-full h-full pattern-dots opacity-30 dark:opacity-10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-light)] border border-[var(--accent-muted)] text-[var(--accent)] text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Open Source Contributions
            </div>

            <h1 className="animate-fade-in-up text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--fg-primary)] tracking-tight leading-[1.1]">
              Contribute to Open Source
              <span className="gradient-text"> with AI Power</span>
            </h1>
            <p className="animate-fade-in-up-delay-1 mt-6 text-xl text-[var(--fg-tertiary)] leading-relaxed max-w-2xl mx-auto">
              Automatically discover projects matching your skills, generate
              high-quality code, and submit pull requests — all with AI assistance
              and your oversight.
            </p>
            <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                className="shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 hover:-translate-y-0.5 group min-w-[220px] text-base"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-w-[220px] text-base"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Social proof */}
            <div className="animate-fade-in-up-delay-3 mt-14 flex items-center justify-center gap-8 text-sm text-[var(--fg-muted)]">
              {stats.map((stat) => (
                <div
                  key={stat.value}
                  className="flex items-center gap-1.5 transition-colors duration-200 hover:text-[var(--fg-primary)]"
                >
                  <stat.icon className="w-4 h-4" />
                  <span>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — code preview card */}
          <div className="animate-fade-in-up-delay-4 mt-20 max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden glow-indigo">
              {/* Terminal chrome */}
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-2xl overflow-hidden shadow-[var(--shadow-lg)]">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-tertiary)]">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  <span className="ml-3 text-xs text-[var(--fg-muted)] font-mono">oss-contributor — analyze & contribute</span>
                </div>
                <div className="p-6 font-mono text-sm leading-relaxed">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-success)]">$</span>
                      <span className="text-[var(--fg-secondary)]">oss-contributor analyze --repo my-project</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent)]">✓</span>
                      <span className="text-[var(--fg-tertiary)]">Scanning 27 repositories...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent)]">✓</span>
                      <span className="text-[var(--fg-tertiary)]">Skill profile generated: TypeScript (92%), React (88%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-success)]">✓</span>
                      <span className="text-[var(--fg-secondary)]">Found 12 matching issues across 5 projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent)]">→</span>
                      <span className="text-[var(--accent)]">Ready to contribute! Select an issue to generate code.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--fg-primary)] mb-4">
              Everything you need to contribute
            </h2>
            <p className="text-[var(--fg-tertiary)] max-w-lg mx-auto text-lg">
              From skill discovery to merged pull requests, we handle the heavy lifting.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={feature.title}
                className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[var(--accent-muted)]"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div
                    className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[var(--fg-tertiary)] leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--fg-primary)] mb-4">
              How It Works
            </h2>
            <p className="text-[var(--fg-tertiary)] max-w-lg mx-auto text-lg">
              Four simple steps from sign-in to merged pull request.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <div
                key={item.step}
                className="animate-fade-in-up text-center group"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="relative inline-flex mb-5">
                  <div className="w-14 h-14 bg-[var(--accent)] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-[var(--accent)]/30 group-hover:-translate-y-0.5">
                    <item.icon className="w-6 h-6" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-4 h-px bg-[var(--border-strong)]" />
                  )}
                </div>
                <h3 className="font-semibold text-[var(--fg-primary)] mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--fg-tertiary)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Supported Languages", value: "15+", icon: Code },
              { label: "AI Models", value: "4 Providers", icon: Brain },
              { label: "Workflow Steps", value: "4-Step", icon: Layers },
              { label: "Always Free", value: "100%", icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)]">
                <stat.icon className="w-6 h-6 text-[var(--accent)] mx-auto mb-3" />
                <p className="text-2xl font-bold text-[var(--fg-primary)]">{stat.value}</p>
                <p className="text-sm text-[var(--fg-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="relative rounded-2xl bg-gradient-to-br from-[var(--accent)] via-indigo-600 to-purple-600 p-12 sm:p-16 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

            <h2 className="relative text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Contributing?
            </h2>
            <p className="relative text-indigo-100 mb-8 max-w-md mx-auto text-lg">
              Join developers using AI to make meaningful open
              source contributions.
            </p>
            <Button
              size="lg"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="relative bg-white text-[var(--accent)] hover:bg-indigo-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base min-w-[220px]"
            >
              <GitPullRequest className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-soft)] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-[var(--fg-muted)] text-sm">
          <p>
            Built with <span className="text-[var(--color-danger)]">♥</span> for the open source community
          </p>
        </div>
      </footer>
    </div>
  );
}
