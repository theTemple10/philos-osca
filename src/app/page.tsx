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
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Skill Analysis",
    description:
      "Our AI analyzes your GitHub repositories to understand your strengths and suggest the perfect contribution opportunities.",
    color: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    icon: Target,
    title: "Find Perfect Issues",
    description:
      "Discover open source issues that match your expertise level, from beginner-friendly to advanced challenges.",
    color: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Sparkles,
    title: "AI Code Generation",
    description:
      "Get production-ready code suggestions that follow best practices and project conventions, ready for review.",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

const steps = [
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
];

const stats = [
    { value: "AI-Powered", icon: Zap },
    { value: "Open Source", icon: GitPullRequest },
    { value: "Secure", icon: Shield },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200 transition-transform duration-200 hover:scale-105">
                <GitPullRequest className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">
                OSS Contributor
              </span>
            </div>
            <Button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-100 hover:-translate-y-0.5"
            >
              <GitPullRequest className="w-4 h-4 mr-2" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Open Source Contributions
          </div>

          <h1 className="animate-fade-in-up text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
            Contribute to Open Source
            <span className="gradient-text"> with AI Power</span>
          </h1>
          <p className="animate-fade-in-up-delay-1 mt-6 text-xl text-gray-600 leading-relaxed">
            Automatically discover projects matching your skills, generate
            high-quality code, and submit pull requests — all with AI assistance
            and your oversight.
          </p>
          <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="shadow-lg shadow-indigo-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-200/60 hover:-translate-y-0.5 group min-w-[200px]"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                window.open(
                  "https://www.loom.com/embed/YOUR_LOOM_VIDEO_ID",
                  "_blank"
                )
              }
              className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-[200px]"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Social proof / stats strip */}
          <div className="animate-fade-in-up-delay-3 mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            {stats.map((stat) => (
              <div
                key={stat.value}
                className="flex items-center gap-1.5 transition-colors duration-200 hover:text-gray-700"
              >
                <stat.icon className="w-4 h-4" />
                <span>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className={`animate-fade-in-up group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-100`}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <div
                  className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <feature.icon
                    className={`w-6 h-6 ${feature.iconColor}`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-28">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-lg mx-auto">
            Four simple steps from sign-in to merged pull request.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <div
                key={item.step}
                className="animate-fade-in-up text-center group"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="relative inline-flex mb-5">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-200 group-hover:-translate-y-0.5">
                    {item.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-4 h-px bg-gray-300" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-28 animate-fade-in-up">
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-12 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

            <h2 className="relative text-3xl font-bold text-white mb-4">
              Ready to Start Contributing?
            </h2>
            <p className="relative text-indigo-100 mb-8 max-w-md mx-auto">
              Join the community of developers using AI to make meaningful open
              source contributions.
            </p>
            <Button
              size="lg"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="relative bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <GitPullRequest className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>
            Built with love for the open source community
          </p>
        </div>
      </footer>
    </div>
  );
}
