"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MODELS, AIProvider } from "@/lib/ai/providers";
import { Settings, Save, Brain, Shield, Eye, EyeOff, CheckCircle, Sun, Moon, Monitor, GitBranch, Download, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/providers/theme-provider";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [aiProvider, setAiProvider] = useState<AIProvider>("openai");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [difficulty, setDifficulty] = useState("adaptive");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.aiProvider) setAiProvider(data.aiProvider);
      if (data.aiModel) setAiModel(data.aiModel);
      if (data.difficulty) setDifficulty(data.difficulty);
      if (data.hasApiKey) setHasApiKey(true);
      if (data.githubConnected !== undefined) setGithubConnected(data.githubConnected);
      if (data.githubLogin) setGithubLogin(data.githubLogin);
    } catch {
      // use defaults
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/user/data");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oss-contributor-data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("success", "Data exported successfully!");
    } catch {
      addToast("error", "Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE_MY_DATA") {
      addToast("warning", 'Please type DELETE_MY_DATA to confirm deletion.');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/user/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_MY_DATA" }),
      });
      if (!res.ok) throw new Error("Delete failed");
      addToast("success", "Account deleted. Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      addToast("error", "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
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

  function validateApiKey(key: string, provider: string): string | null {
    if (!key) return null; // empty is fine (means use env var)
    const prefixes: Record<string, string[]> = {
      openai: ["sk-"],
      anthropic: ["sk-ant-"],
      groq: ["gsk_"],
      openrouter: ["sk-or-"],
    };
    const expected = prefixes[provider];
    if (expected && !expected.some((p) => key.startsWith(p))) {
      return `API key should start with "${expected[0]}" for ${provider}. You entered a key that looks like it might be for a different provider.`;
    }
    return null;
  }

  async function handleSave() {
    // Validate API key format
    if (aiApiKey) {
      const validationError = validateApiKey(aiApiKey, aiProvider);
      if (validationError) {
        addToast("warning", validationError);
        return;
      }
    }

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
        <h1 className="text-2xl font-bold text-[var(--fg-primary)]">Settings</h1>
        <p className="text-[var(--fg-tertiary)] mt-1">
          Configure your AI provider and contribution preferences.
        </p>
      </div>

      {/* Theme Preference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Appearance</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light" as const, label: "Light", icon: Sun },
              { value: "dark" as const, label: "Dark", icon: Moon },
              { value: "system" as const, label: "System", icon: Monitor },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                role="radio"
                aria-checked={theme === option.value}
                aria-label={`${option.label} theme`}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                  theme === option.value
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--border-soft)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)]"
                }`}
              >
                <option.icon className={`w-5 h-5 ${theme === option.value ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"}`} />
                <div>
                  <span className="font-medium text-[var(--fg-primary)]">{option.label}</span>
                  {theme === option.value && (
                    <Badge variant="success" className="ml-2">Active</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--fg-primary)]">AI Provider</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--fg-secondary)] mb-2">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["openai", "anthropic", "groq", "openrouter"] as AIProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => {
                    setAiProvider(provider);
                    setAiModel(AVAILABLE_MODELS[provider][0].id);
                  }}
                  role="radio"
                  aria-checked={aiProvider === provider}
                  aria-label={`Select ${provider} provider`}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    aiProvider === provider
                      ? "border-[var(--accent)] bg-[var(--accent-light)]"
                      : "border-[var(--border-soft)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize text-[var(--fg-primary)]">{provider}</span>
                    {aiProvider === provider && (
                      <Badge variant="success">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--fg-muted)] mt-1">
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
            <label className="block text-sm font-medium text-[var(--fg-secondary)] mb-2">
              Model
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS[aiProvider].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setAiModel(model.id)}
                  role="radio"
                  aria-checked={aiModel === model.id}
                  aria-label={`Select ${model.name} model`}
                  className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                    aiModel === model.id
                      ? "border-[var(--accent)] bg-[var(--accent-light)]"
                      : "border-[var(--border-soft)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--fg-primary)]">{model.name}</span>
                    {aiModel === model.id && (
                      <Badge variant="success">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--fg-muted)]">{model.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--fg-secondary)] mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={hasApiKey ? "••••••••••••••••••••••••" : `Enter your ${aiProvider} API key`}
                className="w-full px-4 py-3 pr-12 border border-[var(--border-strong)] rounded-lg bg-[var(--bg-input)] text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              {hasApiKey ? (
                <span className="flex items-center gap-1 text-[var(--color-success)]">
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
            <div className="p-4 bg-[var(--color-success-bg)] rounded-lg border border-[var(--color-success-border)]">
              <p className="text-sm font-medium text-[var(--color-success)]">
                {aiProvider === "groq" ? "Groq Free Tier" : "OpenRouter"}
              </p>
              <p className="text-sm text-[var(--fg-tertiary)] mt-1">
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
            <Settings className="w-5 h-5 text-[var(--fg-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Difficulty Level</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
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
                role="radio"
                aria-checked={difficulty === option.value}
                aria-label={`Select ${option.label} difficulty`}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  difficulty === option.value
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--border-soft)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--fg-primary)]">{option.label}</span>
                  {difficulty === option.value && (
                    <Badge variant="success">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--fg-muted)] mt-1">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GitHub Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[var(--fg-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--fg-primary)]">GitHub Connection</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${githubConnected ? "bg-[var(--color-success)]" : "bg-[var(--fg-muted)]"}`} />
              <div>
                <p className="font-medium text-[var(--fg-primary)]">
                  {githubConnected ? `Connected as @${githubLogin}` : "Not connected"}
                </p>
                <p className="text-sm text-[var(--fg-muted)]">
                  {githubConnected
                    ? "Your GitHub account is linked for repository access and PR submission."
                    : "Sign in with GitHub to connect your account."}
                </p>
              </div>
            </div>
            {githubConnected ? (
              <a href="https://github.com/settings/connections" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Manage
                </Button>
              </a>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--color-success)]" />
            <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Privacy & Data</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-[var(--fg-primary)]">Analyze Repositories</p>
              <p className="text-sm text-[var(--fg-muted)]">
                Allow AI to read your public repositories for skill analysis
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              id="analyze-repos"
              aria-label="Allow AI to analyze repositories"
              className="w-5 h-5 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] bg-[var(--bg-input)]"
            />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[var(--border-soft)]">
            <div>
              <p className="font-medium text-[var(--fg-primary)]">Store Skill Profile</p>
              <p className="text-sm text-[var(--fg-muted)]">
                Save your skill profile for faster recommendations
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              id="store-profile"
              aria-label="Store skill profile"
              className="w-5 h-5 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] bg-[var(--bg-input)]"
            />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[var(--border-soft)]">
            <div>
              <p className="font-medium text-[var(--fg-primary)]">Auto-Submit PRs</p>
              <p className="text-sm text-[var(--fg-muted)]">
                Skip review step for simple changes (not recommended)
              </p>
            </div>
            <input
              type="checkbox"
              id="auto-submit"
              aria-label="Auto-submit pull requests"
              className="w-5 h-5 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] bg-[var(--bg-input)]"
            />
          </div>

          <div className="pt-4 border-t border-[var(--border-soft)] space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--fg-primary)]">Export Your Data</p>
                <p className="text-sm text-[var(--fg-muted)]">
                  Download all your data as a JSON file
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting}>
                <Download className="w-4 h-4 mr-1" />
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </div>

            {/* Delete Account */}
            <div className="p-4 bg-[var(--color-danger-bg)] rounded-lg border border-[var(--color-danger-border)]">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-[var(--color-danger)] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-[var(--color-danger)]">Delete Account</p>
                  <p className="text-sm text-[var(--fg-muted)] mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="Type DELETE_MY_DATA"
                      aria-label="Type DELETE_MY_DATA to confirm deletion"
                      className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-[var(--color-danger-border)] rounded bg-[var(--bg-input)] text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirm !== "DELETE_MY_DATA"}
                      className="border-[var(--color-danger-border)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                    >
                      {deleting ? "Deleting..." : "Delete Account"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
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
