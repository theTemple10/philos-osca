import { describe, it, expect } from "vitest";
import { getDefaultProvider, AVAILABLE_MODELS } from "./providers";

describe("getDefaultProvider", () => {
  it("defaults to openai when no preference", () => {
    const config = getDefaultProvider();
    expect(config.provider).toBe("openai");
  });

  it("uses user provider when specified", () => {
    const config = getDefaultProvider("anthropic", "claude-sonnet-4-20250514");
    expect(config.provider).toBe("anthropic");
    expect(config.model).toBe("claude-sonnet-4-20250514");
  });

  it("handles null values", () => {
    const config = getDefaultProvider(null, null);
    expect(config.provider).toBe("openai");
    expect(config.model).toBeUndefined();
  });
});

describe("AVAILABLE_MODELS", () => {
  it("has openai models", () => {
    expect(AVAILABLE_MODELS.openai.length).toBeGreaterThan(0);
    expect(AVAILABLE_MODELS.openai[0].id).toBe("gpt-4o");
  });

  it("has anthropic models", () => {
    expect(AVAILABLE_MODELS.anthropic.length).toBeGreaterThan(0);
  });

  it("each model has required fields", () => {
    for (const provider of ["openai", "anthropic"] as const) {
      for (const model of AVAILABLE_MODELS[provider]) {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(model.description).toBeTruthy();
      }
    }
  });
});
