import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Sparkles, MessageCircle, Eye, Copy, Check, Users, Layers } from "lucide-react";
import { useState } from "react";

// ─── Persona & Mode data ──────────────────────────────────────

const PERSONAS = [
  { id: "sassy_roast_bestie", name: "Lumi", label: "Sassy Roast Bestie", desc: "Sharp-tongued, protective, will roast your overthinking but never shame you.", traits: ["sassy", "playful", "loyal", "protective", "emotionally sharp"] },
  { id: "smooth_witty_fox", name: "Lumi", label: "Smooth Witty Fox", desc: "Clever, witty, relaxed. Sees through the situation without being pretentious. Helps you appear more chill and boundaried.", traits: ["clever", "witty", "charming", "street-smart", "calm under pressure"] },
  { id: "elegant_gentleman", name: "Soren", label: "Elegant Gentleman", desc: "Restrained, polite, refined. Helps you express yourself with dignity and clarity.", traits: ["elegant", "polite", "measured", "dignified", "calm"] },
  { id: "loyal_bro", name: "Koda", label: "Loyal Bro", desc: "Straightforward, always on your side, no nonsense. Helps you say what you mean without getting taken advantage of.", traits: ["loyal", "direct", "protective", "straightforward", "reliable"] },
  { id: "soft_social_anxiety_helper", name: "Mimi", label: "Soft Social Anxiety Helper", desc: "Gentle, low-pressure, never rushes you. Helps you take small steps while giving both sides space.", traits: ["soft", "warm", "patient", "reassuring", "low-pressure"] },
  { id: "calm_strategist", name: "Orin", label: "Calm Strategist", desc: "Calm, concise, steady. Quickly assesses the situation, breaks down risks, and gives clear next steps.", traits: ["calm", "rational", "concise", "strategic", "grounded"] },
];

const MODES = [
  { id: "icebreaker", label: "Icebreaker", desc: "Help users start a conversation naturally, low-pressure, easy to exit" },
  { id: "rewrite", label: "Rewrite", desc: "Rewrite user's message to sound more natural and appropriate" },
  { id: "boundary", label: "Boundary", desc: "Express displeasure or decline with boundaries but without attacking" },
  { id: "plan", label: "Plan Push", desc: "Turn chat into a concrete activity plan" },
  { id: "whisper", label: "Whisper", desc: "Private consultation with Pixie, invisible to others" },
  { id: "offline_profile", label: "Offline Profile", desc: "Transparent interaction card when user is offline" },
];

export default function Docs() {
  return (
    <div className="min-h-screen cosmic-bg">
      {/* Nebula decorations */}
      <div className="cosmic-nebula w-[500px] h-[500px] bg-[oklch(0.5_0.18_290)] top-[-150px] left-[-150px]" />
      <div className="cosmic-nebula w-[350px] h-[350px] bg-[oklch(0.6_0.14_192)] bottom-[10%] right-[-100px]" />

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold text-foreground">API Docs</span>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 px-6 pb-16 max-w-5xl mx-auto space-y-12">
        {/* Overview */}
        <section className="cosmic-card rounded-xl p-8">
          <h1 className="text-3xl font-bold text-foreground cosmic-glow mb-4">Pixie API Documentation</h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Pixie is the AI social co-pilot system for the Sponty platform. It provides three core capability layers:
            Suggestion, Private Chat, and Auto Context (Presence).
            It supports a two-layer combination system of 6 personas and 6 modes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            All APIs are called via the tRPC protocol with base path <code className="px-2 py-0.5 rounded bg-secondary text-primary font-mono text-sm">/api/trpc/pixie.*</code>.
          </p>
        </section>

        {/* Persona System */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Persona System
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Each request can select a different AI persona via the <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-xs">persona</code> parameter.
            The persona determines the tone, style, and attitude of responses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERSONAS.map((p) => (
              <div key={p.id} className="rounded-lg bg-secondary/30 border border-border/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-foreground">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                    {p.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{p.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {p.traits.map((t) => (
                    <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
                <code className="block mt-2 text-xs font-mono text-primary/70">{p.id}</code>
              </div>
            ))}
          </div>
        </section>

        {/* Mode System */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Mode System
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Modes determine the current functional scenario. The Suggestion API switches via the <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-xs">mode</code> parameter,
            the Chat API uses whisper mode by default, and the Auto Context API automatically determines the applicable mode.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mode ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Applicable API</th>
                </tr>
              </thead>
              <tbody>
                {MODES.map((m) => (
                  <tr key={m.id} className="border-b border-border/30">
                    <td className="py-3 px-4 font-mono text-primary text-xs">{m.id}</td>
                    <td className="py-3 px-4 text-foreground font-medium">{m.label}</td>
                    <td className="py-3 px-4 text-muted-foreground">{m.desc}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {m.id === "whisper" ? "Chat" : m.id === "offline_profile" ? "Auto Context" : "Suggestion"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Two-Layer Architecture */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Two-Layer Prompt Architecture</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The system uses a two-layer assembly architecture, dynamically composing prompts on each API call:
          </p>
          <div className="space-y-3">
            {[
              { layer: "Layer 1", name: "Base System Prompt", desc: "Global safety rules + universal behavior norms (shared by all personas)" },
              { layer: "Layer 2a", name: "Persona Prompt", desc: "Persona personality + tone + allowed/forbidden phrases" },
              { layer: "Layer 2b", name: "Mode Prompt", desc: "Current mode's functional goals + rules" },
              { layer: "Layer 3", name: "Output Schema", desc: "Strict JSON output format definition" },
            ].map((item) => (
              <div key={item.layer} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <span className="text-xs font-mono text-primary whitespace-nowrap mt-0.5">{item.layer}</span>
                <div>
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Suggestion API */}
        <ApiSection
          icon={<Sparkles className="w-6 h-6" />}
          title="Pixie Suggestion API"
          endpoint="pixie.suggest"
          method="mutation"
          description="Analyzes the user's raw input and, based on social context and mode, provides more natural and appropriate expression suggestions. Supports persona and mode selection."
          requestFields={[
            { name: "roomId", type: "string", desc: "Chat room ID" },
            { name: "userId", type: "string", desc: "Current user ID" },
            { name: "pixieId", type: "string", desc: "Pixie ID, defaults to 'lumi'" },
            { name: "persona", type: "enum", desc: "Persona selection (default: sassy_roast_bestie)" },
            { name: "rawMessage", type: "string", desc: "User's raw input message" },
            { name: "mode", type: "enum", desc: "icebreaker | rewrite | boundary | plan (auto-detected if omitted)" },
            { name: "chatContext", type: "array", desc: "Array of chat context messages" },
          ]}
          responseFields={[
            { name: "detectedIntent", type: "string", desc: "What the user actually wants to express" },
            { name: "emotionDetected", type: "string[]", desc: "Array of detected emotions" },
            { name: "suggestedPublicMessage", type: "string", desc: "Suggested message (ready to send)" },
            { name: "privateBubbles", type: "array", desc: "Pixie's private comments/advice bubbles" },
            { name: "riskLevel", type: "enum", desc: "low | medium | high" },
            { name: "confidence", type: "number", desc: "Confidence score 0-1" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "persona": "smooth_witty_fox",
  "rawMessage": "I want to ask her to a movie but don't want it to be awkward.",
  "mode": "icebreaker",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "Anyone wanna watch a movie tonight?" }
  ]
}`}
          exampleResponse={`{
  "detectedIntent": "JiaYi wants a casual invitation without pressure.",
  "emotionDetected": ["nervous", "interested"],
  "suggestedPublicMessage": "Would you be up for watching something chill tonight? No pressure.",
  "privateBubbles": [{ "type": "advice", "text": "Don't chase, invite. Keep it light.", "emotion": "playful", "delayMs": 0 }],
  "riskLevel": "low",
  "confidence": 0.9
}`}
        />

        {/* Chat API */}
        <ApiSection
          icon={<MessageCircle className="w-6 h-6" />}
          title="Pixie Chat API"
          endpoint="pixie.chat"
          method="mutation"
          description="Users can privately chat with Pixie to get social advice, emotional support, and safety reminders. Uses whisper mode."
          requestFields={[
            { name: "roomId", type: "string", desc: "Chat room ID" },
            { name: "userId", type: "string", desc: "Current user ID" },
            { name: "pixieId", type: "string", desc: "Pixie ID, defaults to 'lumi'" },
            { name: "persona", type: "enum", desc: "Persona selection (default: sassy_roast_bestie)" },
            { name: "privateQuestion", type: "string", desc: "User's private question" },
            { name: "chatContext", type: "array", desc: "Public chat context" },
          ]}
          responseFields={[
            { name: "bubbles", type: "array", desc: "Pixie's private advice bubbles" },
            { name: "suggestedPublicMessage", type: "string | null", desc: "Optional suggested public reply" },
            { name: "quickReplies", type: "string[]", desc: "Quick reply suggestions" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "persona": "calm_strategist",
  "privateQuestion": "She said she wants to see a movie in Waterloo. Should I suggest a time?",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "How about the cinema near Waterloo?" }
  ]
}`}
          exampleResponse={`{
  "bubbles": [{ "type": "advice", "text": "Move from vague interest to a concrete plan. Suggest a specific time.", "emotion": "neutral", "delayMs": 0 }],
  "suggestedPublicMessage": "How about around 7pm tonight at the Waterloo cinema? Works for you?",
  "quickReplies": ["Use this message", "Make it more casual"]
}`}
        />

        {/* Auto Context API */}
        <ApiSection
          icon={<Eye className="w-6 h-6" />}
          title="Pixie Auto Context API"
          endpoint="pixie.autoContext"
          method="mutation"
          description="Automatically analyzes chat context to determine whether Pixie should speak, how to speak, and what follow-up actions to suggest."
          requestFields={[
            { name: "roomId", type: "string", desc: "Chat room ID" },
            { name: "userId", type: "string", desc: "Current user ID" },
            { name: "pixieId", type: "string", desc: "Pixie ID, defaults to 'lumi'" },
            { name: "persona", type: "enum", desc: "Persona selection (default: sassy_roast_bestie)" },
            { name: "chatContext", type: "array", desc: "Array of chat context messages" },
            { name: "activityIntent", type: "object?", desc: "Optional activity intent { activity, area, time }" },
          ]}
          responseFields={[
            { name: "shouldSpeak", type: "boolean", desc: "Whether Pixie should speak" },
            { name: "visibility", type: "enum", desc: "private | public" },
            { name: "reason", type: "string", desc: "Reason for speaking/silence" },
            { name: "message", type: "string | null", desc: "What Pixie wants to say" },
            { name: "interventionType", type: "enum", desc: "break_ice | plan_push | boost_owner | safety_check | none" },
            { name: "riskLevel", type: "enum", desc: "low | medium | high" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "persona": "sassy_roast_bestie",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "Anyone wanna watch a movie tonight?" },
    { "senderName": "JiaYi", "senderType": "human", "content": "I'm down!" }
  ],
  "activityIntent": { "activity": "movie", "area": "Waterloo", "time": "tonight" }
}`}
          exampleResponse={`{
  "shouldSpeak": true,
  "visibility": "public",
  "reason": "Activity intent is clear but missing specific time and venue",
  "message": "You both want to watch a movie but no one's pinning down the time. Let's lock it in.",
  "interventionType": "plan_push",
  "riskLevel": "low"
}`}
        />

        {/* Safety Boundaries */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Safety Boundary Rules</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The following safety rules apply to all personas and take priority over persona personality expression:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Never speak on behalf of the user or impersonate them",
              "Never encourage harassment, threats, insults, or manipulation",
              "Never assist with PUA tactics, silent treatment, or anxiety creation",
              "Never commit to offline meetups on behalf of the user",
              "Offline meetups must remind about public places + exit options",
              "Never attack identity, body, race, gender, etc.",
              "Public messages must identify as Pixie",
              "High-risk scenarios prioritize safety over sending",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/15">
                <span className="text-destructive text-xs mt-0.5">●</span>
                <span className="text-sm text-muted-foreground">{rule}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Risk Levels */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Risk Level Guide</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Level</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Scenario</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pixie Behavior</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">low</span></td>
                  <td className="py-3 px-4 text-muted-foreground">Normal social scenarios</td>
                  <td className="py-3 px-4 text-muted-foreground">Freely gives suggestions</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">medium</span></td>
                  <td className="py-3 px-4 text-muted-foreground">Boundary issues, mild offense, emotional escalation</td>
                  <td className="py-3 px-4 text-muted-foreground">De-escalates, provides polite expressions</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">high</span></td>
                  <td className="py-3 px-4 text-muted-foreground">Threats, harassment, privacy risk, dangerous meetups</td>
                  <td className="py-3 px-4 text-muted-foreground">Safety first, discourages sending</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ─── API Section Component ────────────────────────────────── */

function ApiSection({ icon, title, endpoint, method, description, requestFields, responseFields, example, exampleResponse }: {
  icon: React.ReactNode;
  title: string;
  endpoint: string;
  method: string;
  description: string;
  requestFields: Array<{ name: string; type: string; desc: string }>;
  responseFields: Array<{ name: string; type: string; desc: string }>;
  example: string;
  exampleResponse: string;
}) {
  return (
    <section className="cosmic-card rounded-xl p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-primary/15 text-primary border border-primary/25">
          {method}
        </span>
        <code className="text-sm font-mono text-muted-foreground">{endpoint}</code>
      </div>

      <p className="text-muted-foreground leading-relaxed">{description}</p>

      {/* Request fields */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Request Fields</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {requestFields.map((f) => (
                <tr key={f.name} className="border-b border-border/30">
                  <td className="py-2 px-3 font-mono text-primary text-xs">{f.name}</td>
                  <td className="py-2 px-3 font-mono text-muted-foreground text-xs">{f.type}</td>
                  <td className="py-2 px-3 text-muted-foreground">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response fields */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Response Fields</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {responseFields.map((f) => (
                <tr key={f.name} className="border-b border-border/30">
                  <td className="py-2 px-3 font-mono text-primary text-xs">{f.name}</td>
                  <td className="py-2 px-3 font-mono text-muted-foreground text-xs">{f.type}</td>
                  <td className="py-2 px-3 text-muted-foreground">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Example */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CodeBlock title="Request Example" code={example} />
        <CodeBlock title="Response Example" code={exampleResponse} />
      </div>
    </section>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg bg-[oklch(0.1_0.03_270)] border border-border/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs text-muted-foreground">{title}</span>
        <button onClick={handleCopy} className="text-muted-foreground hover:text-primary transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
