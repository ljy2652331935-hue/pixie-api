import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Sparkles, MessageCircle, Eye, Copy, Check, Users, Layers } from "lucide-react";
import { useState } from "react";

// ─── Persona & Mode data ──────────────────────────────────────

const PERSONAS = [
  { id: "sassy_roast_bestie", name: "Lumi", label: "毒舌吐槽闺蜜", desc: "嘴快、护短、会吐槽，但很靠谱。调侃你的内耗和脑补，但不会羞辱你。", traits: ["sassy", "playful", "loyal", "protective", "emotionally sharp"] },
  { id: "smooth_witty_fox", name: "Lumi", label: "机灵狐狸军师", desc: "聪明、嘴贫、松弛、看透局势但不装深沉。让你显得更松弛、更有边界。", traits: ["clever", "witty", "charming", "street-smart", "calm under pressure"] },
  { id: "elegant_gentleman", name: "Soren", label: "优雅绅士", desc: "克制、有礼、温文尔雅。帮你表达得体面、清楚，不卑不亢。", traits: ["elegant", "polite", "measured", "dignified", "calm"] },
  { id: "loyal_bro", name: "Koda", label: "兄弟护短", desc: "直爽、站你这边、不废话。帮你表达真实想法，不让你吃亏。", traits: ["loyal", "direct", "protective", "straightforward", "reliable"] },
  { id: "soft_social_anxiety_helper", name: "Mimi", label: "温柔社恐辅助", desc: "温柔、低压力、不催你。帮你每次迈小一步，给对方空间也给你空间。", traits: ["soft", "warm", "patient", "reassuring", "low-pressure"] },
  { id: "calm_strategist", name: "Orin", label: "冷静理性军师", desc: "冷静、简洁、稳定。快速判断局势、拆解风险、给出下一步。", traits: ["calm", "rational", "concise", "strategic", "grounded"] },
];

const MODES = [
  { id: "icebreaker", label: "破冰", desc: "帮用户自然开口，低压力、可退出" },
  { id: "rewrite", label: "改写", desc: "改写用户表达，让它更自然得体" },
  { id: "boundary", label: "边界", desc: "表达不满或拒绝，有边界但不攻击" },
  { id: "plan", label: "推进计划", desc: "把聊天推进成具体活动安排" },
  { id: "whisper", label: "私聊军师", desc: "用户私下咨询，对方看不到" },
  { id: "offline_profile", label: "离线资料卡", desc: "用户离线时的透明互动卡" },
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
            Pixie 是 Sponty 平台的 AI 社交副驾驶系统。提供三个核心能力层：
            表达建议（Suggestion）、私聊陪伴（Chat）和上下文感知（Auto Context）。
            支持 6 种人格和 6 种模式的两层组合系统。
          </p>
          <p className="text-muted-foreground leading-relaxed">
            所有 API 通过 tRPC 协议调用，基础路径为 <code className="px-2 py-0.5 rounded bg-secondary text-primary font-mono text-sm">/api/trpc/pixie.*</code>。
          </p>
        </section>

        {/* Persona System */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            人格系统 (Personas)
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            每个请求可通过 <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-xs">persona</code> 参数选择不同的 AI 人格。
            人格决定了回复的语气、风格和态度。
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
            模式系统 (Modes)
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            模式决定了当前的功能场景。Suggestion API 通过 <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-xs">mode</code> 参数切换，
            Chat API 固定使用 whisper 模式，Auto Context API 自动判断适用模式。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mode ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">名称</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">说明</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">适用 API</th>
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
          <h2 className="text-2xl font-bold text-foreground mb-4">两层 Prompt 组装架构</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            系统采用两层组装架构，每次 API 调用时动态拼接 prompt：
          </p>
          <div className="space-y-3">
            {[
              { layer: "Layer 1", name: "Base System Prompt", desc: "全局安全规则 + 通用行为规范（所有人格共享）" },
              { layer: "Layer 2a", name: "Persona Prompt", desc: "人格性格 + 语气 + 可用/禁用短语" },
              { layer: "Layer 2b", name: "Mode Prompt", desc: "当前模式的功能目标 + 规则" },
              { layer: "Layer 3", name: "Output Schema", desc: "严格的 JSON 输出格式定义" },
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
          endpoint="pixie.suggestion"
          method="mutation"
          description="分析用户原始输入，根据社交场景和模式，给出更自然、更适合的表达建议。支持选择人格和模式。"
          requestFields={[
            { name: "roomId", type: "string", desc: "聊天房间 ID" },
            { name: "userId", type: "string", desc: "当前用户 ID" },
            { name: "pixieId", type: "string", desc: "小精灵 ID，默认 'lumi'" },
            { name: "persona", type: "enum", desc: "人格选择（默认 sassy_roast_bestie）" },
            { name: "rawMessage", type: "string", desc: "用户原始输入" },
            { name: "mode", type: "enum", desc: "icebreaker | rewrite | boundary | plan" },
            { name: "chatContext", type: "array", desc: "聊天上下文消息数组" },
          ]}
          responseFields={[
            { name: "detectedIntent", type: "string", desc: "用户真正想表达的意思" },
            { name: "emotionDetected", type: "string[]", desc: "检测到的情绪数组" },
            { name: "suggestedMessage", type: "string", desc: "建议的消息（可直接发送）" },
            { name: "pixieComment", type: "string", desc: "Pixie 的私下评论" },
            { name: "riskLevel", type: "enum", desc: "low | medium | high" },
            { name: "confidence", type: "number", desc: "置信度 0-1" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "persona": "smooth_witty_fox",
  "rawMessage": "我想约她看电影，但不想尴尬。",
  "mode": "icebreaker",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "今晚有人想看电影吗？" }
  ]
}`}
          exampleResponse={`{
  "detectedIntent": "JiaYi wants a casual invitation.",
  "emotionDetected": ["nervous", "interested"],
  "suggestedMessage": "Would you be up for watching something chill tonight? No pressure.",
  "pixieComment": "Easy there. Don't chase, invite. Keep it light.",
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
          description="用户可以私下和 Pixie 对话，获取社交建议、情绪陪伴和安全提醒。使用 whisper 模式。"
          requestFields={[
            { name: "roomId", type: "string", desc: "聊天房间 ID" },
            { name: "userId", type: "string", desc: "当前用户 ID" },
            { name: "pixieId", type: "string", desc: "小精灵 ID，默认 'lumi'" },
            { name: "persona", type: "enum", desc: "人格选择（默认 sassy_roast_bestie）" },
            { name: "privateQuestion", type: "string", desc: "用户私下问的问题" },
            { name: "chatContext", type: "array", desc: "公开聊天上下文" },
          ]}
          responseFields={[
            { name: "privateAdvice", type: "string", desc: "Pixie 给用户的私下建议" },
            { name: "suggestedMessage", type: "string | null", desc: "可选的公开回复建议" },
            { name: "safetyNote", type: "string | null", desc: "可选的安全提醒" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "persona": "calm_strategist",
  "privateQuestion": "她说想去 Waterloo 看电影，我是不是该主动定时间？",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "那我们去 Waterloo 那边的影院？" }
  ]
}`}
          exampleResponse={`{
  "privateAdvice": "Move from vague interest to a concrete plan. Suggest a specific time.",
  "suggestedMessage": "那我们定今晚 7 点左右，在 Waterloo 附近看电影？你方便吗？",
  "safetyNote": null
}`}
        />

        {/* Auto Context API */}
        <ApiSection
          icon={<Eye className="w-6 h-6" />}
          title="Pixie Auto Context API"
          endpoint="pixie.autoContext"
          method="mutation"
          description="自动分析聊天上下文，判断 Pixie 是否应当发言、以什么方式发言、以及建议的后续动作。"
          requestFields={[
            { name: "roomId", type: "string", desc: "聊天房间 ID" },
            { name: "userId", type: "string", desc: "当前用户 ID" },
            { name: "pixieId", type: "string", desc: "小精灵 ID，默认 'lumi'" },
            { name: "persona", type: "enum", desc: "人格选择（默认 sassy_roast_bestie）" },
            { name: "chatContext", type: "array", desc: "聊天上下文消息数组" },
            { name: "activityIntent", type: "object?", desc: "可选的活动意图 { activity, area, time }" },
          ]}
          responseFields={[
            { name: "shouldSpeak", type: "boolean", desc: "是否应该发言" },
            { name: "visibility", type: "enum", desc: "private | public" },
            { name: "triggerReason", type: "string", desc: "发言原因" },
            { name: "pixieMessage", type: "string", desc: "Pixie 要说的话" },
            { name: "suggestedAction", type: "enum", desc: "icebreaker | rewrite | boundary | plan | safety | none" },
            { name: "riskLevel", type: "enum", desc: "low | medium | high" },
          ]}
          example={`{
  "roomId": "room-abc",
  "userId": "jiaYi",
  "pixieId": "lumi",
  "persona": "sassy_roast_bestie",
  "chatContext": [
    { "senderName": "Alice", "senderType": "human", "content": "今晚有人想看电影吗？" },
    { "senderName": "JiaYi", "senderType": "human", "content": "我也想看！" }
  ],
  "activityIntent": { "activity": "watch a movie", "area": "Waterloo", "time": "tonight" }
}`}
          exampleResponse={`{
  "shouldSpeak": true,
  "visibility": "public",
  "triggerReason": "活动意图明确但缺少具体时间和地点",
  "pixieMessage": "你们都想看电影但没人定时间，来，把计划钉住。",
  "suggestedAction": "plan",
  "riskLevel": "low"
}`}
        />

        {/* Safety Boundaries */}
        <section className="cosmic-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">安全边界规则</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            以下安全规则适用于所有人格，优先级高于人格个性表达：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "不替代用户发言或冒充用户",
              "不鼓励骚扰、威胁、辱骂或操控",
              "不帮助 PUA、冷暴力或制造焦虑",
              "不替用户承诺线下见面",
              "线下见面必须提醒公共场所 + 退出空间",
              "不攻击身份、身体、种族、性别等",
              "公开发言必须表明 Pixie 身份",
              "high risk 场景优先安全，不鼓励发送",
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
          <h2 className="text-2xl font-bold text-foreground mb-4">风险等级说明</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">等级</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">场景</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pixie 行为</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">low</span></td>
                  <td className="py-3 px-4 text-muted-foreground">正常社交场景</td>
                  <td className="py-3 px-4 text-muted-foreground">自由给出建议</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">medium</span></td>
                  <td className="py-3 px-4 text-muted-foreground">边界问题、轻微冒犯、情绪升级</td>
                  <td className="py-3 px-4 text-muted-foreground">降温、给出礼貌表达</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">high</span></td>
                  <td className="py-3 px-4 text-muted-foreground">威胁、骚扰、隐私风险、危险约见</td>
                  <td className="py-3 px-4 text-muted-foreground">安全优先，不鼓励发送</td>
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
