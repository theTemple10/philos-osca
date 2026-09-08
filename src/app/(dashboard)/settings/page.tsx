"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MODELS, AIProvider } from "@/lib/ai/providers";
import { Settings, Save, Brain, Shield, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [aiProvider, setAiProvider] = useState<AIProvider>("openai");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [difficulty, setDifficulty] = useState("adaptive");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.aiProvider) setAiProvider(data.aiProvider);
      if (data.aiModel) setAiModel(data.aiModel);
      if (data.difficulty) setDifficulty(data.difficulty);
      if (data.hasApiKey) setHasApiKey(true);
    } catch {
      // use defaults
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      startTransition(() => {
        fetchSettings();
      });
    }
  }, [status]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProvider, aiModel, aiApiKey: aiApiKey || undefined, difficulty }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      if (aiApiKey) setHasApiKey(true);
      addToast("success", "Settings saved successfully!");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
      addToast("error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your AI provider and contribution preferences.
        </p>
      </div>

      {/* AI Provider Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">AI Provider</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(["openai", "anthropic", "groq", "openrouter"] as AIProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => {
                    setAiProvider(provider);
                    setAiModel(AVAILABLE_MODELS[provider][0].id);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    aiProvider === provider
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{provider}</span>
                    {aiProvider === provider && (
                      <Badge variant="success">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {provider === "openai" && "GPT-4o, GPT-4o Mini, o3-mini"}
                    {provider === "anthropic" && "Claude Sonnet 4, Claude 3.5 Haiku"}
                    {provider === "groq" && "Llama 3.3 70B (Free tier)"}
                    {provider === "openrouter" && "Multi-provider aggregator"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS[aiProvider].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setAiModel(model.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    aiModel === model.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{model.name}</span>
                    {aiModel === model.id && (
                      <Badge variant="success">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{model.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={hasApiKey ? "••••••••••••••••••••••••" : `Enter your ${aiProvider} API key`}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {hasApiKey ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  API key is saved. Enter a new key to update.
                </span>
              ) : (
                "Your API key is stored securely and never shared."
              )}
            </p>
          </div>

          {/* Free Provider Info */}
          {(aiProvider === "groq" || aiProvider === "openrouter") && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                {aiProvider === "groq" ? "Groq Free Tier" : "OpenRouter"}
              </p>
              <p className="text-sm text-green-700 mt-1">
                {aiProvider === "groq"
                  ? "Groq offers a generous free tier with fast inference. Get your API key at console.groq.com"
                  : "OpenRouter provides access to multiple providers. Some models have free tiers."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Difficulty Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Difficulty Level</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                value: "beginner",
                label: "Beginner",
                description: "Easy issues, guided workflow",
              },
              {
                value: "intermediate",
                label: "Intermediate",
                description: "Moderate complexity issues",
              },
              {
                value: "advanced",
                label: "Advanced",
                description: "Complex features and bugs",
              },
              {
                value: "adaptive",
                label: "Adaptive",
                description: "AI adjusts based on your profile",
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDifficulty(option.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  difficulty === option.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.label}</span>
                  {difficulty === option.value && (
                    <Badge variant="success">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Privacy & Data</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Analyze Repositories</p>
              <p className="text-sm text-gray-500">
                Allow AI to read your public repositories for skill analysis
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Store Skill Profile</p>
              <p className="text-sm text-gray-500">
                Save your skill profile for faster recommendations
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Submit PRs</p>
              <p className="text-sm text-gray-500">
                Skip review step for simple changes (not recommended)
              </p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : saved ? (
            <>
              <span className="mr-2">✓</span>
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}