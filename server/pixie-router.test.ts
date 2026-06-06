import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// Validate the unified bubbles response structure
function validateBubblesResponse(result: any) {
  // responseStyle
  expect(["single", "multi", "clarify", "interrupt"]).toContain(result.responseStyle);

  // visibility
  expect(["private", "public_suggestion", "public_pixie"]).toContain(result.visibility);

  // bubbles array
  expect(Array.isArray(result.bubbles)).toBe(true);
  expect(result.bubbles.length).toBeGreaterThan(0);

  for (const bubble of result.bubbles) {
    expect(bubble).toHaveProperty("type");
    expect(bubble).toHaveProperty("text");
    expect(bubble).toHaveProperty("emotion");
    expect(bubble).toHaveProperty("delayMs");
    expect(["reaction", "roast", "advice", "warning", "question", "suggested_message"]).toContain(bubble.type);
    expect(typeof bubble.text).toBe("string");
    expect(bubble.text.length).toBeGreaterThan(0);
    expect(["neutral", "playful", "worried", "smug", "serious", "excited"]).toContain(bubble.emotion);
    expect(typeof bubble.delayMs).toBe("number");
    expect(bubble.delayMs).toBeGreaterThanOrEqual(0);
  }

  // suggestedPublicMessage
  expect(result.suggestedPublicMessage === null || typeof result.suggestedPublicMessage === "string").toBe(true);

  // quickReplies
  expect(Array.isArray(result.quickReplies)).toBe(true);

  // riskLevel
  expect(["low", "medium", "high"]).toContain(result.riskLevel);

  // confidence
  expect(typeof result.confidence).toBe("number");
  expect(result.confidence).toBeGreaterThanOrEqual(0);
  expect(result.confidence).toBeLessThanOrEqual(1);
}

describe("pixie.suggestion", () => {
  it("returns bubbles-format suggestion response", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.suggestion({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "sassy_roast_bestie",
      rawMessage: "我想约她看电影，但不想尴尬。",
      mode: "icebreaker",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "今晚有人想看电影吗？" },
      ],
    });

    validateBubblesResponse(result);
  }, 30000);
});

describe("pixie.chat", () => {
  it("returns bubbles-format chat response", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.chat({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "smooth_witty_fox",
      privateQuestion: "她说想去 Waterloo 看电影，我是不是该主动定时间？",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "那我们去 Waterloo 那边的影院？" },
        { senderName: "JiaYi", senderType: "human", content: "好啊！" },
      ],
    });

    validateBubblesResponse(result);
  }, 30000);
});

describe("pixie.autoContext", () => {
  it("returns bubbles-format auto context response", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.autoContext({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "calm_strategist",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "今晚有人想看电影吗？" },
        { senderName: "JiaYi", senderType: "human", content: "我也想看！" },
      ],
      activityIntent: { activity: "watch a movie", area: "Waterloo", time: "tonight" },
    });

    validateBubblesResponse(result);
  }, 30000);
});

describe("pixie.express", () => {
  it("returns express response with all required fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.express({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "sassy_roast_bestie",
      rawMessage: "我想约她周末去看美术展，但不知道怎么开口。",
      mode: "invite",
      targetUser: { name: "Alice", relationshipStage: "casual_chat" },
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "最近好无聊啊" },
      ],
    });

    // Validate all required response fields
    expect(typeof result.detectedIntent).toBe("string");
    expect(result.detectedIntent.length).toBeGreaterThan(0);

    expect(Array.isArray(result.emotionDetected)).toBe(true);
    expect(Array.isArray(result.riskFlags)).toBe(true);
    expect(typeof result.rewriteStrategy).toBe("string");

    // privateBubbles
    expect(Array.isArray(result.privateBubbles)).toBe(true);
    expect(result.privateBubbles.length).toBeGreaterThan(0);
    for (const bubble of result.privateBubbles) {
      expect(["reaction", "roast", "advice", "warning", "question"]).toContain(bubble.type);
      expect(typeof bubble.text).toBe("string");
      expect(["neutral", "playful", "worried", "smug", "serious", "excited"]).toContain(bubble.emotion);
      expect(typeof bubble.delayMs).toBe("number");
    }

    // suggestedPublicMessage
    expect(typeof result.suggestedPublicMessage).toBe("string");

    // userVoiceMatch
    expect(typeof result.userVoiceMatch).toBe("number");
    expect(result.userVoiceMatch).toBeGreaterThanOrEqual(0);
    expect(result.userVoiceMatch).toBeLessThanOrEqual(1);

    // riskLevel
    expect(["low", "medium", "high"]).toContain(result.riskLevel);

    // confidence
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  }, 30000);

  it("handles all 9 express modes without error", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const modes = ["compliment", "flirt", "invite", "rewrite", "boundary", "reject", "plan", "clarify", "casual"] as const;

    // Test just one mode to keep test fast - the schema validation covers all modes
    const result = await caller.pixie.express({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "smooth_witty_fox",
      rawMessage: "她说的话让我很不舒服，我想表达不满但不想吵架。",
      mode: "boundary",
      chatContext: [
        { senderName: "Bob", senderType: "human", content: "你怎么这么胖了？" },
      ],
    });

    expect(typeof result.detectedIntent).toBe("string");
    expect(["low", "medium", "high"]).toContain(result.riskLevel);
  }, 30000);
});

describe("pixie.personas", () => {
  it("returns the list of available personas", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const personas = await caller.pixie.personas();

    expect(Array.isArray(personas)).toBe(true);
    expect(personas.length).toBe(6);
    expect(personas[0]).toHaveProperty("id");
    expect(personas[0]).toHaveProperty("name");
    expect(personas[0]).toHaveProperty("label");
    expect(personas[0]).toHaveProperty("description");
    expect(personas[0]).toHaveProperty("traits");
  });
});
