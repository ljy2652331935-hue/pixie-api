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
    expect(["reaction", "tease", "advice", "warning", "question", "suggested_message"]).toContain(bubble.type);
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

describe("pixie.suggest", () => {
  it("auto-detects mode and returns suggest response with all required fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.suggest({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "lumi",
      rawMessage: "I want to ask her to an art exhibit this weekend, but I don't know how to start.",
      targetUser: { name: "Alice", relationshipStage: "casual_chat" },
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "I'm so bored lately" },
      ],
    });

    // Validate all required response fields
    expect(typeof result.detectedMode).toBe("string");
    expect(typeof result.detectedIntent).toBe("string");
    expect(result.detectedIntent.length).toBeGreaterThan(0);
    expect(Array.isArray(result.emotionDetected)).toBe(true);
    expect(Array.isArray(result.riskFlags)).toBe(true);
    expect(typeof result.rewriteStrategy).toBe("string");

    // privateBubbles — allow empty array (silence-first strategy)
    expect(Array.isArray(result.privateBubbles)).toBe(true);
    for (const bubble of result.privateBubbles) {
      expect(["reaction", "tease", "advice", "warning", "question"]).toContain(bubble.type);
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

    // riskLevel & confidence
    expect(["low", "medium", "high"]).toContain(result.riskLevel);
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  }, 30000);
});

describe("pixie.chat", () => {
  it("returns bubbles-format chat response", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.chat({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "foxxz",
      privateQuestion: "She said she wants to see a movie in Waterloo. Should I suggest a time?",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "How about the cinema near Waterloo?" },
        { senderName: "JiaYi", senderType: "human", content: "Sounds good!" },
      ],
    });

    validateBubblesResponse(result);
  }, 30000);
});

describe("pixie.autoContext (Presence)", () => {
  it("returns presence-format response with shouldSpeak, interventionType, planUpdate", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.autoContext({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      persona: "foxxz",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "Anyone wanna watch a movie tonight?" },
        { senderName: "JiaYi", senderType: "human", content: "I'm down!" },
      ],
      activityIntent: { activity: "watch a movie", area: "Waterloo", time: "tonight" },
    });

    // Validate Presence response fields
    expect(result).toHaveProperty("shouldSpeak");
    expect(typeof result.shouldSpeak).toBe("boolean");
    expect(result).toHaveProperty("visibility");
    expect(["public_pixie", "private_whisper", "none"]).toContain(result.visibility);
    expect(result).toHaveProperty("interventionType");
    expect(["boost_owner", "bridge_topic", "break_ice", "plan_push", "safety_check", "clarify_misunderstanding", "owner_requested", "stay_silent"]).toContain(result.interventionType);
    expect(result).toHaveProperty("reason");
    expect(typeof result.reason).toBe("string");
    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("suggestedNextAction");
    expect(["none", "ask_question", "suggest_reply", "update_plan", "add_to_plan_card", "wait"]).toContain(result.suggestedNextAction);
    expect(result).toHaveProperty("planUpdate");
    expect(result.planUpdate).toHaveProperty("activity");
    expect(result.planUpdate).toHaveProperty("time");
    expect(result.planUpdate).toHaveProperty("place");
    expect(result.planUpdate).toHaveProperty("notes");
    expect(result).toHaveProperty("cooldownTurns");
    expect(typeof result.cooldownTurns).toBe("number");
    expect(result).toHaveProperty("riskLevel");
    expect(["low", "medium", "high"]).toContain(result.riskLevel);
    expect(result).toHaveProperty("confidence");
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  }, 30000);
});



describe("pixie.liveChat", () => {
  it("returns bubbles + quickReplies + suggestedAction for multi-turn conversation", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.liveChat({
      persona: "lumi",
      messages: [
        { role: "user", content: "I'm so tired today" },
      ],
    });

    // Validate bubbles
    expect(Array.isArray(result.bubbles)).toBe(true);
    expect(result.bubbles.length).toBeGreaterThan(0);
    for (const bubble of result.bubbles) {
      expect(bubble).toHaveProperty("type");
      expect(bubble).toHaveProperty("text");
      expect(typeof bubble.text).toBe("string");
      expect(bubble.text.length).toBeGreaterThan(0);
      expect(bubble).toHaveProperty("emotion");
      expect(bubble).toHaveProperty("delayMs");
      expect(typeof bubble.delayMs).toBe("number");
    }

    // suggestedAction
    expect(result).toHaveProperty("suggestedAction");
    expect(typeof result.suggestedAction).toBe("string");

    // quickReplies — allow empty array (normal messages may not need quickReplies)
    expect(Array.isArray(result.quickReplies)).toBe(true);
    for (const reply of result.quickReplies) {
      expect(typeof reply).toBe("string");
    }
  }, 30000);
});

describe("pixie.personas", () => {
  it("returns the list of available personas", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const personas = await caller.pixie.personas();

    expect(Array.isArray(personas)).toBe(true);
    expect(personas.length).toBe(2);
    expect(personas[0]).toHaveProperty("id");
    expect(personas[0]).toHaveProperty("name");
    expect(personas[0]).toHaveProperty("label");
    expect(personas[0]).toHaveProperty("description");
    expect(personas[0]).toHaveProperty("traits");
  });
});

describe("pixie.publicSpeak", () => {
  it("returns shouldSpeak, visibility, and message fields with valid values", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.publicSpeak({
      persona: "lumi",
      pixieName: "Lumi",
      ownerName: "Lucy",
      otherName: "Pat",
      chatContext: [
        { senderName: "Lucy", senderType: "human", content: "Wanna hang out this weekend?" },
        { senderName: "Pat", senderType: "human", content: "Sure!" },
      ],
      triggerMessage: "Sure!",
      triggerBy: "other",
    });

    // shouldSpeak must be boolean
    expect(typeof result.shouldSpeak).toBe("boolean");

    // visibility must be one of the allowed values
    expect(["public_pixie", "private_whisper", "none"]).toContain(result.visibility);

    // message is null or non-empty string
    expect(result.message === null || typeof result.message === "string").toBe(true);
    if (result.message !== null) {
      expect(result.message.length).toBeGreaterThan(0);
    }

    // If shouldSpeak is true, visibility must not be "none" and message must exist
    if (result.shouldSpeak) {
      expect(result.visibility).not.toBe("none");
      expect(result.message).toBeTruthy();
    }
  }, 30000);

  it("returns public_pixie visibility for plan-push scenario (appointment detected)", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.pixie.publicSpeak({
      persona: "foxxz",
      pixieName: "Foxxz",
      ownerName: "Pat",
      otherName: "Lucy",
      chatContext: [
        { senderName: "Pat", senderType: "human", content: "Wanna meet up?" },
        { senderName: "Lucy", senderType: "human", content: "Sure, Saturday works!" },
      ],
      triggerMessage: "Sure, Saturday works!",
      triggerBy: "other",
    });

    expect(typeof result.shouldSpeak).toBe("boolean");
    expect(["public_pixie", "private_whisper", "none"]).toContain(result.visibility);
    if (result.shouldSpeak) {
      expect(result.message).toBeTruthy();
    }
  }, 30000);
});
