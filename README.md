# Pixie API — AI Social Co-Pilot

> A tRPC-based AI social companion API that helps users navigate social situations with two exclusive AI personas: **Lumi ✨** (warm bestie pixie) and **Foxxz 🦊** (gentleman fox strategist).

---

## Features

- **6 API Endpoints** — Suggest, Chat, LiveChat, AutoContext, PublicSpeak, AskLumi
- **Dual Persona System** — Lumi (warm, protective, playful) and Foxxz (suave, strategic, composed)
- **Multi-Bubble Response Format** — Animated chat bubbles with emotion tags and timing
- **3-Tier Safety Architecture** — Keyword filtering → emotion classification → mode-based response
- **Voice Match Scoring** — Responses adapt to user's communication style
- **Scene Type Detection** — Auto-classifies 12+ social scenarios
- **Full TypeScript** — End-to-end type safety with tRPC
- **Alternatives System** — Each suggestion includes playful, softer, and casual variants

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Tailwind CSS 4 + shadcn/ui |
| Backend | Express 4 + tRPC 11 |
| Database | MySQL / TiDB (via Drizzle ORM) |
| LLM | OpenAI-compatible API (GPT-4o, Claude, etc.) |
| Auth | Manus OAuth (optional, can be removed) |
| Runtime | Node.js 22+ |

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-username/pixie-api.git
cd pixie-api
pnpm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL/TiDB connection string (e.g., `mysql://user:pass@host:3306/pixie`) |
| `JWT_SECRET` | Random 64-char string for session cookies |
| `OPENAI_API_KEY` | OpenAI API key (or any OpenAI-compatible provider) |

**Optional variables (for full Manus platform integration):**

| Variable | Description |
|----------|-------------|
| `BUILT_IN_FORGE_API_URL` | Manus built-in API URL (provides LLM access) |
| `BUILT_IN_FORGE_API_KEY` | Manus built-in API key |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `ZHIPU_API_KEY` | ZhiPu API key (alternative LLM provider) |

> **Note:** If you only have an OpenAI API key, the system will use it directly. The `BUILT_IN_FORGE_*` variables are only needed when running on the Manus platform.

### 3. Set Up Database

```bash
pnpm db:push
```

This generates and applies Drizzle migrations to your MySQL database.

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000` (or next available port).

### 5. Build for Production

```bash
pnpm build
pnpm start
```

---

## Project Structure

```
pixie-api/
├── client/                          # React frontend (Vite)
│   └── src/
│       ├── pages/                   # Page components
│       │   ├── Home.tsx             # Landing page
│       │   ├── Playground.tsx       # Interactive API playground
│       │   ├── LiveChat.tsx         # Real-time companion chat demo
│       │   ├── AskLumi.tsx          # Deep emotional support demo
│       │   └── Docs.tsx             # API documentation page
│       ├── components/              # Reusable UI (shadcn/ui)
│       └── lib/trpc.ts             # tRPC client binding
├── server/
│   ├── _core/                       # Framework plumbing (do not edit)
│   │   ├── index.ts                 # Express server entrypoint
│   │   ├── env.ts                   # Environment variable mapping
│   │   ├── llm.ts                   # LLM invocation helper
│   │   └── ...
│   ├── pixie-prompts.ts             # All persona prompts + output schemas
│   ├── pixie-router.ts              # Core tRPC procedures
│   ├── ask-lumi-router.ts           # askLumi endpoint (3-tier safety)
│   ├── routers.ts                   # Router registry
│   └── db.ts                        # Database query helpers
├── drizzle/                         # Database schema & migrations
├── shared/                          # Shared types & constants
├── PIXIE_API_INTEGRATION_GUIDE.md   # Full HTTP API documentation
└── PIXIE_FASTAPI_REPLICATION_GUIDE.md  # Python/FastAPI replication guide
```

---

## API Endpoints

All endpoints are accessible via HTTP POST to `/api/trpc/{procedure}`.

**Request format:** `{ "json": { ...input } }`

**Response format:** `{ "result": { "data": { "json": { ...output } } } }`

| Endpoint | Purpose | Key Output |
|----------|---------|------------|
| `pixie.suggest` | Analyze + rewrite user's message | `suggestedPublicMessage`, `alternatives`, `riskFlags` |
| `pixie.chat` | Private whisper advice (single-turn) | `privateBubbles[]` with type/text/timing |
| `pixie.liveChat` | Multi-turn companion chat | `bubbles[]`, `quickReplies[]`, `sceneType` |
| `pixie.autoContext` | Should Pixie intervene? | `shouldSpeak`, `interventionType`, `planUpdate` |
| `pixie.publicSpeak` | Pixie speaks publicly as 3rd party | `shouldSpeak`, `message`, `visibility` |
| `askLumi.ask` | Deep support with 3-tier safety | `mode`, `response`, `risk`, `confidence` |
| `pixie.personas` | List available personas (GET) | `[{ id, name, emoji, traits }]` |

For complete request/response schemas and code examples, see **[PIXIE_API_INTEGRATION_GUIDE.md](./PIXIE_API_INTEGRATION_GUIDE.md)**.

---

## Persona System

| Persona | ID | Personality |
|---------|-----|-------------|
| Lumi ✨ | `lumi` | Warm, protective, playful bestie pixie. Speaks in short punchy bubbles. Comforts first, advises second. Never mean-spirited. |
| Foxxz 🦊 | `foxxz` | Suave gentleman fox strategist. Reads the room, gives elegant advice. Calm, composed, never rushed. |

### Prompt Architecture

```
SYSTEM PROMPT = BASE + REALISM + PERSONA + MODE/SCENARIO + OUTPUT_SCHEMA
```

- **BASE** — Core identity, safety rules, universal constraints
- **REALISM** — Natural conversation patterns, timing, bubble formatting
- **PERSONA** — Character voice, tone, example phrases, forbidden patterns
- **MODE** — Endpoint-specific behavior (suggest/chat/liveChat/etc.)
- **OUTPUT_SCHEMA** — JSON structure the LLM must return

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production (Vite + esbuild) |
| `pnpm start` | Run production server |
| `pnpm check` | TypeScript type checking |
| `pnpm test` | Run Vitest test suite |
| `pnpm db:push` | Generate and apply database migrations |
| `pnpm format` | Format code with Prettier |

---

## Testing

```bash
pnpm test
```

Tests cover all endpoints with real LLM calls:

- `pixie.suggest` — mode detection, response format, alternatives
- `pixie.chat` — bubble format, privacy
- `pixie.autoContext` — intervention logic, plan updates
- `pixie.liveChat` — multi-turn conversation, quickReplies
- `pixie.publicSpeak` — public speech, visibility control
- `askLumi.ask` — 3-tier safety (low/medium/high risk classification)

---

## Customization Guide

### Adding a New Persona

1. Add entry to `PERSONA_LIST` in `server/pixie-prompts.ts`
2. Add full prompt to `PERSONA_PROMPTS` object (voice, tone, example phrases, forbidden patterns)
3. The persona will automatically appear in `pixie.personas` and be selectable via `personaId` input

### Modifying Response Format

1. Edit the relevant `OUTPUT_SCHEMA` in `server/pixie-prompts.ts`
2. Update the parsing logic in `server/pixie-router.ts`
3. Update TypeScript types if needed

### Swapping LLM Provider

The system uses `invokeLLM()` from `server/_core/llm.ts` which is OpenAI-compatible. To use a different provider:

1. Set `OPENAI_API_KEY` to your provider's API key
2. If your provider uses a different base URL, modify `server/_core/llm.ts`

---

## Self-Hosting

The app runs as a **single Node.js process** (Express + tRPC + Vite SSR).

### Requirements
- Node.js 22+
- MySQL 8+ or TiDB
- OpenAI API key (or compatible)

### Docker

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Deployment Options

Compatible with any Node.js hosting:
- **Railway** — Connect GitHub repo, set env vars, deploy
- **Render** — Web Service, Node environment
- **Fly.io** — `fly launch` with Dockerfile
- **VPS** — PM2 + Nginx reverse proxy
- **Docker** — Use Dockerfile above

---

## Replication

Want to rebuild this in Python/FastAPI? See **[PIXIE_FASTAPI_REPLICATION_GUIDE.md](./PIXIE_FASTAPI_REPLICATION_GUIDE.md)** for a complete guide including all prompts, schemas, and endpoint implementations.

---

## License

MIT
