/**
 * Pixie API Router — Conversation Realism Edition
 * ─────────────────────────────────────────────────
 * 三个核心端点：suggestion / chat / autoContext
 * 统一输出 bubbles 格式，支持逐条气泡渲染
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  assembleSuggestionPrompt,
  assembleChatPrompt,
  assembleAutoContextPrompt,
  PERSONA_LIST,
  type PersonaId,
  type ModeId,
} from "./pixie-prompts";

// ─── Shared schemas ────────────────────────────────────────

const chatMessageSchema = z.object({
  senderName: z.string(),
  senderType: z.enum(["human", "pixie", "system"]),
  content: z.string(),
});

const activityIntentSchema = z.object({
  activity: z.string(),
  area: z.string(),
  time: z.string(),
});

const personaSchema = z.enum([
  "sassy_roast_bestie",
  "smooth_witty_fox",
  "elegant_gentleman",
  "loyal_bro",
  "soft_social_anxiety_helper",
  "calm_strategist",
]);

const suggestionModeSchema = z.enum(["icebreaker", "rewrite", "boundary", "plan", "whisper", "offline_profile"]);

// ─── Bubbles response type ───────────────────────────────────

interface BubbleItem {
  type: "reaction" | "roast" | "advice" | "warning" | "question" | "suggested_message";
  text: string;
  emotion: "neutral" | "playful" | "worried" | "smug" | "serious" | "excited";
  delayMs: number;
}

interface BubblesResponse {
  responseStyle: "single" | "multi" | "clarify" | "interrupt";
  visibility: "private" | "public_suggestion" | "public_pixie";
  bubbles: BubbleItem[];
  suggestedPublicMessage: string | null;
  quickReplies: string[];
  riskLevel: "low" | "medium" | "high";
  confidence: number;
}

// ─── Helper: call LLM and parse JSON ──────────────────────

async function callPixieLLM(systemPrompt: string, userMessage: string): Promise<BubblesResponse> {
  const result = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 2048,
  });

  const raw = result.choices[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    throw new Error("LLM returned empty content");
  }

  // Strip markdown code block wrapper if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);

  // Normalize and validate the response
  return {
    responseStyle: parsed.responseStyle ?? "single",
    visibility: parsed.visibility ?? "private",
    bubbles: Array.isArray(parsed.bubbles) ? parsed.bubbles.map((b: any) => ({
      type: b.type ?? "advice",
      text: b.text ?? "",
      emotion: b.emotion ?? "neutral",
      delayMs: typeof b.delayMs === "number" ? b.delayMs : 0,
    })) : [],
    suggestedPublicMessage: parsed.suggestedPublicMessage ?? null,
    quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies : [],
    riskLevel: parsed.riskLevel ?? "low",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
  };
}

// ─── Build user messages ──────────────────────────────────

function buildSuggestionUserMessage(
  rawMessage: string,
  mode: string,
  chatContext: Array<{ senderName: string; content: string }>
) {
  let context = "";
  if (chatContext.length > 0) {
    context = "\n## 当前聊天上下文\n" + chatContext.map(m => `- ${m.senderName}: ${m.content}`).join("\n");
  }
  return `## 模式\n${mode}\n\n## 用户原始输入\n${rawMessage}${context}\n\n请分析用户意图并给出建议。`;
}

function buildChatUserMessage(
  privateQuestion: string,
  chatContext: Array<{ senderName: string; content: string }>
) {
  let context = "";
  if (chatContext.length > 0) {
    context = "\n## 当前公开聊天上下文\n" + chatContext.map(m => `- ${m.senderName}: ${m.content}`).join("\n");
  }
  return `## 用户私下问你的问题\n${privateQuestion}${context}\n\n请给出你的建议。`;
}

function buildAutoContextUserMessage(
  chatContext: Array<{ senderName: string; content: string }>,
  activityIntent?: { activity: string; area: string; time: string }
) {
  let context = "## 当前聊天上下文\n";
  if (chatContext.length > 0) {
    context += chatContext.map(m => `- ${m.senderName}: ${m.content}`).join("\n");
  } else {
    context += "（暂无聊天记录，双方刚匹配）";
  }

  let intent = "";
  if (activityIntent) {
    intent = `\n\n## 活动意图\n- 活动: ${activityIntent.activity}\n- 区域: ${activityIntent.area}\n- 时间: ${activityIntent.time}`;
  }

  return `${context}${intent}\n\n请分析当前聊天状态，判断是否需要发言以及如何发言。`;
}

// ─── Router ───────────────────────────────────────────────

export const pixieRouter = router({
  // Get available personas list
  personas: publicProcedure.query(() => {
    return PERSONA_LIST;
  }),

  suggestion: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        userId: z.string(),
        pixieId: z.string().default("lumi"),
        persona: personaSchema.default("sassy_roast_bestie"),
        rawMessage: z.string(),
        mode: suggestionModeSchema,
        chatContext: z.array(chatMessageSchema).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = assembleSuggestionPrompt(
        input.persona as PersonaId,
        input.mode as ModeId
      );

      const userMessage = buildSuggestionUserMessage(
        input.rawMessage,
        input.mode,
        input.chatContext
      );

      return await callPixieLLM(systemPrompt, userMessage);
    }),

  chat: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        userId: z.string(),
        pixieId: z.string().default("lumi"),
        persona: personaSchema.default("sassy_roast_bestie"),
        privateQuestion: z.string(),
        chatContext: z.array(chatMessageSchema).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = assembleChatPrompt(input.persona as PersonaId);

      const userMessage = buildChatUserMessage(
        input.privateQuestion,
        input.chatContext
      );

      return await callPixieLLM(systemPrompt, userMessage);
    }),

  autoContext: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        userId: z.string(),
        pixieId: z.string().default("lumi"),
        persona: personaSchema.default("sassy_roast_bestie"),
        chatContext: z.array(chatMessageSchema).default([]),
        activityIntent: activityIntentSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = assembleAutoContextPrompt(input.persona as PersonaId);

      const userMessage = buildAutoContextUserMessage(
        input.chatContext,
        input.activityIntent
      );

      return await callPixieLLM(systemPrompt, userMessage);
    }),
});
