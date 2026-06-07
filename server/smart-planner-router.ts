/**
 * Smart Planner Router
 *
 * Endpoints:
 *   smartPlanner.generate  — Score candidate events for two people and save the plan
 *   smartPlanner.getById   — Retrieve a saved plan by ID
 *   smartPlanner.list      — List recent plans (optionally filtered to current user)
 *
 * The scoring algorithm is fully deterministic (no AI). LLM is only used to
 * generate the `why` field for each event and the 5 chat topic items.
 */

import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { publicProcedure, router } from "./_core/trpc";
import { getActivityPlanById, insertActivityPlan, listActivityPlans } from "./db";
import { buildSearchQuery, classifyVibeCategory, rankEvents } from "./smart-planner-scoring";
import type { CandidateEvent } from "./smart-planner-scoring";
import type { ChatTopicItem, EventRec, PlanResult } from "@shared/smart-planner-types";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const PersonProfileSchema = z.object({
  name: z.string().min(1),
  age: z.number().optional(),
  bio: z.string().optional(),
  gender: z.string().optional(),
  hobbies: z.array(z.string()).default([]),
  music: z.array(z.string()).default([]),
  topicInterests: z.array(z.string()).default([]),
  mbti: z.string().optional(),
  listenerSpeaker: z.number().min(0).max(1).default(0.5),
  dominantPassive: z.number().min(0).max(1).default(0.5),
  emotionAction: z.number().min(0).max(1).default(0.5),
  goal: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const TimeslotStateSchema = z.object({
  mood: z.string().optional(),
  energy: z.string().optional(),
  activities: z.array(z.string()).default([]),
  vibeType: z.string().optional(),
  avoid: z.array(z.string()).default([]),
  moment: z.string().optional(),
  topicType: z.number().min(0).max(1).default(0.5),
  calmEnergetic: z.number().min(0).max(1).default(0.5),
  shareReserve: z.number().min(0).max(1).default(0.5),
});

// ─── Mock Event Candidates ────────────────────────────────────────────────────
// Used when no external event search is available. These are real London venues.

const LONDON_MOCK_EVENTS: CandidateEvent[] = [
  {
    title: "Tate Modern — Free Gallery Visit",
    address: "Bankside, London SE1 9TG",
    isFree: true,
    why: "",
    lat: 51.5076, lng: -0.0994,
  },
  {
    title: "Borough Market Food Tour",
    address: "8 Southwark St, London SE1 1TL",
    isFree: false, estimatedCost: "£10–15",
    why: "",
    lat: 51.5055, lng: -0.0910,
  },
  {
    title: "Hyde Park Walk & Picnic",
    address: "Hyde Park, London W2 2UH",
    isFree: true,
    why: "",
    lat: 51.5073, lng: -0.1657,
  },
  {
    title: "Escape Room at Clue HQ",
    address: "21 Great Castle St, London W1G 0HY",
    isFree: false, estimatedCost: "£25",
    why: "",
    lat: 51.5154, lng: -0.1426,
  },
  {
    title: "Jazz at Ronnie Scott's",
    address: "47 Frith St, Soho, London W1D 4HT",
    isFree: false, estimatedCost: "£20",
    why: "",
    lat: 51.5136, lng: -0.1318,
  },
  {
    title: "Brick Lane Street Art Walk",
    address: "Brick Lane, London E1",
    isFree: true,
    why: "",
    lat: 51.5222, lng: -0.0717,
  },
  {
    title: "Natural History Museum",
    address: "Cromwell Rd, London SW7 5BD",
    isFree: true,
    why: "",
    lat: 51.4967, lng: -0.1764,
  },
  {
    title: "Comedy Night at The Comedy Store",
    address: "1a Oxendon St, London SW1Y 4EE",
    isFree: false, estimatedCost: "£15",
    why: "",
    lat: 51.5099, lng: -0.1311,
  },
  {
    title: "Yoga in the Park — Regent's Park",
    address: "Regent's Park, London NW1 4NR",
    isFree: true,
    why: "",
    lat: 51.5313, lng: -0.1570,
  },
  {
    title: "Board Game Café — Draughts",
    address: "337 Acton Mews, London E8 4EA",
    isFree: false, estimatedCost: "£5",
    why: "",
    lat: 51.5380, lng: -0.0728,
  },
];

// ─── LLM Helpers ──────────────────────────────────────────────────────────────

async function generateWhyReasons(
  events: EventRec[],
  personAName: string,
  personBName: string,
  sharedVibe: string
): Promise<EventRec[]> {
  const prompt = `You are a social planning assistant. Given two people and their shared vibe, write a short personalised reason (1–2 sentences, warm and specific) for why each venue/event suits them.

Person A: ${personAName}
Person B: ${personBName}
Shared vibe: ${sharedVibe}

Events:
${events.map((e, i) => `${i + 1}. ${e.title} at ${e.address}`).join("\n")}

Return a JSON array of objects with fields: index (1-based), why (string).`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "why_reasons",
          strict: true,
          schema: {
            type: "object",
            properties: {
              reasons: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer" },
                    why: { type: "string" },
                  },
                  required: ["index", "why"],
                  additionalProperties: false,
                },
              },
            },
            required: ["reasons"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return events;

    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content)) as { reasons: { index: number; why: string }[] };
    return events.map((e, i) => ({
      ...e,
      why: parsed.reasons.find(r => r.index === i + 1)?.why ?? e.why,
    }));
  } catch {
    return events;
  }
}

async function generateChatTopics(
  personAName: string,
  personBName: string,
  sharedVibe: string,
  sharedInterests: string[]
): Promise<ChatTopicItem[]> {
  const prompt = `You are a social planning assistant. Generate exactly 5 conversation starter topics for two people meeting up.

Person A: ${personAName}
Person B: ${personBName}
Shared vibe: ${sharedVibe}
Shared interests: ${sharedInterests.join(", ") || "general topics"}

Each topic should be warm, specific, and spark genuine conversation. Return a JSON array of 5 objects with fields: title (short, catchy), context (1–2 sentences explaining why it's a good topic).`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chat_topics",
          strict: true,
          schema: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    context: { type: "string" },
                  },
                  required: ["title", "context"],
                  additionalProperties: false,
                },
              },
            },
            required: ["topics"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content)) as { topics: ChatTopicItem[] };
    return parsed.topics.slice(0, 5);
  } catch {
    return [];
  }
}

async function generateSharedVibe(
  personAName: string,
  personBName: string,
  vibeCategory: string,
  vibeType?: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: `Write a single warm sentence (max 20 words) describing the shared vibe for ${personAName} and ${personBName}. Vibe category: ${vibeCategory}. Vibe type: ${vibeType ?? "mixed"}. Be specific and evocative.`,
        },
      ],
    });
    const raw = response.choices?.[0]?.message?.content;
    const text = typeof raw === 'string' ? raw.trim() : '';
    return text || `A ${vibeCategory} day out for ${personAName} and ${personBName}`;
  } catch {
    return `A ${vibeCategory} day out for ${personAName} and ${personBName}`;
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const smartPlannerRouter = router({
  /**
   * Generate a plan for two people.
   * Scores mock events deterministically, then uses LLM for `why` + chat topics.
   */
  generate: publicProcedure
    .input(
      z.object({
        personA: PersonProfileSchema,
        personB: PersonProfileSchema,
        timeslot: TimeslotStateSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { personA, personB, timeslot } = input;

      // 1. Classify vibe category
      const vibeCategory = classifyVibeCategory(personA, personB, timeslot);

      // 2. Build search query (for display / future SerpApi integration)
      const searchQuery = buildSearchQuery(personA, personB, timeslot);

      // 3. Score and rank events
      const rankedEvents = rankEvents(LONDON_MOCK_EVENTS, personA, personB, timeslot, 3);

      // 4. Generate shared vibe description
      const sharedVibe = await generateSharedVibe(
        personA.name, personB.name, vibeCategory, timeslot.vibeType
      );

      // 5. Generate personalised `why` reasons for each event
      const eventsWithWhy = await generateWhyReasons(
        rankedEvents, personA.name, personB.name, sharedVibe
      );

      // 6. Generate chat topics
      const sharedInterests = [
        ...personA.hobbies.filter(h => personB.hobbies.includes(h)),
        ...personA.topicInterests.filter(t => personB.topicInterests.includes(t)),
      ];
      const chatTopics = await generateChatTopics(
        personA.name, personB.name, sharedVibe, sharedInterests
      );

      // 7. Persist to database
      const userId = ctx.user?.id;
      const planId = await insertActivityPlan({
        userId: userId ?? null,
        aName: personA.name,
        bName: personB.name,
        sharedVibe,
        vibeCategory,
        searchQuery,
        top3Json: JSON.stringify(eventsWithWhy),
        chatTopicsJson: JSON.stringify(chatTopics),
        personAJson: JSON.stringify(personA),
        personBJson: JSON.stringify(personB),
        timeslotJson: JSON.stringify(timeslot),
      });

      const result: PlanResult = {
        id: planId,
        sharedVibe,
        vibeCategory,
        searchQuery,
        top3: eventsWithWhy,
        chatTopics,
        personA: {
          name: personA.name,
          location: personA.location,
          lat: personA.lat,
          lng: personA.lng,
        },
        personB: {
          name: personB.name,
          location: personB.location,
          lat: personB.lat,
          lng: personB.lng,
        },
      };

      return result;
    }),

  /** Retrieve a saved plan by its database ID. */
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const row = await getActivityPlanById(input.id);
      if (!row) return null;

      const result: PlanResult = {
        id: row.id,
        sharedVibe: row.sharedVibe ?? "",
        vibeCategory: (row.vibeCategory as PlanResult["vibeCategory"]) ?? "mixed",
        searchQuery: row.searchQuery ?? "",
        top3: row.top3Json ? (JSON.parse(row.top3Json) as EventRec[]) : [],
        chatTopics: row.chatTopicsJson ? (JSON.parse(row.chatTopicsJson) as ChatTopicItem[]) : [],
        personA: row.personAJson
          ? { name: (JSON.parse(row.personAJson) as { name: string }).name }
          : { name: row.aName },
        personB: row.personBJson
          ? { name: (JSON.parse(row.personBJson) as { name: string }).name }
          : { name: row.bName },
        createdAt: row.createdAt,
      };

      return result;
    }),

  /** List recent plans. If authenticated, shows only the current user's plans. */
  list: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      const rows = await listActivityPlans(userId, input.limit);

      return rows.map(row => ({
        id: row.id,
        aName: row.aName,
        bName: row.bName,
        sharedVibe: row.sharedVibe ?? "",
        vibeCategory: row.vibeCategory ?? "mixed",
        createdAt: row.createdAt,
      }));
    }),
});
