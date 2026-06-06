import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Sparkles, MessageCircle, Eye, ArrowLeft, Loader2, Send, Copy, Check, Code, Users, AlertTriangle, Zap } from "lucide-react";
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
  { id: "sassy_roast_bestie", name: "Lumi", label: "毒舌吐槽闺蜜", emoji: "🔥" },
  { id: "smooth_witty_fox", name: "Lumi", label: "机灵狐狸军师", emoji: "🦊" },
  { id: "elegant_gentleman", name: "Soren", label: "优雅绅士", emoji: "🎩" },
  { id: "loyal_bro", name: "Koda", label: "兄弟护短", emoji: "🤝" },
  { id: "soft_social_anxiety_helper", name: "Mimi", label: "温柔社恐辅助", emoji: "🌸" },
  { id: "calm_strategist", name: "Orin", label: "冷静理性军师", emoji: "🧊" },
] as const;

type PersonaId = (typeof PERSONAS)[number]["id"];

// ─── Persona Selector Component ───────────────────────────────

function PersonaSelector({ value, onChange }: { value: PersonaId; onChange: (v: PersonaId) => void }) {
  const selected = PERSONAS.find(p => p.id === value);
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        人格 (persona)
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

// ─── Bubbles Renderer (逐条气泡动画) ─────────────────────────

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
          <span className="text-xs text-muted-foreground/50">{personaName} 正在输入...</span>
        </div>
      )}

      {/* Suggested Public Message */}
      {visibleCount >= response.bubbles.length && response.suggestedPublicMessage && (
        <div className="mt-4 p-3 rounded-xl bg-primary/8 border border-primary/25 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">建议发送的消息</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-2">{response.suggestedPublicMessage}</p>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => {
              navigator.clipboard.writeText(response.suggestedPublicMessage!);
              toast.success("已复制到剪贴板");
            }}
          >
            <Copy className="w-3 h-3 mr-1" />
            复制使用此消息
          </Button>
        </div>
      )}

      {/* Quick Replies */}
      {visibleCount >= response.bubbles.length && response.quickReplies.length > 0 && (
        <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-xs text-muted-foreground mb-2 block">快速回复选项：</span>
          <div className="flex flex-wrap gap-2">
            {response.quickReplies.map((reply, i) => (
              <button
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors"
                onClick={() => toast.info(`选择了: ${reply}`)}
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
            返回首页
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold text-foreground">Playground</span>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 px-6 pb-16 max-w-6xl mx-auto">
        <Tabs defaultValue="suggestion" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50 backdrop-blur-sm border border-border/50 mb-8">
            <TabsTrigger value="suggestion" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              Suggestion
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="autoContext" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Eye className="w-4 h-4 mr-2" />
              Auto Context
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestion">
            <SuggestionPanel />
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

/* ─── Suggestion Panel ─────────────────────────────────────── */

function SuggestionPanel() {
  const [persona, setPersona] = useState<PersonaId>("sassy_roast_bestie");
  const [rawMessage, setRawMessage] = useState("我想约她看电影，但不想尴尬。");
  const [mode, setMode] = useState<"icebreaker" | "rewrite" | "boundary" | "plan" | "whisper" | "offline_profile">("icebreaker");
  const [contextInput, setContextInput] = useState("Alice: 今晚有人想看电影吗？");
  const [result, setResult] = useState<BubblesResponse | null>(null);

  const mutation = trpc.pixie.suggestion.useMutation({
    onSuccess: (data) => setResult(data as BubblesResponse),
  });

  const handleSubmit = () => {
    if (!rawMessage.trim()) {
      toast.error("请输入用户原始消息");
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
      rawMessage,
      mode,
      chatContext,
    });
  };

  const personaName = PERSONAS.find(p => p.id === persona)?.name ?? "Lumi";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input panel */}
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          请求参数
        </h3>

        <div className="space-y-4">
          <PersonaSelector value={persona} onChange={setPersona} />

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">模式 (mode)</label>
            <div className="grid grid-cols-3 gap-2">
              {(["icebreaker", "rewrite", "boundary", "plan", "whisper", "offline_profile"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    mode === m
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-secondary/50 text-muted-foreground border border-border/50 hover:border-primary/20"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">用户原始输入 (rawMessage)</label>
            <textarea
              value={rawMessage}
              onChange={(e) => setRawMessage(e.target.value)}
              className="w-full h-24 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="输入你想说的话..."
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">聊天上下文 (每行一条: 名字: 内容)</label>
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              className="w-full h-20 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alice: 今晚有人想看电影吗？"
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
            发送请求
          </Button>
        </div>
      </div>

      {/* Response panel */}
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          {personaName} 的回复
        </h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {personaName} 正在思考...
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
            点击"发送请求"查看 {personaName} 的回复
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Chat Panel ───────────────────────────────────────────── */

function ChatPanel() {
  const [persona, setPersona] = useState<PersonaId>("sassy_roast_bestie");
  const [privateQuestion, setPrivateQuestion] = useState("她说想去 Waterloo 看电影，我是不是该主动定时间？");
  const [contextInput, setContextInput] = useState("Alice: 那我们去 Waterloo 那边的影院？\nJiaYi: 好啊！");
  const [result, setResult] = useState<BubblesResponse | null>(null);

  const mutation = trpc.pixie.chat.useMutation({
    onSuccess: (data) => setResult(data as BubblesResponse),
  });

  const handleSubmit = () => {
    if (!privateQuestion.trim()) {
      toast.error("请输入私下问题");
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
          请求参数
        </h3>

        <div className="space-y-4">
          <PersonaSelector value={persona} onChange={setPersona} />

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">私下问题 (privateQuestion)</label>
            <textarea
              value={privateQuestion}
              onChange={(e) => setPrivateQuestion(e.target.value)}
              className="w-full h-24 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="私下问 Pixie 的问题..."
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">聊天上下文 (每行一条: 名字: 内容)</label>
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              className="w-full h-20 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alice: 那我们去 Waterloo 那边的影院？"
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
            发送请求
          </Button>
        </div>
      </div>

      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          {personaName} 的私聊回复
        </h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {personaName} 正在思考...
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
            点击"发送请求"查看 {personaName} 的私聊回复
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Auto Context Panel ───────────────────────────────────── */

function AutoContextPanel() {
  const [persona, setPersona] = useState<PersonaId>("sassy_roast_bestie");
  const [contextInput, setContextInput] = useState(
    "Alice: 今晚有人想看电影吗？\nJiaYi: 我也想看！\nAlice: 轻松一点的吧，不要恐怖片\nJiaYi: 好的没问题"
  );
  const [activity, setActivity] = useState("watch a movie");
  const [area, setArea] = useState("Waterloo");
  const [time, setTime] = useState("tonight");
  const [result, setResult] = useState<BubblesResponse | null>(null);

  const mutation = trpc.pixie.autoContext.useMutation({
    onSuccess: (data) => setResult(data as BubblesResponse),
  });

  const handleSubmit = () => {
    if (!contextInput.trim()) {
      toast.error("请输入至少一条聊天上下文");
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
      activityIntent: activity ? { activity, area, time } : undefined,
    });
  };

  const personaName = PERSONAS.find(p => p.id === persona)?.name ?? "Lumi";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          请求参数
        </h3>

        <div className="space-y-4">
          <PersonaSelector value={persona} onChange={setPersona} />

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">聊天上下文 (每行一条: 名字: 内容)</label>
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              className="w-full h-28 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alice: 今晚有人想看电影吗？"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">活动意图 (activityIntent)</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="activity"
              />
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="area"
              />
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="time"
              />
            </div>
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
            发送请求
          </Button>
        </div>
      </div>

      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          {personaName} 的上下文分析
        </h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {personaName} 正在读取房间...
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
            点击"发送请求"查看 {personaName} 的分析
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
      return `格式错误: "${line}" 缺少分隔符 ":"，正确格式为 "名字: 内容"`;
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
    toast.success("已复制到剪贴板");
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
          {expanded ? "收起 JSON" : "展开 JSON"}
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
