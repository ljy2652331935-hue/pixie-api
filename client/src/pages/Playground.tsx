import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Sparkles, MessageCircle, Eye, ArrowLeft, Loader2, Send, Copy, Check, Code } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
  const [rawMessage, setRawMessage] = useState("我想约她看电影，但不想尴尬。");
  const [mode, setMode] = useState<"icebreaker" | "rewrite" | "boundary" | "plan">("icebreaker");
  const [contextInput, setContextInput] = useState("Alice: 今晚有人想看电影吗？");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const mutation = trpc.pixie.suggestion.useMutation({
    onSuccess: (data) => setResult(data as unknown as Record<string, unknown>),
  });

  const handleSubmit = () => {
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

    if (!rawMessage.trim()) {
      toast.error("请输入用户原始消息");
      return;
    }
    const contextErr = validateContextLines(contextInput);
    if (contextErr) {
      toast.error(contextErr);
      return;
    }

    mutation.mutate({
      roomId: "playground-room",
      userId: "testUser",
      pixieId: "lumi",
      rawMessage,
      mode,
      chatContext,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input panel */}
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          请求参数
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">模式 (mode)</label>
            <div className="grid grid-cols-2 gap-2">
              {(["icebreaker", "rewrite", "boundary", "plan"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
        <h3 className="text-lg font-semibold text-foreground mb-4">响应结果</h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Lumi 正在思考...
          </div>
        )}
        {mutation.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {mutation.error.message}
          </div>
        )}
        {result && !mutation.isPending && (
          <div className="space-y-4">
            <div className="space-y-3">
              <ResponseField label="detectedIntent" value={result.detectedIntent as string} />
              <ResponseField label="emotionDetected" value={JSON.stringify(result.emotionDetected)} />
              <ResponseField label="suggestedMessage" value={result.suggestedMessage as string} highlight />
              <ResponseField label="pixieComment" value={result.pixieComment as string} />
              <ResponseField label="riskLevel" value={result.riskLevel as string} badge />
              <ResponseField label="confidence" value={String(result.confidence)} />
            </div>
            <JsonViewer data={result} />
          </div>
        )}
        {!result && !mutation.isPending && !mutation.error && (
          <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
            点击"发送请求"查看 Lumi 的回复
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Chat Panel ───────────────────────────────────────────── */

function ChatPanel() {
  const [privateQuestion, setPrivateQuestion] = useState("她说想去 Waterloo 看电影，我是不是该主动定时间？");
  const [contextInput, setContextInput] = useState("Alice: 那我们去 Waterloo 那边的影院？\nJiaYi: 好啊！");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const mutation = trpc.pixie.chat.useMutation({
    onSuccess: (data) => setResult(data as unknown as Record<string, unknown>),
  });

  const handleSubmit = () => {
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

    if (!privateQuestion.trim()) {
      toast.error("请输入私下问题");
      return;
    }
    const contextErr = validateContextLines(contextInput);
    if (contextErr) {
      toast.error(contextErr);
      return;
    }

    mutation.mutate({
      roomId: "playground-room",
      userId: "testUser",
      pixieId: "lumi",
      privateQuestion,
      chatContext,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          请求参数
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">私下问题 (privateQuestion)</label>
            <textarea
              value={privateQuestion}
              onChange={(e) => setPrivateQuestion(e.target.value)}
              className="w-full h-24 rounded-lg bg-input border border-border/50 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="私下问 Lumi 的问题..."
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
        <h3 className="text-lg font-semibold text-foreground mb-4">响应结果</h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Lumi 正在思考...
          </div>
        )}
        {mutation.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {mutation.error.message}
          </div>
        )}
                {result && !mutation.isPending && (
          <div className="space-y-4">
            <div className="space-y-3">
              <ResponseField label="privateAdvice" value={result.privateAdvice as string} highlight />
              <ResponseField label="suggestedMessage" value={result.suggestedMessage as string | null} />
              <ResponseField label="safetyNote" value={result.safetyNote as string | null} warning />
            </div>
            <JsonViewer data={result} />
          </div>
        )}
        {!result && !mutation.isPending && !mutation.error && (
          <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
            点击“发送请求”查看 Lumi 的回复
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Auto Context Panel ───────────────────────────────────── */

function AutoContextPanel() {
  const [contextInput, setContextInput] = useState(
    "Alice: 今晚有人想看电影吗？\nJiaYi: 我也想看！\nAlice: 轻松一点的吧，不要恐怖片\nJiaYi: 好的没问题"
  );
  const [activity, setActivity] = useState("watch a movie");
  const [area, setArea] = useState("Waterloo");
  const [time, setTime] = useState("tonight");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const mutation = trpc.pixie.autoContext.useMutation({
    onSuccess: (data) => setResult(data as unknown as Record<string, unknown>),
  });

  const handleSubmit = () => {
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

    if (!contextInput.trim()) {
      toast.error("请输入至少一条聊天上下文");
      return;
    }
    const contextErr = validateContextLines(contextInput);
    if (contextErr) {
      toast.error(contextErr);
      return;
    }

    mutation.mutate({
      roomId: "playground-room",
      userId: "testUser",
      pixieId: "lumi",
      chatContext,
      activityIntent: activity ? { activity, area, time } : undefined,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="cosmic-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          请求参数
        </h3>

        <div className="space-y-4">
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
        <h3 className="text-lg font-semibold text-foreground mb-4">响应结果</h3>
        {mutation.isPending && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Lumi 正在读取房间...
          </div>
        )}
        {mutation.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {mutation.error.message}
          </div>
        )}
        {result && !mutation.isPending && (
          <div className="space-y-4">
            <div className="space-y-3">
              <ResponseField label="shouldSpeak" value={String(result.shouldSpeak)} badge />
              <ResponseField label="visibility" value={result.visibility as string} badge />
              <ResponseField label="triggerReason" value={result.triggerReason as string} />
              <ResponseField label="pixieMessage" value={result.pixieMessage as string} highlight />
              <ResponseField label="suggestedAction" value={result.suggestedAction as string} badge />
              <ResponseField label="riskLevel" value={result.riskLevel as string} badge />
            </div>
            <JsonViewer data={result} />
          </div>
        )}
        {!result && !mutation.isPending && !mutation.error && (
          <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
            点击"发送请求"查看 Lumi 的分析
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
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Code className="w-3 h-3" />
          JSON Response
        </span>
        <button onClick={handleCopy} className="text-muted-foreground hover:text-primary transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed max-h-64 overflow-y-auto">
        {json}
      </pre>
    </div>
  );
}

/* ─── Shared Components ────────────────────────────────────── */

function ResponseField({ label, value, highlight, badge, warning }: {
  label: string;
  value: string | null;
  highlight?: boolean;
  badge?: boolean;
  warning?: boolean;
}) {
  if (value === null || value === "null") {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-mono text-muted-foreground">{label}</span>
        <span className="text-sm text-muted-foreground/50 italic">null</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-mono text-muted-foreground">{label}</span>
      {badge ? (
        <span className="inline-block w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/25">
          {value}
        </span>
      ) : warning ? (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {value}
        </div>
      ) : (
        <p className={`text-sm leading-relaxed ${highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {value}
        </p>
      )}
    </div>
  );
}
