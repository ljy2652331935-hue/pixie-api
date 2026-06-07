import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, MessageCircle, Zap, ArrowLeft, Copy, Check, RefreshCw, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────

type PersonaId = "lumi" | "foxxz";

type ModeId = "icebreaker" | "rewrite" | "boundary" | "plan" | "whisper" | "offline_profile";

interface BubbleItem {
  type: string;
  text: string;
  emotion: string;
  delayMs: number;
}

// ─── Constants ─────────────────────────────────────────────

const PERSONAS: { id: PersonaId; name: string; label: string; emoji: string; desc: string }[] = [
  { id: "lumi", name: "Lumi", label: "Warm Bestie Pixie", emoji: "✨", desc: "Cute, lively, warm — hugs first, helps after" },
  { id: "foxxz", name: "Foxxz", label: "Gentleman Fox Strategist", emoji: "🦊", desc: "Witty, composed, strong social strategy — reads the room first" },
];

const MODES: { id: ModeId; label: string; desc: string; example: string }[] = [
  { id: "icebreaker", label: "Icebreaker", desc: "Start conversations naturally", example: "I want to message Alex but don't know how to start" },
  { id: "rewrite", label: "Rewrite", desc: "Say it better, keep your voice", example: "So like... if you're free do you maybe wanna hang out or something" },
  { id: "boundary", label: "Boundary", desc: "Firm but never cruel", example: "I don't like it when you cancel plans last minute, it's really annoying" },
  { id: "plan", label: "Plan", desc: "Turn chat into real plans", example: "We should hang out sometime" },
  { id: "whisper", label: "Whisper", desc: "Private advice, just for you", example: "They haven't replied in 3 days, should I send another message?" },
  { id: "offline_profile", label: "Offline Profile", desc: "Transparent presence card", example: "Tell them I'm free this weekend for coffee" },
];

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  high: "bg-red-500/15 text-red-400 border-red-500/30",
};

const EMOTION_COLORS: Record<string, string> = {
  neutral: "bg-slate-500/15 text-slate-400",
  playful: "bg-violet-500/15 text-violet-400",
  worried: "bg-amber-500/15 text-amber-400",
  smug: "bg-pink-500/15 text-pink-400",
  serious: "bg-blue-500/15 text-blue-400",
  excited: "bg-emerald-500/15 text-emerald-400",
};

// ─── Sub-components ─────────────────────────────────────────

function NavBar() {
  return (
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
            <span className="font-semibold text-sm">Playground</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">Docs</Button>
          </Link>
          <Link href="/chat">
            <Button size="sm" className="bg-pixie-gradient text-white border-0 text-xs">
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              Live Chat
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function PersonaSelector({ value, onChange }: { value: PersonaId; onChange: (v: PersonaId) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Persona</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`p-3 rounded-xl border text-left transition-all duration-200 ${
              value === p.id
                ? "border-primary/60 bg-primary/8 shadow-sm"
                : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div className="text-lg mb-1">{p.emoji}</div>
            <div className="text-xs font-semibold leading-tight">{p.name}</div>
            <div className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">{p.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BubblesRenderer({ bubbles, visible }: { bubbles: BubbleItem[]; visible: number }) {
  return (
    <div className="space-y-2">
      {bubbles.slice(0, visible).map((b, i) => (
        <div key={i} className="animate-bubble-in flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-pixie-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-tl-sm text-sm leading-relaxed max-w-full ${
              b.type === "warning" ? "bg-amber-500/10 border border-amber-500/20 text-amber-200" :
              b.type === "tease" ? "bg-violet-500/10 border border-violet-500/20 text-violet-200" :
              "bg-muted/60 border border-border/40 text-foreground"
            }`}>
              {b.text}
            </div>
            <div className="flex items-center gap-2 mt-1 ml-1">
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${EMOTION_COLORS[b.emotion] ?? "bg-muted text-muted-foreground"}`}>
                {b.emotion}
              </span>
              <span className="text-xs text-muted-foreground/50 font-mono">{b.type}</span>
            </div>
          </div>
        </div>
      ))}
      {visible < bubbles.length && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-pixie-gradient flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/40">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse-soft" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Suggest Panel ──────────────────────────────────────────

function SuggestPanel({ persona }: { persona: PersonaId }) {
  const [mode, setMode] = useState<ModeId>("rewrite");
  const [message, setMessage] = useState("");
  const [visibleBubbles, setVisibleBubbles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const mutation = trpc.pixie.suggest.useMutation({
    onSuccess: (data) => {
      setVisibleBubbles(0);
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
      const bubbles = data.privateBubbles ?? [];
      bubbles.forEach((_: BubbleItem, i: number) => {
        const t = setTimeout(() => setVisibleBubbles(i + 1), bubbles[i]?.delayMs ?? i * 800);
        timerRef.current.push(t);
      });
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) return;
    mutation.mutate({
      roomId: "playground",
      userId: "demo-user",
      persona,
      rawMessage: message,
      hintMode: mode,
      chatContext: [],
    });
  };

    return (
    <div className="space-y-5">
      {/* Input — mode options hidden, Ask Lumi only */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tell the pixie what you want to say</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. I want to message Alex but don't know how to start..."
          className="min-h-[100px] resize-none bg-muted/30 border-border/60 focus:border-primary/50 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/50">⌘+Enter to send</span>
          <Button onClick={handleSubmit} disabled={mutation.isPending || !message.trim()} size="sm" className="bg-pixie-gradient text-white border-0 hover:opacity-90">
            {mutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Ask Pixie
          </Button>
        </div>
      </div>

      {/* Result — Full Ask Lumi Analysis Card */}
      {mutation.data && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          {/* Lumi's reaction bubbles */}
          <BubblesRenderer bubbles={mutation.data.privateBubbles ?? []} visible={visibleBubbles} />

          {/* Your vibe right now */}
          {(mutation.data.emotionDetected ?? []).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">💜</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your vibe right now</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mutation.data.emotionDetected.map((emotion: string, i: number) => (
                  <Badge key={i} variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs">
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Watch-outs (risk flags) */}
          {(mutation.data.riskFlags ?? []).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">👀</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Watch-outs</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mutation.data.riskFlags.map((flag: string, i: number) => (
                  <Badge key={i} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* What I think you mean */}
          {mutation.data.detectedIntent && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">💡</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What I think you mean</span>
              </div>
              <div className="text-sm text-foreground/80 bg-muted/30 rounded-lg px-3 py-2.5">
                {mutation.data.detectedIntent}
              </div>
            </div>
          )}

          {/* Rewrite Strategy */}
          {mutation.data.rewriteStrategy && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎯</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Strategy</span>
              </div>
              <div className="text-sm text-foreground/80 bg-muted/30 rounded-lg px-3 py-2.5">
                {mutation.data.rewriteStrategy}
              </div>
            </div>
          )}

          {/* Try sending this — hero card */}
          {mutation.data.suggestedPublicMessage && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-primary/12 to-violet-500/8 border border-primary/25 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">✨</span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Try sending this</span>
                </div>
                <CopyButton text={mutation.data.suggestedPublicMessage} />
              </div>
              <p className="text-base leading-relaxed font-medium">{mutation.data.suggestedPublicMessage}</p>
            </div>
          )}

          {/* Alternatives */}
          {mutation.data.alternatives && (mutation.data.alternatives.playful || mutation.data.alternatives.softer || mutation.data.alternatives.casual) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎭</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Other ways to say it</span>
              </div>
              <div className="grid gap-2">
                {mutation.data.alternatives.playful && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-pink-500/8 border border-pink-500/20 group">
                    <Badge variant="outline" className="border-pink-500/30 bg-pink-500/10 text-pink-300 text-[10px] shrink-0">Playful</Badge>
                    <span className="text-sm flex-1">{mutation.data.alternatives.playful}</span>
                    <CopyButton text={mutation.data.alternatives.playful} />
                  </div>
                )}
                {mutation.data.alternatives.softer && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-500/8 border border-sky-500/20 group">
                    <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300 text-[10px] shrink-0">Softer</Badge>
                    <span className="text-sm flex-1">{mutation.data.alternatives.softer}</span>
                    <CopyButton text={mutation.data.alternatives.softer} />
                  </div>
                )}
                {mutation.data.alternatives.casual && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20 group">
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] shrink-0">Casual</Badge>
                    <span className="text-sm flex-1">{mutation.data.alternatives.casual}</span>
                    <CopyButton text={mutation.data.alternatives.casual} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom metrics bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className={`border ${RISK_COLORS[mutation.data.riskLevel]}`}>
                Risk: {mutation.data.riskLevel}
              </Badge>
              <Badge variant="outline" className="border-border/60 text-muted-foreground">
                Mode: {mutation.data.detectedMode}
              </Badge>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Confidence: {Math.round((mutation.data.confidence ?? 0) * 100)}%</span>
              <span>Voice Match: {Math.round((mutation.data.userVoiceMatch ?? 0) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {mutation.error?.message ?? "Something went wrong. Please try again."}
        </div>
      )}
    </div>
  );
}

// ─── Chat Panel ─────────────────────────────────────────────

function ChatPanel({ persona }: { persona: PersonaId }) {
  const [question, setQuestion] = useState("");
  const [visibleBubbles, setVisibleBubbles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const mutation = trpc.pixie.chat.useMutation({
    onSuccess: (data) => {
      setVisibleBubbles(0);
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
      const bubbles = data.bubbles ?? [];
      bubbles.forEach((_: BubbleItem, i: number) => {
        const t = setTimeout(() => setVisibleBubbles(i + 1), bubbles[i]?.delayMs ?? i * 800);
        timerRef.current.push(t);
      });
    },
  });

  const EXAMPLES = [
    "They haven't replied in 3 days, should I send another message?",
    "I got rejected and it hurts, what do I do?",
    "How do I tell them I like them without being weird?",
    "My friend keeps canceling plans last minute, am I being too sensitive?",
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick examples</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setQuestion(ex)} className="p-3 rounded-xl border border-border/60 bg-card hover:border-primary/30 text-left text-xs text-muted-foreground hover:text-foreground transition-all">
              <ChevronRight className="w-3 h-3 inline mr-1 text-primary" />
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ask your pixie</label>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's on your mind? Ask your pixie about any social situation..."
          className="min-h-[100px] resize-none bg-muted/30 border-border/60 focus:border-primary/50 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) mutation.mutate({ roomId: "playground", userId: "demo-user", persona, privateQuestion: question, chatContext: [] }); }}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => mutation.mutate({ roomId: "playground", userId: "demo-user", persona, privateQuestion: question, chatContext: [] })}
            disabled={mutation.isPending || !question.trim()}
            size="sm"
            className="bg-pixie-gradient text-white border-0 hover:opacity-90"
          >
            {mutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <MessageCircle className="w-3.5 h-3.5 mr-1.5" />}
                        Ask Pixie
          </Button>
        </div>
      </div>
      {mutation.data && (
        <div className="space-y-4 pt-2 border-t border-border/40">
          <BubblesRenderer bubbles={mutation.data.bubbles ?? []} visible={visibleBubbles} />

          {mutation.data.suggestedPublicMessage && (
            <div className="p-4 rounded-xl bg-primary/8 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Suggested Reply</span>
                <CopyButton text={mutation.data.suggestedPublicMessage} />
              </div>
              <p className="text-sm leading-relaxed">{mutation.data.suggestedPublicMessage}</p>
            </div>
          )}

          {(mutation.data.quickReplies ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mutation.data.quickReplies?.map((r, i) => (
                <button key={i} onClick={() => setQuestion(r)} className="px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-xs hover:border-primary/40 hover:bg-primary/5 transition-all">
                  {r}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className={`border ${RISK_COLORS[mutation.data.riskLevel]}`}>
              Risk: {mutation.data.riskLevel}
            </Badge>
            <Badge variant="outline" className="border-border/60 text-muted-foreground">
              Confidence: {Math.round((mutation.data.confidence ?? 0) * 100)}%
            </Badge>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {mutation.error?.message ?? "Something went wrong. Please try again."}
        </div>
      )}
    </div>
  );
}

// ─── Auto Context Panel ─────────────────────────────────────

function AutoContextPanel({ persona }: { persona: PersonaId }) {
  const [messages, setMessages] = useState([
    { senderName: "Alex", senderType: "human" as const, content: "Hey! I saw you're into hiking too 🏔️" },
    { senderName: "Jordan", senderType: "human" as const, content: "Yeah! I go every weekend. Do you have a favorite trail?" },
    { senderName: "Alex", senderType: "human" as const, content: "I love the Mist Trail in Yosemite. Maybe we could go sometime?" },
  ]);
  const [newMsg, setNewMsg] = useState("");
  const [newSender, setNewSender] = useState("Alex");
  const [visibleBubbles, setVisibleBubbles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const mutation = trpc.pixie.autoContext.useMutation({
    onSuccess: (data) => {
      setVisibleBubbles(0);
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
      if (data.shouldSpeak && data.message) {
        const t = setTimeout(() => setVisibleBubbles(1), 300);
        timerRef.current.push(t);
      }
    },
  });

  const addMessage = () => {
    if (!newMsg.trim()) return;
    setMessages(prev => [...prev, { senderName: newSender, senderType: "human" as const, content: newMsg }]);
    setNewMsg("");
  };

  const handleAnalyze = () => {
    mutation.mutate({
      roomId: "playground",
      userId: "demo-user",
      persona,
      chatContext: messages,
    });
  };

  return (
    <div className="space-y-5">
      {/* Chat context */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chat Context</label>
        <div className="space-y-2 p-4 rounded-xl border border-border/60 bg-muted/20 max-h-52 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                {m.senderName[0]}
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">{m.senderName}: </span>
                <span className="text-xs text-foreground">{m.content}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add message */}
        <div className="flex gap-2">
          <Select value={newSender} onValueChange={setNewSender}>
            <SelectTrigger className="w-24 h-8 text-xs bg-muted/30 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alex">Alex</SelectItem>
              <SelectItem value="Jordan">Jordan</SelectItem>
            </SelectContent>
          </Select>
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addMessage(); }}
            placeholder="Add a message..."
            className="flex-1 h-8 px-3 rounded-lg border border-border/60 bg-muted/30 text-xs focus:outline-none focus:border-primary/50"
          />
          <Button onClick={addMessage} size="sm" variant="outline" className="h-8 text-xs border-border/60">Add</Button>
        </div>
      </div>

      <Button onClick={handleAnalyze} disabled={mutation.isPending} className="w-full bg-pixie-gradient text-white border-0 hover:opacity-90">
        {mutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
        Let pixie read the room
      </Button>

      {mutation.data && (
        <div className="space-y-4 pt-2 border-t border-border/40">
          {/* Should speak decision */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            mutation.data.shouldSpeak
              ? "bg-emerald-500/8 border-emerald-500/20"
              : "bg-muted/30 border-border/40"
          }`}>
            <div className={`w-2 h-2 rounded-full ${mutation.data.shouldSpeak ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
            <div>
              <div className="text-xs font-semibold">
                {mutation.data.shouldSpeak ? "Pixie wants to speak" : "Pixie stays silent"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{mutation.data.reason}</div>
            </div>
          </div>

          {/* Lumi's message */}
          {mutation.data.shouldSpeak && mutation.data.message && visibleBubbles > 0 && (
            <div className="animate-bubble-in flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-pixie-gradient flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1">
                <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/40 text-sm">
                  {mutation.data.message}
                </div>
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <span className="text-xs text-muted-foreground/60">{mutation.data.interventionType?.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground/60">{mutation.data.visibility}</span>
                </div>
              </div>
            </div>
          )}

          {/* Plan update */}
          {mutation.data.planUpdate && Object.values(mutation.data.planUpdate).some(Boolean) && (
            <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-xs space-y-1">
              <div className="font-medium text-primary mb-1.5">Plan Update</div>
              {mutation.data.planUpdate.activity && <div><span className="text-muted-foreground">Activity: </span>{mutation.data.planUpdate.activity}</div>}
              {mutation.data.planUpdate.time && <div><span className="text-muted-foreground">Time: </span>{mutation.data.planUpdate.time}</div>}
              {mutation.data.planUpdate.place && <div><span className="text-muted-foreground">Place: </span>{mutation.data.planUpdate.place}</div>}
              {mutation.data.planUpdate.notes && <div><span className="text-muted-foreground">Notes: </span>{mutation.data.planUpdate.notes}</div>}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className={`border ${RISK_COLORS[mutation.data.riskLevel]}`}>
              Risk: {mutation.data.riskLevel}
            </Badge>
            <Badge variant="outline" className="border-border/60 text-muted-foreground">
              Confidence: {Math.round((mutation.data.confidence ?? 0) * 100)}%
            </Badge>
            <Badge variant="outline" className="border-border/60 text-muted-foreground">
              Cooldown: {mutation.data.cooldownTurns} turns
            </Badge>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {mutation.error?.message ?? "Something went wrong. Please try again."}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function Playground() {
  const [persona, setPersona] = useState<PersonaId>("lumi");
  const currentPersona = PERSONAS.find(p => p.id === persona);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <div className="pt-20 pb-12">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="py-8 border-b border-border/50 mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold mb-2">API Playground</h1>
                <p className="text-muted-foreground text-sm">
                  Test all Pixie API endpoints in real time. Choose a persona and see how Lumi or Foxxz handles different social scenarios.
                </p>
              </div>
              {currentPersona && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card text-sm">
                  <span className="text-lg">{currentPersona.emoji}</span>
                  <div>
                    <div className="font-semibold text-xs">{currentPersona.name}</div>
                    <div className="text-xs text-muted-foreground">{currentPersona.label}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Persona selector */}
          <div className="mb-8">
            <PersonaSelector value={persona} onChange={setPersona} />
          </div>

          {/* API Tabs */}
          <Tabs defaultValue="suggest" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-lg bg-muted/40 border border-border/60 rounded-xl p-1 h-auto">
              <TabsTrigger value="suggest" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm py-2 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Suggestion
              </TabsTrigger>
              <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm py-2 text-xs font-medium">
                <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="autocontext" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm py-2 text-xs font-medium">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Auto Context
              </TabsTrigger>
            </TabsList>

            <div className="p-6 rounded-2xl border border-border/60 bg-card">
              <TabsContent value="suggest" className="mt-0">
                <div className="mb-4">
                  <h2 className="font-semibold text-base">Expression Suggestion</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    <code className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-primary">pixie.suggest</code> — The pixie analyzes your message and suggests a better way to say it.
                  </p>
                </div>
                <SuggestPanel persona={persona} />
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <div className="mb-4">
                  <h2 className="font-semibold text-base">Private Chat</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    <code className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-primary">pixie.chat</code> — Ask the pixie anything privately. Social advice, emotional support, reality checks.
                  </p>
                </div>
                <ChatPanel persona={persona} />
              </TabsContent>

              <TabsContent value="autocontext" className="mt-0">
                <div className="mb-4">
                  <h2 className="font-semibold text-base">Auto Context</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    <code className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-primary">pixie.autoContext</code> — The pixie reads conversation context and decides whether to speak up.
                  </p>
                </div>
                <AutoContextPanel persona={persona} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
