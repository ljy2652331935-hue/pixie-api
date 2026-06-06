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
  assembleExpressPrompt,
  assembleSuggestPrompt,
  PERSONA_LIST,
  type PersonaId,
  type ModeId,
  type ExpressModeId,
  type SuggestDetectedMode,
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

const expressModeSchema = z.enum(["compliment", "flirt", "invite", "rewrite", "boundary", "reject", "plan", "clarify", "casual"]);

const targetUserSchema = z.object({
  name: z.string(),
  relationshipStage: z.enum(["new_match", "casual_chat", "friend", "dating_interest", "unknown"]).default("unknown"),
});

const userVoiceProfileSchema = z.object({
  tone: z.array(z.string()).default(["warm", "expressive"]),
  messageLength: z.enum(["short", "medium", "long"]).default("short"),
  formality: z.enum(["casual", "semi_casual", "formal"]).default("casual"),
  humorStyle: z.string().default("light teasing, self-aware"),
  commonPhrases: z.array(z.string()).default([]),
  avoidPhrases: z.array(z.string()).default(["too formal", "too sexual", "too desperate", "too AI-like"]),
  flirtingStyle: z.string().default("low-pressure, sincere, not sexualized"),
  conflictStyle: z.string().default("avoidant at first, needs help setting boundaries"),
  socialWeaknesses: z.array(z.string()).default([]),
});

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

function buildSuggestUserMessage(input: {
  rawMessage: string;
  targetUser?: { name: string; relationshipStage: string };
  activityIntent?: { activity: string; area: string; time: string };
  chatContext: Array<{ senderName: string; content: string }>;
  userVoiceProfile?: {
    tone: string[];
    messageLength: string;
    formality: string;
    humorStyle: string;
    commonPhrases: string[];
    avoidPhrases: string[];
    flirtingStyle: string;
    conflictStyle: string;
    socialWeaknesses: string[];
  };
}): string {
  const parts: string[] = [];

  parts.push(`## User's Raw Message\n${input.rawMessage}`);

  if (input.targetUser) {
    parts.push(`## Target User\n- Name: ${input.targetUser.name}\n- Relationship Stage: ${input.targetUser.relationshipStage}`);
  }

  if (input.activityIntent) {
    parts.push(`## Activity Intent\n- Activity: ${input.activityIntent.activity}\n- Area: ${input.activityIntent.area}\n- Time: ${input.activityIntent.time}`);
  }

  if (input.chatContext.length > 0) {
    parts.push(`## Chat Context\n` + input.chatContext.map(m => `- ${m.senderName}: ${m.content}`).join("\n"));
  }

  if (input.userVoiceProfile) {
    const vp = input.userVoiceProfile;
    parts.push(`## User Voice Profile\n- Tone: ${vp.tone.join(", ")}\n- Message Length: ${vp.messageLength}\n- Formality: ${vp.formality}\n- Humor Style: ${vp.humorStyle}\n- Common Phrases: ${vp.commonPhrases.join(", ") || "none specified"}\n- Avoid Phrases: ${vp.avoidPhrases.join(", ")}\n- Flirting Style: ${vp.flirtingStyle}\n- Conflict Style: ${vp.conflictStyle}\n- Social Weaknesses: ${vp.socialWeaknesses.join(", ") || "none specified"}`);
  }

  parts.push(`\nAnalyze the user's raw message through the five-layer analysis (Surface Message → True Intent → Emotion State → Social Risk → User Voice), auto-detect the best mode, and generate the response.`);

  return parts.join("\n\n");
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
  activityIntent?: { activity: string; area: string; time: string },
  ownerMemory?: { publicAchievements: string[]; interests: string[] }
) {
  let context = "## Current Chat Context\n";
  if (chatContext.length > 0) {
    context += chatContext.map(m => `- ${m.senderName}: ${m.content}`).join("\n");
  } else {
    context += "(No messages yet — both users just matched)";
  }

  let intent = "";
  if (activityIntent) {
    intent = `\n\n## Activity Intent\n- Activity: ${activityIntent.activity}\n- Area: ${activityIntent.area}\n- Time: ${activityIntent.time}`;
  }

  let memory = "";
  if (ownerMemory) {
    const parts: string[] = [];
    if (ownerMemory.publicAchievements.length > 0) {
      parts.push(`- Public Achievements (allowed to mention): ${ownerMemory.publicAchievements.join(", ")}`);
    }
    if (ownerMemory.interests.length > 0) {
      parts.push(`- Interests: ${ownerMemory.interests.join(", ")}`);
    }
    if (parts.length > 0) {
      memory = `\n\n## Owner Memory\n${parts.join("\n")}`;
    }
  }

  return `${context}${intent}${memory}\n\nAnalyze the current chat state and decide whether the Pixie should speak, and if so, what to say.`;
}

// ─── Presence LLM caller (different output format) ────────

interface PresenceResponse {
  shouldSpeak: boolean;
  visibility: "public_pixie" | "private_whisper" | "none";
  interventionType: "boost_owner" | "bridge_topic" | "break_ice" | "plan_push" | "safety_check" | "clarify_misunderstanding" | "owner_requested" | "stay_silent";
  reason: string;
  message: string | null;
  suggestedNextAction: "none" | "ask_question" | "suggest_reply" | "update_plan" | "add_to_plan_card" | "wait";
  planUpdate: {
    activity: string | null;
    time: string | null;
    place: string | null;
    notes: string | null;
  };
  cooldownTurns: number;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
}

async function callPresenceLLM(systemPrompt: string, userMessage: string): Promise<PresenceResponse> {
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

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);

  return {
    shouldSpeak: typeof parsed.shouldSpeak === "boolean" ? parsed.shouldSpeak : false,
    visibility: ["public_pixie", "private_whisper", "none"].includes(parsed.visibility) ? parsed.visibility : "none",
    interventionType: ["boost_owner", "bridge_topic", "break_ice", "plan_push", "safety_check", "clarify_misunderstanding", "owner_requested", "stay_silent"].includes(parsed.interventionType) ? parsed.interventionType : "stay_silent",
    reason: typeof parsed.reason === "string" ? parsed.reason : "",
    message: typeof parsed.message === "string" ? parsed.message : null,
    suggestedNextAction: ["none", "ask_question", "suggest_reply", "update_plan", "add_to_plan_card", "wait"].includes(parsed.suggestedNextAction) ? parsed.suggestedNextAction : "wait",
    planUpdate: {
      activity: parsed.planUpdate?.activity ?? null,
      time: parsed.planUpdate?.time ?? null,
      place: parsed.planUpdate?.place ?? null,
      notes: parsed.planUpdate?.notes ?? null,
    },
    cooldownTurns: typeof parsed.cooldownTurns === "number" ? parsed.cooldownTurns : 3,
    riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "low",
    confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
  };
}

// ─── Build Express user message ─────────────────────────────

function buildExpressUserMessage(input: {
  rawMessage: string;
  mode: string;
  targetUser?: { name: string; relationshipStage: string };
  activityIntent?: { activity: string; area: string; time: string };
  chatContext: Array<{ senderName: string; content: string }>;
  userVoiceProfile?: {
    tone: string[];
    messageLength: string;
    formality: string;
    humorStyle: string;
    commonPhrases: string[];
    avoidPhrases: string[];
    flirtingStyle: string;
    conflictStyle: string;
    socialWeaknesses: string[];
  };
}): string {
  const parts: string[] = [];

  parts.push(`## Mode\n${input.mode}`);
  parts.push(`## User's Raw Message\n${input.rawMessage}`);

  if (input.targetUser) {
    parts.push(`## Target User\n- Name: ${input.targetUser.name}\n- Relationship Stage: ${input.targetUser.relationshipStage}`);
  }

  if (input.activityIntent) {
    parts.push(`## Activity Intent\n- Activity: ${input.activityIntent.activity}\n- Area: ${input.activityIntent.area}\n- Time: ${input.activityIntent.time}`);
  }

  if (input.chatContext.length > 0) {
    parts.push(`## Chat Context\n` + input.chatContext.map(m => `- ${m.senderName}: ${m.content}`).join("\n"));
  }

  if (input.userVoiceProfile) {
    const vp = input.userVoiceProfile;
    parts.push(`## User Voice Profile\n- Tone: ${vp.tone.join(", ")}\n- Message Length: ${vp.messageLength}\n- Formality: ${vp.formality}\n- Humor Style: ${vp.humorStyle}\n- Common Phrases: ${vp.commonPhrases.join(", ") || "none specified"}\n- Avoid Phrases: ${vp.avoidPhrases.join(", ")}\n- Flirting Style: ${vp.flirtingStyle}\n- Conflict Style: ${vp.conflictStyle}\n- Social Weaknesses: ${vp.socialWeaknesses.join(", ") || "none specified"}`);
  }

  parts.push(`\nAnalyze the user's raw message through the five-layer analysis (Surface Message → True Intent → Emotion State → Social Risk → User Voice) and generate the response.`);

  return parts.join("\n\n");
}

// ─── Router ───────────────────────────────────────────────

export const pixieRouter = router({
  // Get available personas list
  personas: publicProcedure.query(() => {
    return PERSONA_LIST;
  }),

  // ─── Unified Suggest API (精灵建议 — auto-detect mode) ──────
  suggest: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        userId: z.string(),
        pixieId: z.string().default("lumi"),
        persona: personaSchema.default("sassy_roast_bestie"),
        rawMessage: z.string(),
        targetUser: targetUserSchema.optional(),
        activityIntent: activityIntentSchema.optional(),
        chatContext: z.array(chatMessageSchema).default([]),
        userVoiceProfile: userVoiceProfileSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = assembleSuggestPrompt(input.persona as PersonaId);

      const userMessage = buildSuggestUserMessage(input);

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

      let cleaned = raw.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return {
          detectedMode: "casual" as const,
          detectedIntent: "Unable to parse - raw response received",
          emotionDetected: [],
          riskFlags: [],
          rewriteStrategy: "",
          privateBubbles: [{ type: "advice" as const, text: cleaned.slice(0, 200), emotion: "neutral" as const, delayMs: 0 }],
          suggestedPublicMessage: "",
          userVoiceMatch: 0,
          riskLevel: "low" as const,
          confidence: 0,
        };
      }

      return {
        detectedMode: typeof parsed.detectedMode === "string" ? parsed.detectedMode : "casual",
        detectedIntent: typeof parsed.detectedIntent === "string" ? parsed.detectedIntent : "",
        emotionDetected: Array.isArray(parsed.emotionDetected) ? parsed.emotionDetected.filter((e: any) => typeof e === "string") : [],
        riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags.filter((f: any) => typeof f === "string") : [],
        rewriteStrategy: typeof parsed.rewriteStrategy === "string" ? parsed.rewriteStrategy : "",
        privateBubbles: Array.isArray(parsed.privateBubbles) ? parsed.privateBubbles.map((b: any) => ({
          type: ["reaction", "roast", "advice", "warning", "question"].includes(b.type) ? b.type : "advice",
          text: typeof b.text === "string" ? b.text : "",
          emotion: ["neutral", "playful", "worried", "smug", "serious", "excited"].includes(b.emotion) ? b.emotion : "neutral",
          delayMs: typeof b.delayMs === "number" ? b.delayMs : 0,
        })) : [],
        suggestedPublicMessage: typeof parsed.suggestedPublicMessage === "string" ? parsed.suggestedPublicMessage : "",
        userVoiceMatch: typeof parsed.userVoiceMatch === "number" ? Math.min(1, Math.max(0, parsed.userVoiceMatch)) : 0.8,
        riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "low",
        confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
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
        ownerMemory: z.object({
          publicAchievements: z.array(z.string()).default([]),
          interests: z.array(z.string()).default([]),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = assembleAutoContextPrompt(input.persona as PersonaId);

      const userMessage = buildAutoContextUserMessage(
        input.chatContext,
        input.activityIntent,
        input.ownerMemory
      );

      return await callPresenceLLM(systemPrompt, userMessage);
    }),

  });
