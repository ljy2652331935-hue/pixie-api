import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("pixie.suggestion", () => {
  it("returns structured suggestion response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pixie.suggestion({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      rawMessage: "我想约她看电影，但不想尴尬。",
      mode: "icebreaker",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "今晚有人想看电影吗？" },
      ],
    });

    expect(result).toHaveProperty("detectedIntent");
    expect(result).toHaveProperty("emotionDetected");
    expect(result).toHaveProperty("suggestedMessage");
    expect(result).toHaveProperty("pixieComment");
    expect(result).toHaveProperty("riskLevel");
    expect(result).toHaveProperty("confidence");
    expect(Array.isArray(result.emotionDetected)).toBe(true);
    expect(["low", "medium", "high"]).toContain(result.riskLevel);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  }, 30000);
});

describe("pixie.chat", () => {
  it("returns structured chat response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pixie.chat({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      privateQuestion: "她说想去 Waterloo 看电影，我是不是该主动定时间？",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "那我们去 Waterloo 那边的影院？" },
      ],
    });

    expect(result).toHaveProperty("privateAdvice");
    expect(typeof result.privateAdvice).toBe("string");
    expect(result.privateAdvice.length).toBeGreaterThan(0);
    // suggestedMessage and safetyNote can be null
    expect(result).toHaveProperty("suggestedMessage");
    expect(result).toHaveProperty("safetyNote");
  }, 30000);
});

describe("pixie.autoContext", () => {
  it("returns structured auto context response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pixie.autoContext({
      roomId: "test-room",
      userId: "testUser",
      pixieId: "lumi",
      chatContext: [
        { senderName: "Alice", senderType: "human", content: "今晚有人想看电影吗？" },
        { senderName: "JiaYi", senderType: "human", content: "我也想看！" },
        { senderName: "Alice", senderType: "human", content: "轻松一点的吧，不要恐怖片" },
      ],
      activityIntent: {
        activity: "watch a movie",
        area: "Waterloo",
        time: "tonight",
      },
    });

    expect(result).toHaveProperty("shouldSpeak");
    expect(result).toHaveProperty("visibility");
    expect(result).toHaveProperty("triggerReason");
    expect(result).toHaveProperty("pixieMessage");
    expect(result).toHaveProperty("suggestedAction");
    expect(result).toHaveProperty("riskLevel");
    expect(typeof result.shouldSpeak).toBe("boolean");
    expect(["private", "public"]).toContain(result.visibility);
    expect(["icebreaker", "rewrite", "boundary", "plan", "safety", "none"]).toContain(result.suggestedAction);
    expect(["low", "medium", "high"]).toContain(result.riskLevel);
  }, 30000);
});
