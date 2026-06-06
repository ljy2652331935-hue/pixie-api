import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Sparkles, MessageCircle, Eye, ArrowLeft, Loader2, Send, Copy, Check, Code, Users, AlertTriangle, Zap, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

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

// ─── Persona definitions (matches server) ─────────────────────

const PERSONAS = [
  { id: "sassy_roast_bestie", name: "Lumi", label: "Sassy Roast Bestie", emoji: "🔥" },
  { id: "smooth_witty_fox", name: "Lumi", label: "Smooth Witty Fox", emoji: "🦊" },
  { id: "elegant_gentleman", name: "Soren", label: "Elegant Gentleman", emoji: "🎩" },
  { id: "loyal_bro", name: "Koda", label: "Loyal Bro", emoji: "🤝" },
  { id: "soft_social_anxiety_helper", name: "Mimi", label: "Soft Social Anxiety Helper", emoji: "🌸" },
  { id: "calm_strategist", name: "Orin", label: "Calm Strategist", emoji: "🧊" },
] as const;

type PersonaId = (typeof PERSONAS)[number]["id"];

// ─── Persona Selector Component ───────────────────────────────

function PersonaSelector({ value, onChange }: { value: PersonaId; onChange: (v: PersonaId) => void }) {
  const selected = PERSONAS.find(p => p.id === value);
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        Persona
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as PersonaId)}>
        <SelectTrigger className="w-full bg-input border-border/50 text-foreground">
          <SelectValue>
            {selected && `${selected.emoji} ${selected.name} — ${selected.label}`}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {PERSONAS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                <span>{p.emoji}</span>
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground text-xs">— {p.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Bubbles Renderer ───────────────────────────────────────────

function BubblesRenderer({ response, personaName }: { response: BubblesResponse; personaName: string }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(0);
    setShowTyping(false);

    if (!response.bubbles.length) return;

    // Show first bubble immediately
    setVisibleCount(1);

    let timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let cumulativeDelay = 0;

    for (let i = 1; i < response.bubbles.length; i++) {
      const delay = response.bubbles[i].delayMs || 600;
      cumulativeDelay += delay;

      // Show typing indicator before each delayed bubble
      const typingId = setTimeout(() => {
        setShowTyping(true);
      }, cumulativeDelay - Math.min(delay, 400));
      timeoutIds.push(typingId);

      // Show the bubble
      const bubbleId = setTimeout(() => {
        setShowTyping(false);
        setVisibleCount(i + 1);
      }, cumulativeDelay);
      timeoutIds.push(bubbleId);
    }

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [response]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount, showTyping]);

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case "playful": return "border-l-[oklch(0.75_0.15_150)]";
      case "worried": return "border-l-[oklch(0.7_0.15_60)]";
      case "smug": return "border-l-[oklch(0.75_0.15_290)]";
      case "serious": return "border-l-[oklch(0.65_0.15_25)]";
      case "excited": return "border-l-[oklch(0.8_0.15_130)]";
      default: return "border-l-primary/50";
    }
  };

  const getBubbleTypeIcon = (type: string) => {
    switch (type) {
      case "reaction": return "💬";
      case "roast": return "🔥";
      case "advice": return "💡";
      case "warning": return "⚠️";
      case "question": return "❓";
      case "suggested_message": return "✉️";
      default: return "💬";
    }
  };

  const isInterrupt = response.responseStyle === "interrupt";

  return (
    <div ref={containerRef} className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {/* Response style & visibility badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isInterrupt
            ? "bg-destructive/15 text-destructive border border-destructive/30"
            : "bg-primary/15 text-primary border border-primary/25"
        }`}>
          {isInterrupt && <AlertTriangle className="w-3 h-3" />}
          {response.responseStyle}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/80 text-muted-foreground border border-border/50">
          {response.visibility}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          response.riskLevel === "high" ? "bg-destructive/15 text-destructive border border-destructive/30" :
          response.riskLevel === "medium" ? "bg-[oklch(0.7_0.12_60)]/15 text-[oklch(0.7_0.12_60)] border border-[oklch(0.7_0.12_60)]/30" :
          "bg-primary/15 text-primary border border-primary/25"
        }`}>
          risk: {response.riskLevel}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/80 text-muted-foreground border border-border/50">
          conf: {(response.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Bubbles */}
      {response.bubbles.slice(0, visibleCount).map((bubble, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 ${
            isInterrupt ? "animate-in shake" : ""
          }`}
        >
          <span className="text-sm mt-0.5 shrink-0">{getBubbleTypeIcon(bubble.type)}</span>
          <div className={`flex-1 p-3 rounded-xl rounded-tl-sm border-l-3 ${getEmotionColor(bubble.emotion)} ${
            isInterrupt && bubble.type === "warning"
              ? "bg-destructive/8 border border-destructive/20"
              : "bg-secondary/60 border border-border/30"
          }`}>
            <p className="text-sm text-foreground leading-relaxed">{bubble.text}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground/60 font-mono">{bubble.type}</span>
              <span className="text-[10px] text-muted-foreground/60">·</span>
              <span className="text-[10px] text-muted-foreground/60">{bubble.emotion}</span>
            </div>
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {showTyping && (
        <div className="flex items-center gap-2 animate-in fade-in duration-200">
          <span className="text-sm shrink-0">💭</span>
          <div className="px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/20">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground/50">{personaName} is typing...</span>
        </div>
      )}

      {/* Suggested Public Message */}
      {visibleCount >= response.bubbles.length && response.suggestedPublicMessage && (
        <div className="mt-4 p-3 rounded-xl bg-primary/8 border border-primary/25 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Suggested Message</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-2">{response.suggestedPublicMessage}</p>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => {
              navigator.clipboard.writeText(response.suggestedPublicMessage!);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Message
          </Button>
        </div>
      )}

      {/* Quick Replies */}
      {visibleCount >= response.bubbles.length && response.quickReplies.length > 0 && (
        <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-xs text-muted-foreground mb-2 block">Quick Replies:</span>
          <div className="flex flex-wrap gap-2">
            {response.quickReplies.map((reply, i) => (
              <button
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors"
                onClick={() => toast.info(`Selected: ${reply}`)}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function Playground() {
  return (
    <div className="min-h-screen cosmic-bg">
      {/* Nebula decorations */}
      <div className="cosmic-nebula w-[500px] h-[500px] bg-[oklch(0.5_0.18_290)] top-[-150px] right-[-100px]" />
      <div className="cosmic-nebula w-[400px] h-[400px] bg-[oklch(0.6_0.14_192)] bottom-[-100px] left-[-50px]" />

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
          <span className="text-lg font-bold text-foreground">Playground</span>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 px-6 pb-16 max-w-6xl mx-auto">
        <Tabs defaultValue="suggest" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50 backdrop-blur-sm border border-border/50 mb-8">
            <TabsTrigger value="suggest" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              Pixie Suggest
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <MessageCircle className="w-4 h-4 mr-2" />
              Private Chat
            </TabsTrigger>
            <TabsTrigger value="autoContext" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Eye className="w-4 h-4 mr-2" />
              Context Awareness
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggest">
            <SuggestPanel />
          </TabsContent>
          <TabsContent value="chat">
            <ChatPanel />
          </TabsContent>
          <TabsContent value="autoContext">
            <AutoContextPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ─── Suggest Panel (Pixie Suggest — auto-detect mode) ────────── */

interface SuggestResponse {
  detectedMode: string;
  detectedIntent: string;
  emotionDetected: string[];
  riskFlags: string[];
  rewriteStrategy: string;
  privateBubbles: Array<{ type: string; text: string; emotion: string; delayMs: number }>;
  suggestedPublicMessage: string;
  userVoiceMatch: number;
  riskLevel: string;
  confidence: number;
}

const RELATIONSHIP_STAGES = [
  { id: "new_match", label: "New Match" },
  { id: "casual_chat", label: "Casual Chat" },
  { id: "friend", label: "Friend" },
  { id: "dating_interest", label: "Dating Interest" },
  { id: "unknown", label: "Unknown" },
] as const;

function SuggestPanel() {
  const [persona, setPersona] = useState<PersonaId>("sassy_roast_bestie");
  const [rawMessage, setRawMessage] = useState("I want to ask her to an art exhibit this weekend, but I don't know how to start.");
  const [targetName, setTargetName] = useState("Alice");
  const [relationshipStage, setRelationshipStage] = useState("casual_chat");
  const [contextInput, setContextInput] = useState("Alice: I'm so bored lately\nJiaYi: Yeah, wanna find something to do");
  const [showVoiceProfile, setShowVoiceProfile] = useState(false);
  const [voiceTone, setVoiceTone] = useState("warm, expressive");
  const [voiceLength, setVoiceLength] = useState("short");
  const [voiceFormality, setVoiceFormality] = useState("casual");
  const [voiceHumorStyle, setVoiceHumorStyle] = useState("light teasing, self-aware");
  const [voiceCommonPhrases, setVoiceCommonPhrases] = useState("");
  const [voiceAvoidPhrases, setVoiceAvoidPhrases] = useState("too formal, too sexual, too desperate, too AI-like");
  const [voiceFlirtingStyle, setVoiceFlirtingStyle] = useState("low-pressure, sincere, not sexualized");
  const [voiceConflictStyle, setVoiceConflictStyle] = useState("avoidant at first, needs help setting boundaries");
  const [voiceSocialWeaknesses, setVoiceSocialWeaknesses] = useState("");
  const [result, setResult] = useState<SuggestResponse | null>(null);

  const mutation = trpc.pixie.suggest.useMutation({
    onSuccess: (data) => setResult(data as SuggestResponse),
  });

  const handleSubmit = () => {
    if (!rawMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    const contextErr = validateContextLines(contextInput);
    if (contextErr) {
      toast.error(contextErr);
      return;
    }

    const chatContext = contextInput
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, ...rest] = line.split(":");
        return {
          senderName: name.trim(),
          senderType: "human" as const,
          content: rest.join(":").trim(),
        };
      });

    const input: any = {
      roomId: "playground-room",
      userId: "testUser",
      pixieId: "lumi",
      persona,
      rawMessage,
      chatContext,
    };

    if (targetName.trim()) {
      input.targetUser = { name: targetName.trim(), relationshipStage };
    }

    if (showVoiceProfile) {
      input.userVoiceProfile = {
        tone: voiceTone.split(",").map((t: string) => t.trim()).filter(Boolean),
        messageLength: voiceLength,
        formality: voiceFormality,
        humorStyle: voiceHumorStyle,
        commonPhrases: voiceCommonPhrases.split(",").map((p: string) => p.trim()).filter(Boolean),
        avoidPhrases: voiceAvoidPhrases.split(",").map((p: string) => p.trim()).filter(Boolean),
        flirtingStyle: voiceFlirtingStyle,
        conflictStyle: voiceConflictStyle,
        socialWeaknesses: voiceSocialWeaknesses.split(",").map((w: string) => w.trim()).filter(Boolean),
      };
    }

    mutation.mutate(input);
  };

  const personaName = PERSONAS.find(p => p.id === persona)?.name ?? "Lumi";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input panel */}
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Pixie Suggest Request Parameters
        </h3>

        <div className="space-y-4">
          <PersonaSelector value={persona} onChange={setPersona} />

          {/* Raw message */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Raw Message (rawMessage)</label>
            <textarea
              value={rawMessage}
              onChange={(e) => setRawMessage(e.target.value)}
              className="w-full h-20 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="What do you want to say..."
            />
          </div>

          {/* Target user */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Target User (targetUser)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Name"
              />
              <Select value={relationshipStage} onValueChange={setRelationshipStage}>
                <SelectTrigger className="bg-input border-border/50 text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {RELATIONSHIP_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chat context */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Chat Context (one per line: Name: Content)</label>
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              className="w-full h-16 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alice: I'm so bored lately"
            />
          </div>

          {/* Voice profile toggle */}
          <div>
            <button
              onClick={() => setShowVoiceProfile(!showVoiceProfile)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <Users className="w-3 h-3" />
              {showVoiceProfile ? "Collapse" : "Expand"} Voice Profile (userVoiceProfile)
            </button>
            {showVoiceProfile && (
              <div className="mt-2 space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div>
                  <label className="text-xs text-muted-foreground">Tone (comma-separated)</label>
                  <input
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Message Length</label>
                    <Select value={voiceLength} onValueChange={setVoiceLength}>
                      <SelectTrigger className="bg-input border-border/50 text-foreground text-xs h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Formality</label>
                    <Select value={voiceFormality} onValueChange={setVoiceFormality}>
                      <SelectTrigger className="bg-input border-border/50 text-foreground text-xs h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="semi_casual">Semi-casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Humor Style (humorStyle)</label>
                  <input
                    value={voiceHumorStyle}
                    onChange={(e) => setVoiceHumorStyle(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Common Phrases (comma-separated)</label>
                  <input
                    value={voiceCommonPhrases}
                    onChange={(e) => setVoiceCommonPhrases(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                    placeholder="haha, really?, I think..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Avoid Phrases (comma-separated)</label>
                  <input
                    value={voiceAvoidPhrases}
                    onChange={(e) => setVoiceAvoidPhrases(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Flirting Style (flirtingStyle)</label>
                  <input
                    value={voiceFlirtingStyle}
                    onChange={(e) => setVoiceFlirtingStyle(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Conflict Style (conflictStyle)</label>
                  <input
                    value={voiceConflictStyle}
                    onChange={(e) => setVoiceConflictStyle(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Social Weaknesses (comma-separated)</label>
                  <input
                    value={voiceSocialWeaknesses}
                    onChange={(e) => setVoiceSocialWeaknesses(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                    placeholder="shy, can't say no..."
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_oklch(0.78_0.14_192_/_20%)]"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Suggestion
          </Button>
        </div>
      </div>

      {/* Response panel */}
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {personaName}'s Suggestion
        </h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {personaName} is analyzing your intent and detecting the best mode...
          </div>
        )}
        {mutation.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {mutation.error.message}
          </div>
        )}
        {result && !mutation.isPending && (
          <div className="space-y-4">
            {/* Analysis summary */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">Detected Intent:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/25">
                    mode: {result.detectedMode}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{result.detectedIntent}</p>
              </div>
              {result.emotionDetected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">Emotion:</span>
                  {result.emotionDetected.map((e, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">{e}</span>
                  ))}
                </div>
              )}
              {result.riskFlags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  {result.riskFlags.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">{f}</span>
                  ))}
                </div>
              )}
              {result.rewriteStrategy && (
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/15">
                  <span className="text-xs text-muted-foreground">Rewrite Strategy:</span>
                  <p className="text-xs text-foreground mt-0.5">{result.rewriteStrategy}</p>
                </div>
              )}
            </div>

            {/* Private bubbles */}
            {result.privateBubbles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">💬 Private Advice:</span>
                {result.privateBubbles.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200" style={{ animationDelay: `${b.delayMs}ms` }}>
                    <span className="text-sm shrink-0">
                      {b.type === "roast" ? "🔥" : b.type === "warning" ? "⚠️" : b.type === "reaction" ? "💭" : b.type === "question" ? "❓" : "💡"}
                    </span>
                    <div className="px-3 py-2 rounded-xl bg-secondary/40 border border-border/20 text-sm text-foreground">
                      {b.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested public message */}
            {result.suggestedPublicMessage && (
              <div className="p-3 rounded-xl bg-primary/8 border border-primary/25">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Suggested Message</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-2">{result.suggestedPublicMessage}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    navigator.clipboard.writeText(result.suggestedPublicMessage);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Message
                </Button>
              </div>
            )}

            {/* Metrics */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className={`px-2 py-0.5 rounded-full border ${
                result.riskLevel === "high" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                result.riskLevel === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                "bg-green-500/10 text-green-400 border-green-500/30"
              }`}>
                Risk: {result.riskLevel}
              </span>
              <span>Confidence: {Math.round(result.confidence * 100)}%</span>
              <span>Voice Match: {Math.round(result.userVoiceMatch * 100)}%</span>
            </div>

            <JsonViewer data={result as unknown as Record<string, unknown>} />
          </div>
        )}
        {!result && !mutation.isPending && !mutation.error && (
          <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
                        Click "Send Suggestion" to see {personaName}'s advice
          </div>
        )}
      </div>
    </div>
  );
}



/* ─── Chat Panel ───────────────────────────────────────────── */

function ChatPanel() {
  const [persona, setPersona] = useState<PersonaId>("sassy_roast_bestie");
  const [privateQuestion, setPrivateQuestion] = useState("She said she wants to see a movie in Waterloo. Should I suggest a time?");
  const [contextInput, setContextInput] = useState("Alice: How about the cinema near Waterloo?\nJiaYi: Sounds good!");
  const [result, setResult] = useState<BubblesResponse | null>(null);

  const mutation = trpc.pixie.chat.useMutation({
    onSuccess: (data) => setResult(data as BubblesResponse),
  });

  const handleSubmit = () => {
    if (!privateQuestion.trim()) {
      toast.error("Please enter a private question");
      return;
    }
    const contextErr = validateContextLines(contextInput);
    if (contextErr) {
      toast.error(contextErr);
      return;
    }

    const chatContext = contextInput
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, ...rest] = line.split(":");
        return {
          senderName: name.trim(),
          senderType: "human" as const,
          content: rest.join(":").trim(),
        };
      });

    mutation.mutate({
      roomId: "playground-room",
      userId: "testUser",
      pixieId: "lumi",
      persona,
      privateQuestion,
      chatContext,
    });
  };

  const personaName = PERSONAS.find(p => p.id === persona)?.name ?? "Lumi";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Request Parameters
        </h3>

        <div className="space-y-4">
          <PersonaSelector value={persona} onChange={setPersona} />

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Private Question (privateQuestion)</label>
            <textarea
              value={privateQuestion}
              onChange={(e) => setPrivateQuestion(e.target.value)}
              className="w-full h-24 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ask your Pixie privately..."
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Chat Context (one per line: Name: Content)</label>
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              className="w-full h-20 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alice: How about the cinema near Waterloo?"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_oklch(0.78_0.14_192_/_20%)]"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Request
          </Button>
        </div>
      </div>

      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          {personaName}'s Private Reply
        </h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {personaName} is thinking...
          </div>
        )}
        {mutation.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {mutation.error.message}
          </div>
        )}
        {result && !mutation.isPending && (
          <div className="space-y-4">
            <BubblesRenderer response={result} personaName={personaName} />
            <JsonViewer data={result as unknown as Record<string, unknown>} />
          </div>
        )}
        {!result && !mutation.isPending && !mutation.error && (
          <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
            Click "Send Request" to see {personaName}'s Private Reply
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Auto Context (Presence) Panel ─────────────────────────── */

interface PresenceResponse {
  shouldSpeak: boolean;
  visibility: string;
  interventionType: string;
  reason: string;
  message: string | null;
  suggestedNextAction: string;
  planUpdate: { activity: string | null; time: string | null; place: string | null; notes: string | null };
  cooldownTurns: number;
  riskLevel: string;
  confidence: number;
}

function AutoContextPanel() {
  const [persona, setPersona] = useState<PersonaId>("sassy_roast_bestie");
  const [contextInput, setContextInput] = useState(
    "Alice: Anyone wanna watch a movie tonight?\nJiaYi: I'm down!\nAlice: Something light, no horror\nJiaYi: Sure, no problem"
  );

  const [result, setResult] = useState<PresenceResponse | null>(null);

  const mutation = trpc.pixie.autoContext.useMutation({
    onSuccess: (data) => setResult(data as unknown as PresenceResponse),
  });

  const handleSubmit = () => {
    if (!contextInput.trim()) {
      toast.error("Please enter at least one chat message");
      return;
    }
    const contextErr = validateContextLines(contextInput);
    if (contextErr) {
      toast.error(contextErr);
      return;
    }

    const chatContext = contextInput
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, ...rest] = line.split(":");
        return {
          senderName: name.trim(),
          senderType: "human" as const,
          content: rest.join(":").trim(),
        };
      });

    mutation.mutate({
      roomId: "playground-room",
      userId: "testUser",
      pixieId: "lumi",
      persona,
      chatContext,

    });
  };

  const personaName = PERSONAS.find(p => p.id === persona)?.name ?? "Lumi";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Request Parameters
        </h3>

        <div className="space-y-4">
          <PersonaSelector value={persona} onChange={setPersona} />

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Chat Context (one per line: Name: Content)</label>
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              className="w-full h-28 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alice: Anyone wanna watch a movie tonight?"
            />
          </div>



          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_oklch(0.78_0.14_192_/_20%)]"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Request
          </Button>
        </div>
      </div>

      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          {personaName}'s Context Analysis
        </h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {personaName} is reading the room...
          </div>
        )}
        {mutation.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {mutation.error.message}
          </div>
        )}
        {result && !mutation.isPending && (
          <div className="space-y-4">
            {/* Presence Decision */}
            <div className={`p-4 rounded-lg border ${result.shouldSpeak ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${result.shouldSpeak ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
                <span className="font-semibold text-foreground">
                  {result.shouldSpeak ? `${personaName} decides to speak` : `${personaName} stays silent`}
                </span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  {result.interventionType.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{result.reason}</p>
            </div>

            {/* Message */}
            {result.message && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">{personaName}'s message:</p>
                <p className="text-foreground font-medium">"{result.message}"</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>visibility: <span className="text-primary">{result.visibility}</span></span>
                  <span>cooldown: <span className="text-primary">{result.cooldownTurns} turns</span></span>
                </div>
              </div>
            )}

            {/* Plan Update */}
            {(result.planUpdate.activity || result.planUpdate.time || result.planUpdate.place || result.planUpdate.notes) && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-sm font-medium text-foreground mb-2">Plan Update</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {result.planUpdate.activity && <span className="text-muted-foreground">Activity: <span className="text-foreground">{result.planUpdate.activity}</span></span>}
                  {result.planUpdate.time && <span className="text-muted-foreground">Time: <span className="text-foreground">{result.planUpdate.time}</span></span>}
                  {result.planUpdate.place && <span className="text-muted-foreground">Place: <span className="text-foreground">{result.planUpdate.place}</span></span>}
                  {result.planUpdate.notes && <span className="col-span-2 text-muted-foreground">Notes: <span className="text-foreground">{result.planUpdate.notes}</span></span>}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className={`px-2 py-0.5 rounded-full ${
                result.riskLevel === 'high' ? 'bg-destructive/20 text-destructive' :
                result.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                risk: {result.riskLevel}
              </span>
              <span>confidence: {(result.confidence * 100).toFixed(0)}%</span>
              <span>next: {result.suggestedNextAction}</span>
            </div>

            <JsonViewer data={result as unknown as Record<string, unknown>} />
          </div>
        )}
        {!result && !mutation.isPending && !mutation.error && (
          <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
            Click "Send Request" to see {personaName}'s analysis
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Validation Helper ─────────────────────────────────────── */

function validateContextLines(input: string): string | null {
  const lines = input.split("\n").filter(Boolean);
  for (const line of lines) {
    if (!line.includes(":")) {
      return `Format error: "${line}" is missing ":". Correct format: "Name: Content"`;
    }
  }
  return null;
}

/* ─── JSON Viewer ──────────────────────────────────────────── */

function JsonViewer({ data }: { data: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg bg-[oklch(0.1_0.03_270)] border border-border/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Code className="w-3 h-3" />
          {expanded ? "Collapse JSON" : "Expand JSON"}
        </button>
        <button onClick={handleCopy} className="text-muted-foreground hover:text-primary transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {expanded && (
        <pre className="p-3 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed max-h-64 overflow-y-auto">
          {json}
        </pre>
      )}
    </div>
  );
}
