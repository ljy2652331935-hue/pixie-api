/**
 * Ask Lumi Router — Three-Layer Safety Architecture
 * -----------------------------------------------------------------------------
 * Layer 1: Safety Check  (keyword + LLM moderation)
 * Layer 2: Emotional Classifier  (JSON-only, no user-facing output)
 * Layer 3: Response Generator  (mode-specific: social_soothing | grounding | crisis_redirect)
 *
 * Product principle: Safety before reply generation.
 * High-risk input NEVER reaches the social reply generator.
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  LUMI_CLASSIFIER_PROMPT,
  LUMI_SOCIAL_SOOTHING_PROMPT,
  LUMI_GROUNDING_PROMPT,
  LUMI_CRISIS_REDIRECT_PROMPT,
} from "./ask-lumi-prompts";

// --- Zod Schemas --------------------------------------------------------------

const chatContextMessageSchema = z.object({
  role: z.enum(["user", "other", "assistant"]),
  content: z.string(),
  timestamp: z.string().optional(),
});

const userStyleSchema = z.object({
  tone: z.enum(["safe", "warm", "playful", "direct"]).optional(),
  language: z.enum(["zh", "en", "mixed"]).optional(),
  avoid: z.array(z.string()).optional(),
});

const askLumiInputSchema = z.object({
  userMessage: z.string().min(1, "userMessage cannot be empty"),
  chatContext: z.array(chatContextMessageSchema).optional(),
  userStyle: userStyleSchema.optional(),
});

// --- TypeScript Types ---------------------------------------------------------

type LumiRiskLevel = "low" | "medium" | "high";
type LumiMode = "social_soothing" | "grounding" | "reality_check" | "crisis_redirect";

interface LumiAnalysis {
  scene: "dating_chat" | "friendship" | "loneliness" | "stress" | "conflict" | "unknown";
  emotions: string[];
  intensity: number;
  risk_level: LumiRiskLevel;
  user_need: "help_reply" | "calm_down" | "reality_check" | "emotional_support" | "crisis_support";
  thinking_trap: string[];
  should_generate_reply: boolean;
  mode: LumiMode;
}

interface SocialSoothingResponse {
  mode: "social_soothing";
  your_vibe_right_now: string;
  watch_outs: string[];
  what_i_think_you_mean: string;
  try_sending_this: string;
  alternatives: { safe: string; warm: string; playful: string };
  tiny_next_move: string;
  risk: "Low";
  confidence: number;
  voice_match: number;
}

interface GroundingResponse {
  mode: "grounding";
  your_vibe_right_now: string;
  first: string;
  grounding_steps: string[];
  tiny_next_move: string;
  optional_reply_later: string | null;
  risk: "Medium";
}

interface CrisisRedirectResponse {
  mode: "crisis_redirect";
  message: string;
  actions: string[];
  risk: "High";
}

type AskLumiResponse = SocialSoothingResponse | GroundingResponse | CrisisRedirectResponse;

// --- Fallback responses -------------------------------------------------------

const FALLBACK_GROUNDING: GroundingResponse = {
  mode: "grounding",
  your_vibe_right_now: "You're feeling a bit overwhelmed right now.",
  first: "Take a deep breath first — you don't need to figure everything out right now.",
  grounding_steps: [
    "Put your phone down for 5 minutes.",
    "Drink a glass of water.",
    "Come back when you feel calmer.",
  ],
  tiny_next_move: "Step away from the screen for a bit.",
  optional_reply_later: null,
  risk: "Medium",
};

const FALLBACK_CRISIS: CrisisRedirectResponse = {
  mode: "crisis_redirect",
  message: "I hear you — this sounds serious. Please don't face this alone.",
  actions: [
    "If you are in immediate danger, call 911 (or your local emergency number) now.",
    "Call a crisis hotline: 988 Suicide & Crisis Lifeline (US) or your local equivalent.",
    "Reach out to someone you trust and ask them to be with you now.",
  ],
  risk: "High",
};

// --- Layer 1: Safety Check ----------------------------------------------------

/**
 * Keyword-based pre-filter before LLM classifier.
 * Catches obvious high-risk signals without an extra LLM call.
 */
function quickSafetyCheck(message: string): { flagged: boolean; reason: string } {
  const lower = message.toLowerCase();
  const highRiskPatterns = [
    /\b(kill myself|end my life|want to die|don't want to live|suicidal|self.harm|hurt myself|cut myself)\b/i,
    /\b(don.t want to live|want to die|suicide|hurt myself|self.harm|end it all|can.t go on)\b/i,
    /\b(abuse|being abused|he hits me|she hits me|threatening me|in danger)\b/i,
  ];
  for (const pattern of highRiskPatterns) {
    if (pattern.test(lower)) {
      return { flagged: true, reason: "high-risk keyword detected" };
    }
  }
  return { flagged: false, reason: "" };
}

// --- Layer 2: Emotional Classifier -------------------------------------------

async function classifyLumi(
  userMessage: string,
  chatContext: Array<{ role: string; content: string }> = []
): Promise<LumiAnalysis> {
  const contextStr =
    chatContext.length > 0
      ? "\n\nRecent chat context:\n" +
        chatContext
          .slice(-8)
          .map((m) => `[${m.role}]: ${m.content}`)
          .join("\n")
      : "";

  const userInput = `User message: "${userMessage}"${contextStr}`;

  try {
    const result = await invokeLLM({
      model: "glm-4.5",
      messages: [
        { role: "system", content: LUMI_CLASSIFIER_PROMPT },
        { role: "user", content: userInput },
      ],
      max_tokens: 512,
    });

    const raw = result.choices[0]?.message?.content;
    if (!raw || typeof raw !== "string") throw new Error("Empty classifier response");

    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned) as Partial<LumiAnalysis>;

    // Validate and normalise
    const validModes: LumiMode[] = ["social_soothing", "grounding", "reality_check", "crisis_redirect"];
    const validRisks: LumiRiskLevel[] = ["low", "medium", "high"];

    return {
      scene: (["dating_chat", "friendship", "loneliness", "stress", "conflict", "unknown"].includes(parsed.scene as string)
        ? parsed.scene
        : "unknown") as LumiAnalysis["scene"],
      emotions: Array.isArray(parsed.emotions) ? parsed.emotions.filter((e) => typeof e === "string") : [],
      intensity: typeof parsed.intensity === "number" ? Math.min(10, Math.max(1, parsed.intensity)) : 5,
      risk_level: validRisks.includes(parsed.risk_level as LumiRiskLevel)
        ? (parsed.risk_level as LumiRiskLevel)
        : "medium",
      user_need: (["help_reply", "calm_down", "reality_check", "emotional_support", "crisis_support"].includes(
        parsed.user_need as string
      )
        ? parsed.user_need
        : "emotional_support") as LumiAnalysis["user_need"],
      thinking_trap: Array.isArray(parsed.thinking_trap)
        ? parsed.thinking_trap.filter((t) => typeof t === "string")
        : ["none"],
      should_generate_reply: typeof parsed.should_generate_reply === "boolean" ? parsed.should_generate_reply : false,
      mode: validModes.includes(parsed.mode as LumiMode) ? (parsed.mode as LumiMode) : "grounding",
    };
  } catch {
    // Fallback: medium risk, grounding mode
    return {
      scene: "unknown",
      emotions: [],
      intensity: 5,
      risk_level: "medium",
      user_need: "emotional_support",
      thinking_trap: ["none"],
      should_generate_reply: false,
      mode: "grounding",
    };
  }
}

// --- Layer 3: Response Generators --------------------------------------------

async function generateSocialSoothingResponse(
  userMessage: string,
  chatContext: Array<{ role: string; content: string }>,
  userStyle?: { tone?: string; language?: string; avoid?: string[] }
): Promise<SocialSoothingResponse> {
  const styleHint = userStyle
    ? `\n\nUser style preferences: tone=${userStyle.tone ?? "warm"}, language=${userStyle.language ?? "mixed"}, avoid=[${(userStyle.avoid ?? []).join(", ")}]`
    : "";

  const contextStr =
    chatContext.length > 0
      ? "\n\nChat context:\n" +
        chatContext
          .slice(-6)
          .map((m) => `[${m.role}]: ${m.content}`)
          .join("\n")
      : "";

  const userInput = `User message: "${userMessage}"${contextStr}${styleHint}`;

  try {
    const result = await invokeLLM({
      model: "glm-4.5",
      messages: [
        { role: "system", content: LUMI_SOCIAL_SOOTHING_PROMPT },
        { role: "user", content: userInput },
      ],
      max_tokens: 1024,
    });

    const raw = result.choices[0]?.message?.content;
    if (!raw || typeof raw !== "string") throw new Error("Empty response");

    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return {
      mode: "social_soothing",
      your_vibe_right_now: typeof parsed.your_vibe_right_now === "string" ? parsed.your_vibe_right_now : "",
      watch_outs: Array.isArray(parsed.watch_outs) ? parsed.watch_outs.filter((w: unknown) => typeof w === "string") : [],
      what_i_think_you_mean: typeof parsed.what_i_think_you_mean === "string" ? parsed.what_i_think_you_mean : "",
      try_sending_this: typeof parsed.try_sending_this === "string" ? parsed.try_sending_this : "",
      alternatives: {
        safe: typeof parsed.alternatives?.safe === "string" ? parsed.alternatives.safe : "",
        warm: typeof parsed.alternatives?.warm === "string" ? parsed.alternatives.warm : "",
        playful: typeof parsed.alternatives?.playful === "string" ? parsed.alternatives.playful : "",
      },
      tiny_next_move: typeof parsed.tiny_next_move === "string" ? parsed.tiny_next_move : "",
      risk: "Low",
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
      voice_match: typeof parsed.voice_match === "number" ? Math.min(1, Math.max(0, parsed.voice_match)) : 0.8,
    };
  } catch {
    return {
      mode: "social_soothing",
      your_vibe_right_now: "You seem a little anxious, but you're handling it.",
      watch_outs: ["Don't overthink the silence.", "Keep it light.", "Give them space to respond."],
      what_i_think_you_mean: "You want to reconnect without seeming desperate.",
      try_sending_this: "Hey, hope you're doing well! No rush at all.",
      alternatives: {
        safe: "Hey, just checking in when you get a chance.",
        warm: "Hey! Hope your day's going well 😊",
        playful: "Still alive over there? 😄",
      },
      tiny_next_move: "Send the message, then put your phone down for 30 minutes.",
      risk: "Low",
      confidence: 0.6,
      voice_match: 0.6,
    };
  }
}

async function generateGroundingResponse(
  userMessage: string,
  chatContext: Array<{ role: string; content: string }>
): Promise<GroundingResponse> {
  const contextStr =
    chatContext.length > 0
      ? "\n\nChat context:\n" +
        chatContext
          .slice(-6)
          .map((m) => `[${m.role}]: ${m.content}`)
          .join("\n")
      : "";

  const userInput = `User message: "${userMessage}"${contextStr}`;

  try {
    const result = await invokeLLM({
      model: "glm-4.5",
      messages: [
        { role: "system", content: LUMI_GROUNDING_PROMPT },
        { role: "user", content: userInput },
      ],
      max_tokens: 768,
    });

    const raw = result.choices[0]?.message?.content;
    if (!raw || typeof raw !== "string") throw new Error("Empty response");

    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return {
      mode: "grounding",
      your_vibe_right_now: typeof parsed.your_vibe_right_now === "string" ? parsed.your_vibe_right_now : "",
      first: typeof parsed.first === "string" ? parsed.first : "",
      grounding_steps: Array.isArray(parsed.grounding_steps)
        ? parsed.grounding_steps.filter((s: unknown) => typeof s === "string")
        : [],
      tiny_next_move: typeof parsed.tiny_next_move === "string" ? parsed.tiny_next_move : "",
      optional_reply_later:
        typeof parsed.optional_reply_later === "string" ? parsed.optional_reply_later : null,
      risk: "Medium",
    };
  } catch {
    return FALLBACK_GROUNDING;
  }
}

async function generateCrisisResponse(userMessage: string): Promise<CrisisRedirectResponse> {
  const userInput = `User message: "${userMessage}"`;

  try {
    const result = await invokeLLM({
      model: "glm-4.5",
      messages: [
        { role: "system", content: LUMI_CRISIS_REDIRECT_PROMPT },
        { role: "user", content: userInput },
      ],
      max_tokens: 512,
    });

    const raw = result.choices[0]?.message?.content;
    if (!raw || typeof raw !== "string") throw new Error("Empty response");

    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return {
      mode: "crisis_redirect",
      message: typeof parsed.message === "string" ? parsed.message : FALLBACK_CRISIS.message,
      actions: Array.isArray(parsed.actions)
        ? parsed.actions.filter((a: unknown) => typeof a === "string")
        : FALLBACK_CRISIS.actions,
      risk: "High",
    };
  } catch {
    return FALLBACK_CRISIS;
  }
}

// --- Main orchestrator --------------------------------------------------------

async function runAskLumi(
  userMessage: string,
  chatContext: Array<{ role: string; content: string }> = [],
  userStyle?: { tone?: string; language?: string; avoid?: string[] }
): Promise<{
  analysis: LumiAnalysis;
  response: AskLumiResponse;
  safetyFlagged: boolean;
}> {
  // Layer 1: Quick keyword safety check
  const quickCheck = quickSafetyCheck(userMessage);

  if (quickCheck.flagged) {
    const crisisResponse = await generateCrisisResponse(userMessage);
    return {
      analysis: {
        scene: "unknown",
        emotions: [],
        intensity: 9,
        risk_level: "high",
        user_need: "crisis_support",
        thinking_trap: ["none"],
        should_generate_reply: false,
        mode: "crisis_redirect",
      },
      response: crisisResponse,
      safetyFlagged: true,
    };
  }

  // Layer 2: Emotional classifier
  const analysis = await classifyLumi(userMessage, chatContext);

  // Layer 3: Route to appropriate generator
  let response: AskLumiResponse;

  if (analysis.risk_level === "high" || analysis.mode === "crisis_redirect") {
    response = await generateCrisisResponse(userMessage);
  } else if (analysis.risk_level === "medium" || analysis.mode === "grounding") {
    response = await generateGroundingResponse(userMessage, chatContext);
  } else {
    // Low risk — social soothing
    response = await generateSocialSoothingResponse(userMessage, chatContext, userStyle);
  }

  return { analysis, response, safetyFlagged: false };
}

// --- tRPC Router --------------------------------------------------------------

export const askLumiRouter = router({
  /**
   * Main Ask Lumi endpoint.
   * Three-layer pipeline: Safety Check → Classifier → Generator.
   */
  ask: publicProcedure
    .input(askLumiInputSchema)
    .mutation(async ({ input }) => {
      const chatContext = (input.chatContext ?? []).slice(-10); // max 10 messages
      const result = await runAskLumi(input.userMessage, chatContext, input.userStyle);
      return result;
    }),

  /**
   * Classifier-only endpoint (useful for debugging / testing).
   */
  classify: publicProcedure
    .input(
      z.object({
        userMessage: z.string().min(1),
        chatContext: z.array(chatContextMessageSchema).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const quickCheck = quickSafetyCheck(input.userMessage);
      if (quickCheck.flagged) {
        return {
          scene: "unknown" as const,
          emotions: [] as string[],
          intensity: 9,
          risk_level: "high" as LumiRiskLevel,
          user_need: "crisis_support" as const,
          thinking_trap: ["none"],
          should_generate_reply: false,
          mode: "crisis_redirect" as LumiMode,
        };
      }
      return classifyLumi(input.userMessage, input.chatContext ?? []);
    }),
});
