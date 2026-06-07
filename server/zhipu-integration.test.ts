/**
 * Validates that the ZHIPU_API_KEY is set and that invokeLLM correctly
 * routes to the Zhipu AI endpoint using glm-4.5.
 */
import { describe, it, expect } from "vitest";
import { invokeLLM } from "./_core/llm";

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;

describe("Zhipu AI integration", () => {
  it("ZHIPU_API_KEY is set and non-empty", () => {
    expect(ZHIPU_API_KEY).toBeTruthy();
    expect(typeof ZHIPU_API_KEY).toBe("string");
    expect((ZHIPU_API_KEY as string).length).toBeGreaterThan(10);
  });

  it("invokeLLM routes to Zhipu and returns a valid response", async () => {
    if (!ZHIPU_API_KEY) {
      console.warn("Skipping — ZHIPU_API_KEY not set");
      return;
    }

    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a helpful assistant. Reply in exactly one word." },
        { role: "user", content: "Say hello." },
      ],
    });

    expect(result).toBeDefined();
    expect(result.choices).toBeDefined();
    expect(result.choices.length).toBeGreaterThan(0);

    const content = result.choices[0].message.content;
    expect(content).toBeTruthy();

    // Model should be a GLM model
    expect(result.model).toMatch(/glm/i);
  }, 20_000);
});
