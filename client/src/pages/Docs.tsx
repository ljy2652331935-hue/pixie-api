import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Sparkles, ChevronRight, Copy, Check } from "lucide-react";

// - Types -

interface Section {
  id: string;
  label: string;
}

// - Constants -

const SECTIONS: Section[] = [
  { id: "overview", label: "Overview" },
  { id: "personas", label: "Persona System" },
  { id: "modes", label: "Suggestion Modes" },
  { id: "api-suggest", label: "pixie.suggest" },
  { id: "api-chat", label: "pixie.chat" },
  { id: "api-autocontext", label: "pixie.autoContext" },
  { id: "prompts", label: "Prompt Architecture" },
];

const PERSONAS = [
  { id: "lumi", name: "Lumi", label: "Warm Bestie Pixie", emoji: "✨", traits: "Cute, lively, warm, quick-witted, fiercely protective. Hugs first, helps after. Lucy's personal magic bestie." },
  { id: "foxxz", name: "Foxxz", label: "Gentleman Fox Strategist", emoji: "🦊", traits: "Witty, composed, fox-like charm, strong social strategy. Reads the room first, then helps you win. Pat's charisma fox curator." },
];

const MODES = [
  { id: "icebreaker", label: "Icebreaker", desc: "Help the user start a conversation naturally. Light, low-pressure, easy to decline." },
  { id: "rewrite", label: "Rewrite", desc: "Rewrite a message that sounds wrong — too aggressive, cold, awkward, or eager. Keep the original intent." },
  { id: "boundary", label: "Boundary", desc: "Express discomfort or push back without burning bridges. Firm but not aggressive." },
  { id: "plan", label: "Plan", desc: "Move from vague chatting to a concrete plan. Activity + Time + Place + Confirmation." },
  { id: "whisper", label: "Whisper", desc: "Private consultation. The other party cannot see this. Personality shines most here." },
  { id: "offline_profile", label: "Offline Profile", desc: "Transparent info card. Identifies as Pixie, not the user. Never impersonates." },
];

// - Code Block -

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
  const [copied, setCopied2] = useState(false);
  const handleCopy2 = async () => {
    await navigator.clipboard.writeText(code);
    setCopied2(true);
    setTimeout(() => setCopied2(false), 2000);
  };
  return (
    <div className="relative group rounded-xl overflow-hidden border border-border/60 bg-[oklch(0.09_0.015_265)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
        <span className="text-xs font-mono text-muted-foreground/60">{lang}</span>
        <button onClick={handleCopy2} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="text-slate-300 font-mono">{code}</code>
      </pre>
    </div>
  );
}

// - Section Header -

function SectionHeader({ id, badge, title, desc }: { id: string; badge: string; title: string; desc: string }) {
  return (
    <div id={id} className="scroll-mt-24 mb-6">
      <Badge variant="outline" className="mb-3 text-xs border-primary/30 text-primary bg-primary/5 font-mono">{badge}</Badge>
      <h2 className="font-display text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

// - Field Table -

function FieldTable({ fields }: { fields: { name: string; type: string; required?: boolean; desc: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Field</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Required</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => (
            <tr key={f.name} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
              <td className="px-4 py-2.5 font-mono text-xs text-primary">{f.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{f.type}</td>
              <td className="px-4 py-2.5 text-xs">
                {f.required ? (
                  <span className="text-amber-400">required</span>
                ) : (
                  <span className="text-muted-foreground/50">optional</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// - Main Page -

export default function Docs() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pixie-gradient flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm">API Docs</span>
            </div>
          </div>
          <Link href="/playground">
            <Button size="sm" className="bg-pixie-gradient text-white border-0 text-xs">
              Open Playground
            </Button>
          </Link>
        </div>
      </nav>

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 fixed top-16 bottom-0 left-0 border-r border-border/50 bg-background/80 backdrop-blur-xl overflow-y-auto">
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">Contents</div>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 lg:ml-56 min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">

            {/* - Overview - */}
            <section>
              <SectionHeader
                id="overview"
                badge="OVERVIEW"
                title="Pixie API"
                desc="A tRPC-based AI social co-pilot API. All LLM calls and persona prompts are handled server-side — zero prompt leakage to the client."
              />
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Transport", value: "tRPC v11" },
                  { label: "Auth", value: "Public procedures" },
                  { label: "LLM", value: "Server-side only" },
                ].map(i => (
                  <div key={i.label} className="p-4 rounded-xl border border-border/60 bg-card text-center">
                    <div className="text-xs text-muted-foreground mb-1">{i.label}</div>
                    <div className="font-mono text-sm font-semibold">{i.value}</div>
                  </div>
                ))}
              </div>
              <CodeBlock lang="typescript" code={`// All three procedures are under the pixie namespace
trpc.pixie.suggest.useMutation()
trpc.pixie.chat.useMutation()
trpc.pixie.autoContext.useMutation()
trpc.pixie.personas.useQuery()   // Get persona list`} />
            </section>

            {/* - Personas - */}
            <section>
              <SectionHeader
                id="personas"
                badge="PERSONA SYSTEM"
                title="Two Exclusive Pixies"
                desc="Lumi and Foxxz each have their own voice, tone, and personality. All persona system prompts are assembled server-side, never exposed to the client."
              />
              <div className="space-y-3 mb-6">
                {PERSONAS.map((p) => (
                  <div key={p.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    <div className="text-2xl flex-shrink-0">{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.label}</span>
                        <code className="text-xs font-mono text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded ml-auto">{p.id}</code>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.traits}</p>
                    </div>
                  </div>
                ))}
              </div>
              <CodeBlock lang="typescript" code={`type PersonaId =
  | "lumi"   // Lumi ✨ — Lucy's warm bestie pixie
  | "foxxz";    // Foxxz 🦊 — Pat's gentleman fox strategist`} />
            </section>

            {/* - Modes - */}
            <section>
              <SectionHeader
                id="modes"
                badge="SUGGESTION MODES"
                title="Six Expression Modes"
                desc="Used by pixie.suggest to shape how Lumi approaches the user's message. Each mode has specific goals, rules, and output behavior."
              />
              <div className="space-y-3 mb-6">
                {MODES.map((m) => (
                  <div key={m.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    <code className="text-xs font-mono text-primary bg-primary/8 px-2 py-1 rounded flex-shrink-0 mt-0.5">{m.id}</code>
                    <div>
                      <div className="font-semibold text-sm mb-0.5">{m.label}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <CodeBlock lang="typescript" code={`type ModeId =
  | "icebreaker"
  | "rewrite"
  | "boundary"
  | "plan"
  | "whisper"
  | "offline_profile";`} />
            </section>

            {/* - pixie.suggest - */}
            <section>
              <SectionHeader
                id="api-suggest"
                badge="pixie.suggest"
                title="Expression Suggestion"
                desc="Analyzes the user's raw message through five-layer internal reasoning, returns private pixie bubbles + suggested public message. Supports both Lumi and Foxxz personas."
              />
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Input</h3>
                  <FieldTable fields={[
                    { name: "roomId", type: "string", required: true, desc: "Room or session identifier" },
                    { name: "userId", type: "string", required: true, desc: "User identifier" },
                    { name: "persona", type: "PersonaId", required: false, desc: "Persona to use. Default: lumi" },
                    { name: "rawMessage", type: "string", required: true, desc: "The user's raw message or intent" },
                    { name: "targetUser", type: "object", required: false, desc: "{ name, relationshipStage } — context about the other person" },
                    { name: "activityIntent", type: "object", required: false, desc: "{ activity, area, time } — for plan mode" },
                    { name: "chatContext", type: "ChatMessage[]", required: false, desc: "Recent chat history for context" },
                    { name: "userVoiceProfile", type: "object", required: false, desc: "User's voice style preferences" },
                  ]} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Output</h3>
                  <FieldTable fields={[
                    { name: "detectedMode", type: "string", required: true, desc: "Auto-detected intent mode" },
                    { name: "detectedIntent", type: "string", required: true, desc: "User's real intended meaning" },
                    { name: "emotionDetected", type: "string[]", required: true, desc: "User's current emotional state" },
                    { name: "riskFlags", type: "string[]", required: true, desc: "Social risks in the original message" },
                    { name: "rewriteStrategy", type: "string", required: true, desc: "Pixie's rewrite strategy reasoning" },
                    { name: "privateBubbles", type: "BubbleItem[]", required: true, desc: "Pixie's private response bubbles (with delayMs)" },
                    { name: "suggestedPublicMessage", type: "string", required: true, desc: "The improved message the user can send" },
                    { name: "userVoiceMatch", type: "number", required: true, desc: "0.0–1.0 match with user's natural voice" },
                    { name: "riskLevel", type: "low | medium | high", required: true, desc: "Overall risk assessment" },
                    { name: "confidence", type: "number", required: true, desc: "0.0–1.0 confidence in the suggestion" },
                  ]} />
                </div>
                <CodeBlock lang="typescript" code={`const suggest = trpc.pixie.suggest.useMutation();

suggest.mutate({
  roomId: "room-123",
  userId: "user-456",
  persona: "lumi",
  rawMessage: "Hey so like... do you maybe wanna hang out sometime or whatever",
  chatContext: [
    { senderName: "Alex", senderType: "human", content: "Hey! I saw you're into hiking too 🏔️" },
    { senderName: "Jordan", senderType: "human", content: "Yeah! I go every weekend." },
  ],
});

// Response:
// {
//   detectedMode: "invite",
//   detectedIntent: "User wants to invite Alex to hang out but sounds too casual/uncertain",
//   privateBubbles: [
//     { type: "tease", text: "Bestie, 'or whatever' is doing too much.", emotion: "smug", delayMs: 0 },
//     { type: "advice", text: "Say what you actually want. Specific > vague.", emotion: "playful", delayMs: 800 },
//   ],
//   suggestedPublicMessage: "Hey, want to check out a trail this weekend? I know a good one.",
//   riskLevel: "low",
//   confidence: 0.92
// }`} />
              </div>
            </section>

            {/* - pixie.chat - */}
            <section>
              <SectionHeader
                id="api-chat"
                badge="pixie.chat"
                title="Private Chat"
                desc="Private consultation with Lumi. The user asks anything — social advice, emotional support, reality checks. Returns bubbles in the unified format."
              />
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Input</h3>
                  <FieldTable fields={[
                    { name: "roomId", type: "string", required: true, desc: "Room or session identifier" },
                    { name: "userId", type: "string", required: true, desc: "User identifier" },
                    { name: "persona", type: "PersonaId", required: false, desc: "Persona to use. Default: lumi" },
                    { name: "privateQuestion", type: "string", required: true, desc: "The user's private question or message to Lumi" },
                    { name: "chatContext", type: "ChatMessage[]", required: false, desc: "Optional public chat context for reference" },
                  ]} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Output (Bubbles Response)</h3>
                  <FieldTable fields={[
                    { name: "responseStyle", type: "single | multi | clarify | interrupt", required: true, desc: "How Lumi is responding" },
                    { name: "visibility", type: "private | public_suggestion | public_pixie", required: true, desc: "Who can see this response" },
                    { name: "bubbles", type: "BubbleItem[]", required: true, desc: "Sequential response bubbles with delayMs for animation" },
                    { name: "suggestedPublicMessage", type: "string | null", required: true, desc: "Optional message the user can send publicly" },
                    { name: "quickReplies", type: "string[]", required: true, desc: "Quick reply options for the user" },
                    { name: "riskLevel", type: "low | medium | high", required: true, desc: "Risk level of the situation" },
                    { name: "confidence", type: "number", required: true, desc: "0.0–1.0 confidence" },
                  ]} />
                </div>
                <CodeBlock lang="typescript" code={`const chat = trpc.pixie.chat.useMutation();

chat.mutate({
  roomId: "room-123",
  userId: "user-456",
  persona: "calm_strategist",
  privateQuestion: "They haven't replied in 3 days. Should I double text?",
});

// Response:
// {
//   responseStyle: "multi",
//   visibility: "private",
//   bubbles: [
//     { type: "reaction", text: "Three days. Okay.", emotion: "neutral", delayMs: 0 },
//     { type: "advice", text: "Don't double text. The message landed. Give it space.", emotion: "serious", delayMs: 900 },
//     { type: "question", text: "Was the last message a question or a statement?", emotion: "neutral", delayMs: 1800 },
//   ],
//   quickReplies: ["It was a question", "It was a statement", "I'm not sure"],
//   riskLevel: "low",
//   confidence: 0.88
// }`} />
              </div>
            </section>

            {/* - pixie.autoContext - */}
            <section>
              <SectionHeader
                id="api-autocontext"
                badge="pixie.autoContext"
                title="Auto-Context Reading"
                desc="Lumi reads the current chat context and decides whether to speak — and if so, what to say and how. A good Pixie knows when to stay silent."
              />
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Input</h3>
                  <FieldTable fields={[
                    { name: "roomId", type: "string", required: true, desc: "Room or session identifier" },
                    { name: "userId", type: "string", required: true, desc: "User identifier (Pixie's owner)" },
                    { name: "persona", type: "PersonaId", required: false, desc: "Persona to use. Default: lumi" },
                    { name: "chatContext", type: "ChatMessage[]", required: true, desc: "Current chat messages to analyze" },
                    { name: "activityIntent", type: "object", required: false, desc: "{ activity, area, time } — known activity intent" },
                    { name: "ownerMemory", type: "object", required: false, desc: "{ publicAchievements, interests } — public info Lumi can mention" },
                  ]} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Output (Presence Response)</h3>
                  <FieldTable fields={[
                    { name: "shouldSpeak", type: "boolean", required: true, desc: "Whether Lumi should intervene" },
                    { name: "visibility", type: "public_pixie | private_whisper | none", required: true, desc: "Where the message appears" },
                    { name: "interventionType", type: "string", required: true, desc: "boost_owner | bridge_topic | break_ice | plan_push | safety_check | clarify_misunderstanding | owner_requested | stay_silent" },
                    { name: "reason", type: "string", required: true, desc: "Why Lumi decided to speak or stay silent" },
                    { name: "message", type: "string | null", required: true, desc: "Lumi's message (null if staying silent)" },
                    { name: "suggestedNextAction", type: "string", required: true, desc: "none | ask_question | suggest_reply | update_plan | add_to_plan_card | wait" },
                    { name: "planUpdate", type: "object", required: true, desc: "{ activity, time, place, notes } — extracted plan details" },
                    { name: "cooldownTurns", type: "number", required: true, desc: "How many turns before Lumi can speak again" },
                    { name: "riskLevel", type: "low | medium | high", required: true, desc: "Risk level of the situation" },
                    { name: "confidence", type: "number", required: true, desc: "0.0–1.0 confidence" },
                  ]} />
                </div>
                <CodeBlock lang="typescript" code={`const autoContext = trpc.pixie.autoContext.useMutation();

autoContext.mutate({
  roomId: "room-123",
  userId: "user-456",
  persona: "lumi",
  chatContext: [
    { senderName: "Alex", senderType: "human", content: "I love hiking! Do you go often?" },
    { senderName: "Jordan", senderType: "human", content: "Yeah every weekend! We should go sometime." },
    { senderName: "Alex", senderType: "human", content: "Totally! Maybe this weekend?" },
  ],
  ownerMemory: {
    publicAchievements: ["completed 3 marathons"],
    interests: ["hiking", "photography", "coffee"],
  },
});

// Response:
// {
//   shouldSpeak: true,
//   visibility: "public_pixie",
//   interventionType: "plan_push",
//   reason: "Both users expressed interest in hiking together — good moment to push toward a concrete plan",
//   message: "Lumi jumping in — Saturday morning works great for Jordan! Mist Trail or something closer?",
//   planUpdate: { activity: "hiking", time: "this weekend", place: null, notes: null },
//   cooldownTurns: 3,
//   riskLevel: "low",
//   confidence: 0.91
// }`} />
              </div>
            </section>

            {/* - Prompt Architecture - */}
            <section>
              <SectionHeader
                id="prompts"
                badge="PROMPT ARCHITECTURE"
                title="Two-Layer Prompt System"
                desc="All system prompts are assembled server-side using a two-layer architecture. Clients never see the prompt content."
              />
              <div className="space-y-4 mb-6">
                {[
                  {
                    badge: "LAYER 1",
                    title: "Base System Prompt",
                    desc: "Shared by all personas. Defines core identity, universal safety rules (10 rules), risk level guide, and language requirements. HIGHEST PRIORITY.",
                    color: "border-primary/30 bg-primary/5",
                  },
                  {
                    badge: "LAYER 1",
                    title: "Conversation Realism Prompt",
                    desc: "Defines how Lumi should sound: like a real friend, not a therapist or corporate AI. Response pacing rules, forbidden AI phrases, and natural reaction patterns.",
                    color: "border-primary/30 bg-primary/5",
                  },
                  {
                    badge: "LAYER 2",
                    title: "Persona Prompt",
                    desc: "Personality-specific instructions for each of the 6 personas. Defines tone, allowed phrases, forbidden behaviors, and response rhythm.",
                    color: "border-violet-500/30 bg-violet-500/5",
                  },
                  {
                    badge: "LAYER 2",
                    title: "Mode / Context Prompt",
                    desc: "Scenario-specific instructions (SUGGESTION mode, CHAT whisper, or AUTO_CONTEXT presence). Defines goals, rules, and output expectations for the current task.",
                    color: "border-amber-500/30 bg-amber-500/5",
                  },
                  {
                    badge: "OUTPUT",
                    title: "Output Schema",
                    desc: "Strict JSON schema definition. Each prompt type has its own schema: Bubbles Response (SUGGESTION/CHAT), Suggest Response (suggest), or Presence Response (AUTO_CONTEXT).",
                    color: "border-emerald-500/30 bg-emerald-500/5",
                  },
                ].map((l) => (
                  <div key={l.title} className={`p-4 rounded-xl border ${l.color}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-xs font-mono border-current">{l.badge}</Badge>
                      <span className="font-semibold text-sm">{l.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{l.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Prompt Type Labels</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "SUGGESTION", fn: "assembleSuggestionPrompt(persona, mode)", desc: "For suggestion endpoint with explicit mode" },
                    { label: "CHAT", fn: "assembleChatPrompt(persona)", desc: "For private chat with Lumi" },
                    { label: "AUTO_CONTEXT", fn: "assembleAutoContextPrompt(persona)", desc: "For presence/auto-context reading" },
                  ].map((t) => (
                    <div key={t.label} className="p-3 rounded-xl border border-border/60 bg-card">
                      <code className="text-xs font-mono text-primary block mb-1">{t.label}</code>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <CodeBlock lang="typescript" code={`// Server-side only — never exposed to client
import { assembleSuggestionPrompt, assembleChatPrompt, assembleAutoContextPrompt } from "./pixie-prompts";

// Assembly order: BASE → REALISM → PERSONA → MODE → OUTPUT_SCHEMA
const suggestionPrompt = assembleSuggestionPrompt("lumi", "rewrite");
const chatPrompt = assembleChatPrompt("calm_strategist");
const autoContextPrompt = assembleAutoContextPrompt("elegant_gentleman");`} />
            </section>

            {/* Bottom nav */}
            <div className="flex items-center justify-between pt-8 border-t border-border/50">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-border/60">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Home
                </Button>
              </Link>
              <Link href="/playground">
                <Button size="sm" className="bg-pixie-gradient text-white border-0">
                  Try in Playground
                  <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
