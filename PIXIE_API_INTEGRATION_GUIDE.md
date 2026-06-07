# Pixie API Integration Guide

> **Version**: v2.0  
> **Last Updated**: 2026-06-07  
> **Protocol**: tRPC over HTTP (JSON)

---

## Table of Contents

1. [Basic Information](#basic-information)
2. [Authentication](#authentication)
3. [General Request Format](#general-request-format)
4. [Endpoint Overview](#endpoint-overview)
5. [pixie.liveChat — Companion Chat](#pixielivechat--companion-chat)
6. [pixie.suggest — Smart Suggestion (User-Triggered)](#pixiesuggest--smart-suggestion-user-triggered)
7. [pixie.autoContext — Auto Context Analysis](#pixieautocontext--auto-context-analysis)
8. [pixie.chat — Ask Pixie (Whisper Mode)](#pixiechat--ask-pixie-whisper-mode)
9. [pixie.publicSpeak — Pixie Public Speech](#pixiepublicspeak--pixie-public-speech)
10. [askLumi.ask — Ask Lumi (3-Tier Safety)](#asklumiask--ask-lumi-3-tier-safety)
11. [Error Handling](#error-handling)
12. [Rate Limits & Best Practices](#rate-limits--best-practices)
13. [Full TypeScript Type Definitions](#full-typescript-type-definitions)

---

## Basic Information

| Item | Value |
|------|-------|
| **Base URL** | `https://pixie-api.manus.space` (active after publishing; customizable in Settings → Domains) |
| **Dev URL** | `https://8000-iv0cc79u5roausz6b7d2o-5c1e5ae2.us2.manus.computer` |
| **Protocol** | HTTP POST (tRPC mutation) / HTTP GET (tRPC query) |
| **Content-Type** | `application/json` |
| **CORS** | All origins allowed (`*`) by default; no extra headers needed |
| **Rate Limit** | No hard limit currently; recommended ≤ 10 req/min per user |

---

## Authentication

**All endpoints are currently `publicProcedure` — no authentication required.** Simply send HTTP requests directly.

To protect endpoints in the future, you can:
- Pass `Authorization: Bearer <token>` in request headers
- Or use cookie-based auth (handled automatically by Manus OAuth)

---

## General Request Format

Pixie API uses the **tRPC** protocol. All mutation endpoints are called via HTTP POST:

```
POST {BASE_URL}/api/trpc/{router}.{procedure}
Content-Type: application/json

Body: { "json": { ...input } }
```

**Response format**:

```json
{
  "result": {
    "data": {
      "json": { /* actual response data */ }
    }
  }
}
```

**Generic fetch wrapper**:

```typescript
const PIXIE_BASE_URL = "https://pixie-api.manus.space";

async function callPixie<T>(procedure: string, input: Record<string, any>): Promise<T> {
  const res = await fetch(`${PIXIE_BASE_URL}/api/trpc/${procedure}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Pixie API Error: ${error?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return data.result.data.json as T;
}
```

---

## Endpoint Overview

| Endpoint | Method | Purpose | App Use Case |
|----------|--------|---------|--------------|
| `pixie.liveChat` | POST | Multi-turn companion chat window | PixieScreen standalone chat |
| `pixie.suggest` | POST | Smart suggestion (auto-detect mode) | User taps "Ask Lumi" |
| `pixie.autoContext` | POST | Auto-analyze conversation context | Pixie auto-intervene / whisper |
| `pixie.chat` | POST | Ask Pixie (single-turn whisper) | User privately asks Pixie |
| `pixie.publicSpeak` | POST | Pixie speaks in public chat | Pixie participates as 3rd party |
| `askLumi.ask` | POST | 3-tier safety emotional support | User in emotional distress |
| `pixie.personas` | GET | List available personas | Show persona selector |

---

## pixie.liveChat — Companion Chat

**Purpose**: Standalone multi-turn conversation window between user and Pixie. The persona provides emotional support, social advice, playful banter, etc. based on conversation history.

### Request Format

```typescript
POST /api/trpc/pixie.liveChat

{
  "json": {
    "persona": "lumi",  // Optional | "lumi" (Lumi) or "foxxz" (Foxxz)
    "messages": [                      // Required | Conversation history array
      {
        "role": "user",                // "user" | "assistant"
        "content": "I just got left on read..."
      },
      {
        "role": "assistant",
        "content": "{\"bubbles\":[{\"type\":\"comfort\",\"text\":\"Hey...\"}]}"
      },
      {
        "role": "user",
        "content": "Should I send another message?"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `persona` | `string` | No (default: `lumi`) | Persona: `lumi`=Lumi, `foxxz`=Foxxz |
| `messages` | `Array<{role, content}>` | Yes | Full conversation history. `role` is `"user"` or `"assistant"` |

### Response Format

```json
{
  "type": "structured",
  "content": "Raw LLM output (JSON string)",
  "bubbles": [
    {
      "type": "comfort",
      "text": "Hey, being left on read doesn't mean they don't like you.",
      "emotion": "soft",
      "delayMs": 0
    },
    {
      "type": "advice",
      "text": "Don't send another one yet. Wait till tomorrow — if you still want to, then go for it.",
      "emotion": "serious",
      "delayMs": 800
    }
  ],
  "suggestedAction": "wait_and_observe",
  "quickReplies": ["I'll wait and see", "But I'm so anxious", "Help me think of something to say"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"structured" \| "text"` | Response type. `structured` means successfully parsed as JSON |
| `content` | `string` | Raw LLM output text |
| `bubbles` | `BubbleItem[]` | Bubble array, render in order |
| `bubbles[].type` | `string` | Bubble type: `reaction`/`tease`/`comfort`/`advice`/`question`/`action`/`warning` |
| `bubbles[].text` | `string` | Bubble text (short, ≤30 words per bubble) |
| `bubbles[].emotion` | `string` | Emotion: `playful`/`soft`/`serious`/`smug`/`worried`/`excited` |
| `bubbles[].delayMs` | `number` | Display delay in ms (first is 0, subsequent 600-1600) |
| `suggestedAction` | `string` | Suggested next action |
| `quickReplies` | `string[]` | Quick reply options (can be rendered as buttons) |

### Usage Example

```typescript
const response = await callPixie<LiveChatResponse>("pixie.liveChat", {
  persona: "lumi",
  messages: [
    { role: "user", content: "I just got left on read and I feel terrible" },
  ],
});

// Render bubbles with animation
response.bubbles.forEach((bubble, i) => {
  setTimeout(() => {
    renderBubble(bubble.text, bubble.emotion);
  }, bubble.delayMs);
});
```

---

## pixie.suggest — Smart Suggestion (User-Triggered)

**Purpose**: When user taps "Ask Lumi", Pixie analyzes chat context and user intent, auto-detects the best mode, and provides suggestions.

### Request Format

```typescript
POST /api/trpc/pixie.suggest

{
  "json": {
    "roomId": "room_123",                    // Required | Chat room ID
    "userId": "user_456",                    // Required | Current user ID
    "pixieId": "lumi",                       // Optional | Pixie ID
    "persona": "lumi",         // Optional | Persona
    "rawMessage": "She said 'let's hang out next time', how should I reply?",  // Required | User's message/question
    "hintMode": "rewrite",                   // Optional | User-selected mode
    "targetUser": {                          // Optional | Conversation partner info
      "name": "Emma",
      "relationshipStage": "dating_interest"
    },
    "activityIntent": {                      // Optional | Activity intent (for meetup scenarios)
      "activity": "dinner",
      "area": "downtown",
      "time": "Saturday evening"
    },
    "chatContext": [                          // Optional | Recent chat history
      { "senderName": "Emma", "senderType": "human", "content": "Let's hang out next time~" },
      { "senderName": "Me", "senderType": "human", "content": "" }
    ],
    "userVoiceProfile": {                    // Optional | User's language style
      "tone": ["warm", "playful"],
      "messageLength": "short",
      "formality": "casual",
      "humorStyle": "light teasing",
      "commonPhrases": ["haha", "sounds good"],
      "avoidPhrases": ["too formal", "too cheesy"],
      "flirtingStyle": "low-pressure, sincere",
      "conflictStyle": "avoidant",
      "socialWeaknesses": ["tends to over-interpret"]
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomId` | `string` | Yes | Chat room unique identifier |
| `userId` | `string` | Yes | Current user ID |
| `pixieId` | `string` | No | Pixie ID, default `"lumi"` |
| `persona` | `string` | No | `"lumi"` or `"foxxz"` |
| `rawMessage` | `string` | Yes | User's raw message/question |
| `hintMode` | `string` | No | Manual mode: `icebreaker`/`rewrite`/`boundary`/`plan`/`whisper`/`offline_profile` |
| `targetUser` | `object` | No | Conversation partner info |
| `targetUser.name` | `string` | Yes | Partner's name |
| `targetUser.relationshipStage` | `string` | No | `new_match`/`casual_chat`/`friend`/`dating_interest`/`unknown` |
| `activityIntent` | `object` | No | Activity intent for meetups |
| `chatContext` | `Array` | No | Recent chat history |
| `chatContext[].senderName` | `string` | Yes | Sender name |
| `chatContext[].senderType` | `string` | Yes | `"human"`/`"pixie"`/`"system"` |
| `chatContext[].content` | `string` | Yes | Message content |
| `userVoiceProfile` | `object` | No | User language style profile |

### Response Format

```json
{
  "detectedMode": "rewrite",
  "detectedIntent": "User wants to reply to 'let's hang out next time' but isn't sure how to phrase it",
  "emotionDetected": ["anxious", "hopeful"],
  "riskFlags": [],
  "rewriteStrategy": "Keep it light, don't push, leave space",
  "privateBubbles": [
    {
      "type": "advice",
      "text": "Her saying 'next time' isn't a rejection — she left the door open.",
      "emotion": "playful",
      "delayMs": 0
    },
    {
      "type": "advice",
      "text": "Don't ask 'when' right now. Accept it, then bring it up again in a few days.",
      "emotion": "serious",
      "delayMs": 800
    }
  ],
  "suggestedPublicMessage": "Sounds good! You pick the place next time 😄",
  "alternatives": {
    "playful": "Haha deal, next time you plan it and I'll just show up hungry 😋",
    "softer": "That sounds nice — you pick the spot next time if you want",
    "casual": "Sure, you pick next time"
  },
  "userVoiceMatch": 0.85,
  "riskLevel": "low",
  "confidence": 0.9
}
```

| Field | Type | Description |
|-------|------|-------------|
| `detectedMode` | `string` | Auto-detected mode |
| `detectedIntent` | `string` | Detected user intent |
| `emotionDetected` | `string[]` | Detected emotion tags |
| `riskFlags` | `string[]` | Risk flags (if any) |
| `rewriteStrategy` | `string` | Rewrite strategy explanation |
| `privateBubbles` | `BubbleItem[]` | Private suggestion bubbles (only user can see) |
| `suggestedPublicMessage` | `string` | Suggested public message for user to send |
| `alternatives` | `{ playful, softer, casual }` | Three style variants (playful / softer / casual) |
| `userVoiceMatch` | `number` | Voice style match score (0-1) |
| `riskLevel` | `"low" \| "medium" \| "high"` | Risk level |
| `confidence` | `number` | Confidence score (0-1) |

---

## pixie.autoContext — Auto Context Analysis

**Purpose**: Pixie automatically analyzes conversation context and decides whether to intervene (whisper reminder or public speech). Suitable for background polling.

### Request Format

```typescript
POST /api/trpc/pixie.autoContext

{
  "json": {
    "roomId": "room_123",                    // Required
    "userId": "user_456",                    // Required
    "pixieId": "lumi",                       // Optional
    "persona": "lumi",         // Optional
    "chatContext": [                          // Optional | Recent chat history
      { "senderName": "Emma", "senderType": "human", "content": "Are you free this weekend?" },
      { "senderName": "Me", "senderType": "human", "content": "Yeah, what's up?" },
      { "senderName": "Emma", "senderType": "human", "content": "Want to check out that art exhibit?" }
    ],
    "activityIntent": {                      // Optional | Known activity intent
      "activity": "art exhibit",
      "area": "downtown gallery",
      "time": "this weekend"
    },
    "ownerMemory": {                         // Optional | User's public info
      "publicAchievements": ["photography enthusiast"],
      "interests": ["art", "coffee"]
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomId` | `string` | Yes | Chat room ID |
| `userId` | `string` | Yes | User ID |
| `pixieId` | `string` | No | Pixie ID |
| `persona` | `string` | No | Persona |
| `chatContext` | `Array` | No | Recent chat history (same format as suggest) |
| `activityIntent` | `object` | No | Activity intent |
| `ownerMemory` | `object` | No | User's public info (things Pixie can mention) |
| `ownerMemory.publicAchievements` | `string[]` | No | Public achievements/tags |
| `ownerMemory.interests` | `string[]` | No | Interests/hobbies |

### Response Format

```json
{
  "shouldSpeak": true,
  "visibility": "private_whisper",
  "interventionType": "plan_push",
  "reason": "Other person initiated a meetup — help user confirm details",
  "message": "She's asking you out! Suggest confirming time and place.",
  "suggestedNextAction": "suggest_reply",
  "planUpdate": {
    "activity": "art exhibit",
    "time": "this weekend",
    "place": "downtown gallery",
    "notes": "initiated by other person"
  },
  "cooldownTurns": 3,
  "riskLevel": "low",
  "confidence": 0.92
}
```

| Field | Type | Description |
|-------|------|-------------|
| `shouldSpeak` | `boolean` | Whether Pixie should speak |
| `visibility` | `string` | `"public_pixie"` (public speech) / `"private_whisper"` (user only) / `"none"` |
| `interventionType` | `string` | Intervention type: `boost_owner`/`bridge_topic`/`break_ice`/`plan_push`/`safety_check`/`clarify_misunderstanding`/`owner_requested`/`stay_silent` |
| `reason` | `string` | Intervention reason (internal use) |
| `message` | `string \| null` | What Pixie wants to say (null when `shouldSpeak=false`) |
| `suggestedNextAction` | `string` | Suggested next step: `none`/`ask_question`/`suggest_reply`/`update_plan`/`add_to_plan_card`/`wait` |
| `planUpdate` | `object` | Plan update (meetup scenarios) |
| `planUpdate.activity` | `string \| null` | Activity |
| `planUpdate.time` | `string \| null` | Time |
| `planUpdate.place` | `string \| null` | Place |
| `planUpdate.notes` | `string \| null` | Notes |
| `cooldownTurns` | `number` | Suggested cooldown turns (messages to wait before next intervention) |
| `riskLevel` | `string` | Risk level |
| `confidence` | `number` | Confidence score |

---

## pixie.chat — Ask Pixie (Whisper Mode)

**Purpose**: User privately asks Pixie a question during a chat. Single-turn, no history retained.

### Request Format

```typescript
POST /api/trpc/pixie.chat

{
  "json": {
    "roomId": "room_123",                    // Required
    "userId": "user_456",                    // Required
    "pixieId": "lumi",                       // Optional
    "persona": "lumi",         // Optional
    "privateQuestion": "Is she losing interest in me?", // Required | User's private question
    "chatContext": [                          // Optional | Current public chat context
      { "senderName": "Emma", "senderType": "human", "content": "Mm hmm" },
      { "senderName": "Me", "senderType": "human", "content": "So, see you this weekend?" },
      { "senderName": "Emma", "senderType": "human", "content": "We'll see" }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomId` | `string` | Yes | Chat room ID |
| `userId` | `string` | Yes | User ID |
| `pixieId` | `string` | No | Pixie ID |
| `persona` | `string` | No | Persona |
| `privateQuestion` | `string` | Yes | User's private question |
| `chatContext` | `Array` | No | Current public chat context |

### Response Format

```json
{
  "responseStyle": "multi",
  "visibility": "private",
  "bubbles": [
    {
      "type": "reaction",
      "text": "Babe, 'we'll see' isn't necessarily a rejection.",
      "emotion": "playful",
      "delayMs": 0
    },
    {
      "type": "advice",
      "text": "But if it happens twice in a row like this, don't chase.",
      "emotion": "serious",
      "delayMs": 800
    }
  ],
  "suggestedPublicMessage": null,
  "quickReplies": [],
  "riskLevel": "low",
  "confidence": 0.85
}
```

| Field | Type | Description |
|-------|------|-------------|
| `responseStyle` | `string` | `"single"`/`"multi"`/`"clarify"`/`"interrupt"` |
| `visibility` | `string` | `"private"`/`"public_suggestion"`/`"public_pixie"` |
| `bubbles` | `BubbleItem[]` | Bubble array |
| `bubbles[].type` | `string` | `reaction`/`tease`/`advice`/`warning`/`question`/`suggested_message` |
| `bubbles[].text` | `string` | Bubble text |
| `bubbles[].emotion` | `string` | `neutral`/`playful`/`worried`/`smug`/`serious`/`excited` |
| `bubbles[].delayMs` | `number` | Delay in ms |
| `suggestedPublicMessage` | `string \| null` | Suggested public message |
| `quickReplies` | `string[]` | Quick replies |
| `riskLevel` | `string` | Risk level |
| `confidence` | `number` | Confidence score |

---

## pixie.publicSpeak — Pixie Public Speech

**Purpose**: Pixie speaks as a third-party participant in public chat (e.g., breaking ice, pushing plans, easing awkwardness).

### Request Format

```typescript
POST /api/trpc/pixie.publicSpeak

{
  "json": {
    "persona": "lumi",         // Optional
    "pixieName": "Lumi",                     // Optional | Pixie display name
    "ownerName": "Lucy",                     // Optional | User display name
    "otherName": "Pat",                      // Optional | Other person's display name
    "chatContext": [                          // Optional | Recent chat history
      { "senderName": "Lucy", "senderType": "human", "content": "I'm so tired today" },
      { "senderName": "Pat", "senderType": "human", "content": "What happened?" }
    ],
    "triggerMessage": "Nothing, just worked overtime",  // Required | The message that triggered Pixie
    "triggerBy": "owner"                      // Required | Who sent it: "owner" or "other"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `persona` | `string` | No | Persona |
| `pixieName` | `string` | No | Pixie's display name in chat |
| `ownerName` | `string` | No | User's display name in chat |
| `otherName` | `string` | No | Other person's display name |
| `chatContext` | `Array` | No | Recent chat history |
| `triggerMessage` | `string` | Yes | The message that triggered this judgment |
| `triggerBy` | `"owner" \| "other"` | Yes | Who sent the trigger message |

### Response Format

Same as `autoContext` (`PresenceResponse` format).

---

## askLumi.ask — Ask Lumi (3-Tier Safety)

**Purpose**: For when user is emotionally distressed or needs deep support. 3-tier safety architecture: keyword filtering → emotion classification → mode-based response.

### Request Format

```typescript
POST /api/trpc/askLumi.ask

{
  "json": {
    "userMessage": "I feel so lonely, nobody really cares about me",  // Required | User message
    "chatContext": [                                // Optional | Recent conversation
      { "role": "user", "content": "Had dinner alone again today" },
      { "role": "other", "content": "" }
    ],
    "userStyle": {                                  // Optional | User preference
      "tone": "warm",
      "language": "en",
      "avoid": ["lecturing", "too formal"]
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userMessage` | `string` | Yes | User message (cannot be empty) |
| `chatContext` | `Array` | No | Recent conversation history |
| `chatContext[].role` | `string` | Yes | `"user"`/`"other"`/`"assistant"` |
| `chatContext[].content` | `string` | Yes | Message content |
| `chatContext[].timestamp` | `string` | No | Timestamp |
| `userStyle` | `object` | No | User preferences |
| `userStyle.tone` | `string` | No | `"safe"`/`"warm"`/`"playful"`/`"direct"` |
| `userStyle.language` | `string` | No | `"zh"`/`"en"`/`"mixed"` |
| `userStyle.avoid` | `string[]` | No | Expressions to avoid |

### Response Format

Response varies by risk level into three modes:

**Low Risk — social_soothing**:

```json
{
  "analysis": {
    "scene": "loneliness",
    "emotions": ["lonely", "sad"],
    "intensity": 6,
    "risk_level": "low",
    "user_need": "emotional_support",
    "thinking_trap": ["catastrophizing"],
    "should_generate_reply": true,
    "mode": "social_soothing"
  },
  "response": {
    "mode": "social_soothing",
    "your_vibe_right_now": "You're feeling overlooked and a bit hurt right now.",
    "watch_outs": ["Don't send messages to anyone in this mood", "Loneliness amplifies negative interpretations"],
    "what_i_think_you_mean": "You want to be seen and cared about.",
    "try_sending_this": "Hey, been thinking about you lately. Free to chat?",
    "alternatives": {
      "safe": "Hey, it's been a while! How have you been?",
      "warm": "Just thought of you randomly — hope you're doing well ☺️",
      "playful": "Did you forget about me? 😤"
    },
    "tiny_next_move": "Pick one person you trust and send them a message. You don't need to explain why.",
    "risk": "Low",
    "confidence": 0.88,
    "voice_match": 0.82
  },
  "safetyFlagged": false
}
```

**Medium Risk — grounding**:

```json
{
  "analysis": { "risk_level": "medium", "mode": "grounding", "...": "..." },
  "response": {
    "mode": "grounding",
    "your_vibe_right_now": "Your emotions are running a bit out of control right now.",
    "first": "Stop. Take three deep breaths.",
    "grounding_steps": [
      "Put your phone down for 5 minutes.",
      "Drink a glass of water.",
      "Name three things you can see right now."
    ],
    "tiny_next_move": "Wait until you feel calmer before deciding whether to reply.",
    "optional_reply_later": "When you're ready, try: 'I need a moment to think about this.'",
    "risk": "Medium"
  },
  "safetyFlagged": false
}
```

**High Risk — crisis_redirect**:

```json
{
  "analysis": { "risk_level": "high", "mode": "crisis_redirect", "...": "..." },
  "response": {
    "mode": "crisis_redirect",
    "message": "I hear you — this sounds serious. Please don't face this alone.",
    "actions": [
      "If you're in immediate danger, call emergency services (911 / 999 / 112).",
      "Call a crisis helpline: 988 Suicide & Crisis Lifeline (US) or text HOME to 741741.",
      "Reach out to someone you trust and ask them to be with you right now."
    ],
    "risk": "High"
  },
  "safetyFlagged": true
}
```

---

## Error Handling

tRPC error response format:

```json
{
  "error": {
    "message": "Error description",
    "code": -32600,
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "pixie.liveChat"
    }
  }
}
```

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 400 | Bad request parameters | Check input format |
| 500 | LLM call failed | Retry (max 2 times) |
| 408 | Timeout | LLM response timeout, retry |

**Recommended retry strategy**:

```typescript
async function callPixieWithRetry<T>(procedure: string, input: any, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await callPixie<T>(procedure, input);
    } catch (err) {
      if (i === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Incremental backoff
    }
  }
  throw new Error("Unreachable");
}
```

---

## Rate Limits & Best Practices

| Recommendation | Details |
|----------------|---------|
| **Per-user rate** | ≤ 10 req/min (exceeding may trigger LLM rate limiting) |
| **Chat history length** | `chatContext` recommended ≤ 10 messages (longer increases latency and cost) |
| **liveChat messages** | Recommended ≤ 20 messages (truncate to most recent 20 if exceeded) |
| **Timeout setting** | Recommended 30s timeout (LLM occasionally needs 5-15s) |
| **Caching** | `autoContext` results can be cached for `cooldownTurns` turns |
| **Concurrency** | Avoid concurrent calls to the same endpoint for the same roomId |

---

## Full TypeScript Type Definitions

```typescript
// ===== Common Types =====

interface ChatMessage {
  senderName: string;
  senderType: "human" | "pixie" | "system";
  content: string;
}

interface TargetUser {
  name: string;
  relationshipStage: "new_match" | "casual_chat" | "friend" | "dating_interest" | "unknown";
}

interface ActivityIntent {
  activity: string;
  area: string;
  time: string;
}

interface UserVoiceProfile {
  tone: string[];
  messageLength: "short" | "medium" | "long";
  formality: "casual" | "semi_casual" | "formal";
  humorStyle: string;
  commonPhrases: string[];
  avoidPhrases: string[];
  flirtingStyle: string;
  conflictStyle: string;
  socialWeaknesses: string[];
}

type PersonaId = "lumi" | "foxxz";

// ===== Bubble Type =====

interface BubbleItem {
  type: "reaction" | "tease" | "advice" | "warning" | "question" | "suggested_message" | "comfort" | "action";
  text: string;
  emotion: "neutral" | "playful" | "worried" | "smug" | "serious" | "excited" | "soft";
  delayMs: number;
}

// ===== pixie.liveChat =====

interface LiveChatInput {
  persona?: PersonaId;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

interface LiveChatResponse {
  type: "structured" | "text";
  content: string;
  bubbles: BubbleItem[];
  suggestedAction: string;
  quickReplies: string[];
}

// ===== pixie.suggest =====

interface SuggestInput {
  roomId: string;
  userId: string;
  pixieId?: string;
  persona?: PersonaId;
  rawMessage: string;
  hintMode?: "icebreaker" | "rewrite" | "boundary" | "plan" | "whisper" | "offline_profile";
  targetUser?: TargetUser;
  activityIntent?: ActivityIntent;
  chatContext?: ChatMessage[];
  userVoiceProfile?: UserVoiceProfile;
}

interface SuggestResponse {
  detectedMode: string;
  detectedIntent: string;
  emotionDetected: string[];
  riskFlags: string[];
  rewriteStrategy: string;
  privateBubbles: BubbleItem[];
  suggestedPublicMessage: string;
  alternatives: { playful: string; softer: string; casual: string };
  userVoiceMatch: number;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
}

// ===== pixie.autoContext =====

interface AutoContextInput {
  roomId: string;
  userId: string;
  pixieId?: string;
  persona?: PersonaId;
  chatContext?: ChatMessage[];
  activityIntent?: ActivityIntent;
  ownerMemory?: {
    publicAchievements: string[];
    interests: string[];
  };
}

interface AutoContextResponse {
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

// ===== pixie.chat =====

interface ChatInput {
  roomId: string;
  userId: string;
  pixieId?: string;
  persona?: PersonaId;
  privateQuestion: string;
  chatContext?: ChatMessage[];
}

interface ChatResponse {
  responseStyle: "single" | "multi" | "clarify" | "interrupt";
  visibility: "private" | "public_suggestion" | "public_pixie";
  bubbles: BubbleItem[];
  suggestedPublicMessage: string | null;
  quickReplies: string[];
  riskLevel: "low" | "medium" | "high";
  confidence: number;
}

// ===== pixie.publicSpeak =====

interface PublicSpeakInput {
  persona?: PersonaId;
  pixieName?: string;
  ownerName?: string;
  otherName?: string;
  chatContext?: ChatMessage[];
  triggerMessage: string;
  triggerBy: "owner" | "other";
}

// Response: same as AutoContextResponse

// ===== askLumi.ask =====

interface AskLumiInput {
  userMessage: string;
  chatContext?: Array<{ role: "user" | "other" | "assistant"; content: string; timestamp?: string }>;
  userStyle?: { tone?: "safe" | "warm" | "playful" | "direct"; language?: "zh" | "en" | "mixed"; avoid?: string[] };
}

interface AskLumiResponse {
  analysis: {
    scene: "dating_chat" | "friendship" | "loneliness" | "stress" | "conflict" | "unknown";
    emotions: string[];
    intensity: number;
    risk_level: "low" | "medium" | "high";
    user_need: "help_reply" | "calm_down" | "reality_check" | "emotional_support" | "crisis_support";
    thinking_trap: string[];
    should_generate_reply: boolean;
    mode: "social_soothing" | "grounding" | "reality_check" | "crisis_redirect";
  };
  response: SocialSoothingResponse | GroundingResponse | CrisisRedirectResponse;
  safetyFlagged: boolean;
}
```

---

## Integration Recommendations for Your App

### Scenario Mapping

| App Scenario | Endpoint | Trigger |
|--------------|----------|---------|
| User taps "Ask Lumi" in DM | `pixie.suggest` | User-triggered |
| Pixie auto-shows whisper reminder | `pixie.autoContext` | Background call every 3-5 new messages |
| User opens Pixie standalone chat | `pixie.liveChat` | User sends message |
| Pixie speaks publicly in group chat | `pixie.publicSpeak` | Background judgment on new messages |
| User in emotional distress, needs deep support | `askLumi.ask` | Detected high emotional intensity |
| User privately asks Pixie in chat | `pixie.chat` | User taps whisper button |

### Recommended Call Flow

```
User sends message →
  ├─ Frontend: Send message normally
  └─ Background: Call pixie.autoContext
       ├─ shouldSpeak=true, visibility="private_whisper" → Show whisper bubble
       ├─ shouldSpeak=true, visibility="public_pixie" → Pixie speaks publicly
       └─ shouldSpeak=false → Do nothing

User taps "Ask Lumi" →
  └─ Call pixie.suggest → Display privateBubbles + suggestedPublicMessage

User opens Pixie chat →
  └─ Call pixie.liveChat → Render bubbles (with delayMs animation)
```
