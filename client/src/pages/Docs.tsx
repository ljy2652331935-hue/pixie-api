import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Sparkles, MessageCircle, Eye, Copy, Check } from "lucide-react";
import { useState } from "react";

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
            返回首页
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
          <h1 className="text-3xl font-bold text-foreground cosmic-glow mb-4">Pixie API 文档</h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Pixie 是 Sponty 平台的 AI 社交副驾驶系统，由 Lumi 小精灵驱动。提供三个核心能力层：
            表达建议（Suggestion）、私聊陪伴（Chat）和上下文感知（Auto Context）。
          </p>
          <p className="text-muted-foreground leading-relaxed">
            所有 API 通过 tRPC 协议调用，基础路径为 <code className="px-2 py-0.5 rounded bg-secondary text-primary font-mono text-sm">/api/trpc/pixie.*</code>。
            也可以通过 Playground 页面进行交互式测试。
          </p>
        </section>

        {/* Suggestion API */}
        <ApiSection
          icon={<Sparkles className="w-6 h-6" />}
          title="Pixie Suggestion API"
          endpoint="pixie.suggestion"
          method="mutation"
          description="分析用户原始输入，根据社交场景和模式，给出更自然、更适合的表达建议。"
          modes={[
            { name: "icebreaker", desc: "不知道怎么开口时的破冰建议" },
            { name: "rewrite", desc: "改写已有表达，让它更自然得体" },
            { name: "boundary", desc: "表达不满或拒绝，有边界但不攻击" },
            { name: "plan", desc: "推进线下计划，包含时间地点活动" },
          ]}
          requestFields={[
            { name: "roomId", type: "string", desc: "聊天房间 ID" },
            { name: "userId", type: "string", desc: "当前用户 ID" },
            { name: "pixieId", type: "string", desc: "小精灵 ID，默认 'lumi'" },
            { name: "rawMessage", type: "string", desc: "用户原始输入" },
            { name: "mode", type: "enum", desc: "icebreaker | rewrite | boundary | plan" },
            { name: "chatContext", type: "array", desc: "聊天上下文消息数组" },
          ]}
          responseFields={[
            { name: "detectedIntent", type: "string", desc: "用户真正想表达的意思" },
            { name: "emotionDetected", type: "string[]", desc: "检测到的情绪数组" },
            { name: "suggestedMessage", type: "string", desc: "建议的消息（可直接发送）" },
            { name: "pixieComment", type: "string", desc: "Lumi 的私下评论" },
            { name: "riskLevel", type: "enum", desc: "low | medium | high" },
            { name: "confidence", type: "number", desc: "置信度 0-1" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "rawMessage": "我想约她看电影，但不想尴尬。",
  "mode": "icebreaker",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "今晚有人想看电影吗？" }
  ]
}`}
          exampleResponse={`{
  "detectedIntent": "想接话约看电影但怕尴尬",
  "emotionDetected": ["期待", "紧张"],
  "suggestedMessage": "我也想看！最近有什么好片推荐吗？",
  "pixieComment": "直接接话就好，她都发出邀请了你还怕啥",
  "riskLevel": "low",
  "confidence": 0.92
}`}
        />

        {/* Chat API */}
        <ApiSection
          icon={<MessageCircle className="w-6 h-6" />}
          title="Pixie Chat API"
          endpoint="pixie.chat"
          method="mutation"
          description="用户可以私下和 Lumi 小精灵对话，获取社交建议、情绪陪伴和安全提醒。"
          requestFields={[
            { name: "roomId", type: "string", desc: "聊天房间 ID" },
            { name: "userId", type: "string", desc: "当前用户 ID" },
            { name: "pixieId", type: "string", desc: "小精灵 ID，默认 'lumi'" },
            { name: "privateQuestion", type: "string", desc: "用户私下问的问题" },
            { name: "chatContext", type: "array", desc: "公开聊天上下文" },
          ]}
          responseFields={[
            { name: "privateAdvice", type: "string", desc: "Lumi 给用户的私下建议" },
            { name: "suggestedMessage", type: "string | null", desc: "可选的公开回复建议" },
            { name: "safetyNote", type: "string | null", desc: "可选的安全提醒" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "privateQuestion": "她说想去 Waterloo 看电影，我是不是该主动定时间？",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "那我们去 Waterloo 那边的影院？" },
    { "senderName": "JiaYi", "senderType": "human", "content": "好啊！" }
  ]
}`}
          exampleResponse={`{
  "privateAdvice": "当然要主动啊！她都提了地点了，你来定时间和具体影院，展现一下靠谱的一面。",
  "suggestedMessage": "我查了一下，Waterloo 那边的 IMAX 今晚 8 点有场次，要不我们约这个？",
  "safetyNote": null
}`}
        />

        {/* Auto Context API */}
        <ApiSection
          icon={<Eye className="w-6 h-6" />}
          title="Pixie Auto Context API"
          endpoint="pixie.autoContext"
          method="mutation"
          description="自动分析聊天上下文，判断 Lumi 是否应当发言、以什么方式发言、以及建议的后续动作。"
          requestFields={[
            { name: "roomId", type: "string", desc: "聊天房间 ID" },
            { name: "userId", type: "string", desc: "当前用户 ID" },
            { name: "pixieId", type: "string", desc: "小精灵 ID，默认 'lumi'" },
            { name: "chatContext", type: "array", desc: "聊天上下文消息数组" },
            { name: "activityIntent", type: "object?", desc: "可选的活动意图 { activity, area, time }" },
          ]}
          responseFields={[
            { name: "shouldSpeak", type: "boolean", desc: "是否应该发言" },
            { name: "visibility", type: "enum", desc: "private | public" },
            { name: "triggerReason", type: "string", desc: "发言原因" },
            { name: "pixieMessage", type: "string", desc: "Lumi 要说的话" },
            { name: "suggestedAction", type: "enum", desc: "icebreaker | rewrite | boundary | plan | safety | none" },
            { name: "riskLevel", type: "enum", desc: "low | medium | high" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "今晚有人想看电影吗？" },
    { "senderName": "JiaYi", "senderType": "human", "content": "我也想看！" },
    { "senderName": "Alice", "senderType": "human", "content": "轻松一点的吧，不要恐怖片" }
  ],
  "activityIntent": {
    "activity": "watch a movie",
    "area": "Waterloo",
    "time": "tonight"
  }
}`}
          exampleResponse={`{
  "shouldSpeak": true,
  "visibility": "public",
  "triggerReason": "活动意图明确但缺少具体时间和地点",
  "pixieMessage": "看起来你们都想看电影！要不要我帮忙查一下 Waterloo 附近今晚有什么好片？",
  "suggestedAction": "plan",
  "riskLevel": "low"
}`}
        />

        {/* Lumi Persona */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Lumi 人设说明</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">性格定位：</strong>毒舌但靠谱的社交副驾驶。像用户最好的朋友——懂他们、帮他们、偶尔损他们。
            </p>
            <p>
              <strong className="text-foreground">安全优先原则：</strong>涉及线下见面、私人联系方式、深夜约见、对方冒犯越界时，
              Lumi 必须优先给出安全提醒。安全提醒的优先级高于所有其他回复逻辑。
            </p>
            <p>
              <strong className="text-foreground">核心原则：</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>帮助用户更好地表达自己，但不替用户说话</li>
              <li>可以毒舌，但绝不鼓励攻击、骚扰、操控或不安全行为</li>
              <li>当 riskLevel 为 high 时，优先输出降温和安全建议</li>
              <li>私下提醒优先于公开插话</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ─── API Section Component ────────────────────────────────── */

function ApiSection({ icon, title, endpoint, method, description, modes, requestFields, responseFields, example, exampleResponse }: {
  icon: React.ReactNode;
  title: string;
  endpoint: string;
  method: string;
  description: string;
  modes?: Array<{ name: string; desc: string }>;
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

      {modes && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">模式说明</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {modes.map((m) => (
              <div key={m.name} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30">
                <code className="text-xs font-mono text-primary whitespace-nowrap">{m.name}</code>
                <span className="text-xs text-muted-foreground">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request fields */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">请求字段</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">字段</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">类型</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">说明</th>
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
        <h4 className="text-sm font-semibold text-foreground mb-2">响应字段</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">字段</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">类型</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">说明</th>
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
        <CodeBlock title="请求示例" code={example} />
        <CodeBlock title="响应示例" code={exampleResponse} />
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
