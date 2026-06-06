import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Sparkles, MessageCircle, Eye, ArrowLeft, Loader2, Send, Copy, Check, Code, Users, AlertTriangle, Zap, Wand2, Shield } from "lucide-react";
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
        <Tabs defaultValue="express" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50 backdrop-blur-sm border border-border/50 mb-8">
            <TabsTrigger value="express" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Wand2 className="w-4 h-4 mr-2" />
              Express
            </TabsTrigger>
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

          <TabsContent value="express">
            <ExpressPanel />
          </TabsContent>
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

/* ─── Express Panel (Intent-to-Expression) ─────────────────── */

interface ExpressResponse {
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

const EXPRESS_MODES = [
  { id: "compliment", label: "赞美", emoji: "💖" },
  { id: "flirt", label: "调情", emoji: "😏" },
  { id: "invite", label: "邀约", emoji: "🎉" },
  { id: "rewrite", label: "改写", emoji: "✏️" },
  { id: "boundary", label: "边界", emoji: "🛡️" },
  { id: "reject", label: "拒绝", emoji: "✋" },
  { id: "plan", label: "计划", emoji: "📅" },
  { id: "clarify", label: "澄清", emoji: "💡" },
  { id: "casual", label: "随意聊", emoji: "💬" },
] as const;

const RELATIONSHIP_STAGES = [
  { id: "new_match", label: "新匹配" },
  { id: "casual_chat", label: "随意聊" },
  { id: "friend", label: "朋友" },
  { id: "dating_interest", label: "约会对象" },
  { id: "unknown", label: "未知" },
] as const;

function ExpressPanel() {
  const [persona, setPersona] = useState<PersonaId>("sassy_roast_bestie");
  const [rawMessage, setRawMessage] = useState("我想约她周末去看美术展，但不知道怎么开口。");
  const [mode, setMode] = useState<string>("invite");
  const [targetName, setTargetName] = useState("Alice");
  const [relationshipStage, setRelationshipStage] = useState("casual_chat");
  const [contextInput, setContextInput] = useState("Alice: 最近好无聊啊\nJiaYi: 是啊，想找点事做");
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
  const [result, setResult] = useState<ExpressResponse | null>(null);

  const mutation = trpc.pixie.express.useMutation({
    onSuccess: (data) => setResult(data as ExpressResponse),
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

    const input: any = {
      roomId: "playground-room",
      userId: "testUser",
      pixieId: "lumi",
      persona,
      rawMessage,
      mode,
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
          <Wand2 className="w-5 h-5 text-primary" />
          Express 请求参数
        </h3>

        <div className="space-y-4">
          <PersonaSelector value={persona} onChange={setPersona} />

          {/* Mode selector */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">模式 (mode)</label>
            <div className="grid grid-cols-3 gap-2">
              {EXPRESS_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    mode === m.id
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-secondary/50 text-muted-foreground border border-border/50 hover:border-primary/20"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Raw message */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">用户原始输入 (rawMessage)</label>
            <textarea
              value={rawMessage}
              onChange={(e) => setRawMessage(e.target.value)}
              className="w-full h-20 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="输入你想表达的意思..."
            />
          </div>

          {/* Target user */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">目标用户 (targetUser)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="名字"
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
            <label className="text-sm text-muted-foreground mb-1 block">聊天上下文 (每行一条: 名字: 内容)</label>
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              className="w-full h-16 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alice: 最近好无聊啊"
            />
          </div>

          {/* Voice profile toggle */}
          <div>
            <button
              onClick={() => setShowVoiceProfile(!showVoiceProfile)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <Users className="w-3 h-3" />
              {showVoiceProfile ? "收起" : "展开"} 用户语音画像 (userVoiceProfile)
            </button>
            {showVoiceProfile && (
              <div className="mt-2 space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div>
                  <label className="text-xs text-muted-foreground">语气 (tone, 逗号分隔)</label>
                  <input
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">消息长度</label>
                    <Select value={voiceLength} onValueChange={setVoiceLength}>
                      <SelectTrigger className="bg-input border-border/50 text-foreground text-xs h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="short">短</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="long">长</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">正式程度</label>
                    <Select value={voiceFormality} onValueChange={setVoiceFormality}>
                      <SelectTrigger className="bg-input border-border/50 text-foreground text-xs h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="casual">随意</SelectItem>
                        <SelectItem value="semi_casual">半随意</SelectItem>
                        <SelectItem value="formal">正式</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">幽默风格 (humorStyle)</label>
                  <input
                    value={voiceHumorStyle}
                    onChange={(e) => setVoiceHumorStyle(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">常用词组 (commonPhrases, 逗号分隔)</label>
                  <input
                    value={voiceCommonPhrases}
                    onChange={(e) => setVoiceCommonPhrases(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                    placeholder="哈哈, 真的吗, 我觉得..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">避免词组 (avoidPhrases, 逗号分隔)</label>
                  <input
                    value={voiceAvoidPhrases}
                    onChange={(e) => setVoiceAvoidPhrases(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">调情风格 (flirtingStyle)</label>
                  <input
                    value={voiceFlirtingStyle}
                    onChange={(e) => setVoiceFlirtingStyle(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">冲突风格 (conflictStyle)</label>
                  <input
                    value={voiceConflictStyle}
                    onChange={(e) => setVoiceConflictStyle(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">社交弱点 (socialWeaknesses, 逗号分隔)</label>
                  <input
                    value={voiceSocialWeaknesses}
                    onChange={(e) => setVoiceSocialWeaknesses(e.target.value)}
                    className="w-full rounded bg-input border border-border/50 px-2 py-1 text-xs text-foreground"
                    placeholder="害羞, 不会拒绝..."
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
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            发送 Express 请求
          </Button>
        </div>
      </div>

      {/* Response panel */}
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          {personaName} 的表达建议
        </h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {personaName} 正在分析你的意图...
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
                <span className="text-xs text-muted-foreground">检测意图:</span>
                <p className="text-sm text-foreground mt-0.5">{result.detectedIntent}</p>
              </div>
              {result.emotionDetected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">情绪:</span>
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
                  <span className="text-xs text-muted-foreground">改写策略:</span>
                  <p className="text-xs text-foreground mt-0.5">{result.rewriteStrategy}</p>
                </div>
              )}
            </div>

            {/* Private bubbles */}
            {result.privateBubbles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">💬 私下建议:</span>
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
                  <span className="text-xs font-medium text-primary">建议发送的消息</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-2">{result.suggestedPublicMessage}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    navigator.clipboard.writeText(result.suggestedPublicMessage);
                    toast.success("已复制到剪贴板");
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  复制使用此消息
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
                风险: {result.riskLevel}
              </span>
              <span>置信度: {Math.round(result.confidence * 100)}%</span>
              <span>语音匹配: {Math.round(result.userVoiceMatch * 100)}%</span>
            </div>

            <JsonViewer data={result as unknown as Record<string, unknown>} />
          </div>
        )}
        {!result && !mutation.isPending && !mutation.error && (
          <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
            点击"发送 Express 请求"查看 {personaName} 的表达建议
          </div>
        )}
      </div>
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
    "Alice: 今晚有人想看电影吗？\nJiaYi: 我也想看！\nAlice: 轻松一点的吧，不要恐怖片\nJiaYi: 好的没问题"
  );
  const [activity, setActivity] = useState("watch a movie");
  const [area, setArea] = useState("Waterloo");
  const [time, setTime] = useState("tonight");
  const [result, setResult] = useState<PresenceResponse | null>(null);

  const mutation = trpc.pixie.autoContext.useMutation({
    onSuccess: (data) => setResult(data as unknown as PresenceResponse),
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
            {/* Presence Decision */}
            <div className={`p-4 rounded-lg border ${result.shouldSpeak ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${result.shouldSpeak ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
                <span className="font-semibold text-foreground">
                  {result.shouldSpeak ? `${personaName} 决定发言` : `${personaName} 选择沉默`}
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
                <p className="text-sm text-muted-foreground mb-1">{personaName} 的消息：</p>
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
            点击“发送请求”查看 {personaName} 的分析
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
