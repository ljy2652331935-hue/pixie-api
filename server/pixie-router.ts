/**
 * Pixie API Router
 * ────────────────
 * 三个核心端点：suggestion / chat / autoContext
 * 支持 6 个人格 + 6 个模式的两层 prompt 组装系统
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

const suggestionModeSchema = z.enum(["icebreaker", "rewrite", "boundary", "plan"]);

// ─── Helper: call LLM and parse JSON ──────────────────────

async function callPixieLLM(systemPrompt: string, userMessage: string) {
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

  return JSON.parse(cleaned);
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

      const result = await callPixieLLM(systemPrompt, userMessage);

      return {
        detectedIntent: result.detectedIntent as string,
        emotionDetected: result.emotionDetected as string[],
        suggestedMessage: result.suggestedMessage as string,
        pixieComment: result.pixieComment as string,
        riskLevel: result.riskLevel as "low" | "medium" | "high",
        confidence: result.confidence as number,
      };
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

      const result = await callPixieLLM(systemPrompt, userMessage);

      return {
        privateAdvice: result.privateAdvice as string,
        suggestedMessage: (result.suggestedMessage ?? null) as string | null,
        safetyNote: (result.safetyNote ?? null) as string | null,
      };
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

      const result = await callPixieLLM(systemPrompt, userMessage);

      return {
        shouldSpeak: result.shouldSpeak as boolean,
        visibility: result.visibility as "private" | "public",
        triggerReason: result.triggerReason as string,
        pixieMessage: result.pixieMessage as string,
        suggestedAction: result.suggestedAction as "icebreaker" | "rewrite" | "boundary" | "plan" | "safety" | "none",
        riskLevel: result.riskLevel as "low" | "medium" | "high",
      };
    }),
});
