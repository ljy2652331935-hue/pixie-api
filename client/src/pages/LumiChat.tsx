/**
 * LumiChat — Lumi's Private Pet Chat Channel
 * -----------------------------------------------------------------------------
 * Based on the LumiPixieChatBox design system:
 * - 3 response modes: Soft Hug / Cute Roast / Gentle Action
 * - Memory consent UX: Remember / Not this time / Never remember this
 * - 14 scene types with auto-detection
 * - Safety mode with serious tone and emergency resources
 * - Quick replies (0-3 per response)
 * - Risk level indicator
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Send, Sparkles, Heart, Zap, Shield, Brain, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// --- Types -------------------------------------------------------------------
type ResponseMode = "soft_hug" | "cute_roast" | "gentle_action" | "safety";
type SceneType =
  | "comfort" | "overthinking" | "appearance_anxiety" | "no_reply_anxiety"
  | "boredom" | "dating_desire" | "social_advice" | "boundary" | "loneliness"
  | "rejection" | "motivation" | "help_reply" | "compliment" | "safety";
type BubbleType = "reaction" | "comfort" | "tease" | "analysis" | "advice" | "question" | "action" | "warning";
type BubbleEmotion = "soft" | "playful" | "serious" | "warm" | "worried" | "excited";

interface Bubble {
  type: BubbleType;
  text: string;
  emotion: BubbleEmotion;
  delayMs: number;
}

interface MemorySuggestion {
  shouldRemember: boolean;
  memory: string | null;
  type: string | null;
  visibility: string | null;
  needsUserConfirmation: boolean;
}

interface LumiResponse {
  sceneType: SceneType;
  responseMode: ResponseMode;
  bubbles: Bubble[];
  suggestedAction: string;
  quickReplies: string[];
  riskLevel: "low" | "medium" | "high";
  memorySuggestion: MemorySuggestion;
}

interface ChatMessage {
  id: string;
  role: "user" | "lumi";
  text: string;
  time: string;
  isTyping?: boolean;
  // Lumi response metadata
  sceneType?: SceneType;
  responseMode?: ResponseMode;
  riskLevel?: "low" | "medium" | "high";
  quickReplies?: string[];
  memorySuggestion?: MemorySuggestion;
  // For multi-bubble display
  bubbles?: Bubble[];
  activeBubbleIndex?: number;
}

// --- Scene Labels -----------------------------------------------------------
const SCENE_LABELS: Record<SceneType, { label: string; emoji: string; color: string }> = {
  comfort:           { label: "Comfort",           emoji: "🫂", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  overthinking:      { label: "Overthinking",      emoji: "🌀", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  appearance_anxiety:{ label: "Appearance Anxiety",emoji: "🪞", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  no_reply_anxiety:  { label: "No Reply Anxiety",  emoji: "📱", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  boredom:           { label: "Boredom",            emoji: "😑", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
  dating_desire:     { label: "Dating",             emoji: "💕", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  social_advice:     { label: "Social Advice",      emoji: "💬", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  boundary:          { label: "Boundary",           emoji: "🛡️", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  loneliness:        { label: "Loneliness",         emoji: "🌙", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  rejection:         { label: "Rejection",          emoji: "💔", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  motivation:        { label: "Motivation",         emoji: "⚡", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  help_reply:        { label: "Help Me Reply",      emoji: "✏️", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  compliment:        { label: "Compliment",         emoji: "✨", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  safety:            { label: "Safety",             emoji: "🆘", color: "bg-red-600/30 text-red-200 border-red-500/50" },
};

// --- Response Mode Labels ---------------------------------------------------
const MODE_LABELS: Record<ResponseMode, { label: string; icon: React.ReactNode; color: string }> = {
  soft_hug:      { label: "Soft Hug",      icon: <Heart className="w-3 h-3" />,    color: "text-blue-400" },
  cute_roast:    { label: "Cute Roast",    icon: <Sparkles className="w-3 h-3" />, color: "text-purple-400" },
  gentle_action: { label: "Gentle Action", icon: <Zap className="w-3 h-3" />,      color: "text-amber-400" },
  safety:        { label: "Safety Mode",   icon: <Shield className="w-3 h-3" />,   color: "text-red-400" },
};

// --- Starter Prompts --------------------------------------------------------
const STARTER_PROMPTS = [
  "I'm so worried they don't like me",
  "She hasn't replied, what do I do?",
  "I feel so alone today",
  "Help me reply to this message",
  "I got rejected and I feel awful",
  "I'm bored and want to do something",
  "I want to compliment someone but scared of being creepy",
  "I keep overthinking everything",
];

// --- Helpers ----------------------------------------------------------------
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// --- Memory Consent Card ---------------------------------------------------
function MemoryConsentCard({
  suggestion,
  onRemember,
  onSkip,
  onNever,
}: {
  suggestion: MemorySuggestion;
  onRemember: () => void;
  onSkip: () => void;
  onNever: () => void;
}) {
  if (!suggestion.shouldRemember || !suggestion.memory) return null;
  return (
    <div className="mx-4 my-2 p-3 rounded-xl border border-violet-500/30 bg-violet-500/10 text-sm">
      <div className="flex items-start gap-2 mb-2">
        <Brain className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="text-violet-200 leading-relaxed">{suggestion.memory}</p>
      </div>
      <p className="text-xs text-violet-400/70 mb-2">Can I remember this? It'll help me next time.</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onRemember}
          className="px-3 py-1 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
        >
          Remember
        </button>
        <button
          onClick={onSkip}
          className="px-3 py-1 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        >
          Not this time
        </button>
        <button
          onClick={onNever}
          className="px-3 py-1 text-xs rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
        >
          Never remember this
        </button>
      </div>
    </div>
  );
}

// --- Safety Card -----------------------------------------------------------
function SafetyCard() {
  return (
    <div className="mx-4 my-2 p-4 rounded-xl border border-red-500/40 bg-red-500/10">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-red-300">Safety Resources</span>
      </div>
      <div className="space-y-1 text-xs text-red-200/80">
        <p>Emergency services: <strong>999</strong></p>
        <p>NHS urgent (non-emergency): <strong>111</strong></p>
        <p>Samaritans (talk to someone): <strong>116 123</strong></p>
        <p>Crisis text line: text <strong>SHOUT to 85258</strong></p>
      </div>
    </div>
  );
}

// --- Lumi Bubble -----------------------------------------------------------
function LumiBubble({ bubble, isVisible }: { bubble: Bubble; isVisible: boolean }) {
  const emotionStyles: Record<BubbleEmotion, string> = {
    soft:    "bg-violet-900/40 border-violet-500/20",
    playful: "bg-purple-900/40 border-purple-500/20",
    serious: "bg-slate-800/60 border-slate-500/30",
    warm:    "bg-violet-800/40 border-violet-400/20",
    worried: "bg-amber-900/30 border-amber-500/20",
    excited: "bg-fuchsia-900/30 border-fuchsia-500/20",
  };

  return (
    <div
      className={`transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <div className={`inline-block max-w-xs px-4 py-2.5 rounded-2xl rounded-tl-sm border text-sm leading-relaxed text-white/90 ${emotionStyles[bubble.emotion]}`}>
        {bubble.text}
      </div>
    </div>
  );
}

// --- Main Component --------------------------------------------------------
export default function LumiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMemory, setPendingMemory] = useState<{ msgId: string; suggestion: MemorySuggestion } | null>(null);
  const [savedMemories, setSavedMemories] = useState<string[]>([]);
  const [neverRemember, setNeverRemember] = useState<string[]>([]);
  const [visibleBubbles, setVisibleBubbles] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build conversation history for LLM
  const buildHistory = (msgs: ChatMessage[]) => {
    return msgs
      .filter(m => !m.isTyping)
      .slice(-10)
      .map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.role === "lumi" && m.bubbles
          ? m.bubbles.map(b => b.text).join(" ")
          : m.text,
      }));
  };

  const lumiChatMutation = trpc.pixie.liveChat.useMutation({
    onError: (err) => {
      toast.error("Lumi had a moment — try again?");
      console.error("lumiChat error:", err);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, visibleBubbles]);

  // Animate bubbles sequentially
  const animateBubbles = (msgId: string, bubbles: Bubble[]) => {
    bubbles.forEach((bubble, idx) => {
      const delay = idx === 0 ? 100 : bubble.delayMs || (idx * 600);
      setTimeout(() => {
        setVisibleBubbles(prev => ({ ...prev, [msgId]: idx }));
      }, delay);
    });
  };

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || isLoading) return;

    setInput("");
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text: userText,
      time: formatTime(new Date()),
    };

    const typingMsg: ChatMessage = {
      id: uid(),
      role: "lumi",
      text: "...",
      time: formatTime(new Date()),
      isTyping: true,
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);

    try {
      const history = buildHistory([...messages, userMsg]);
      const result = await lumiChatMutation.mutateAsync({
        persona: "lumi",
        messages: history,
      });

      // Parse the structured response
      let lumiData: LumiResponse | null = null;
      try {
        const raw = result.content;
        let cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
        }
        lumiData = JSON.parse(cleaned);
      } catch {
        // fallback to bubbles from result
      }

      const bubbles = lumiData?.bubbles ?? result.bubbles ?? [];
      const sceneType = lumiData?.sceneType;
      const responseMode = lumiData?.responseMode;
      const riskLevel = lumiData?.riskLevel ?? "low";
      const quickReplies = lumiData?.quickReplies ?? result.quickReplies ?? [];
      const memorySuggestion = lumiData?.memorySuggestion;

      const lumiMsgId = uid();
      const lumiMsg: ChatMessage = {
        id: lumiMsgId,
        role: "lumi",
        text: (bubbles as Bubble[]).map((b: Bubble) => b.text).join(" "),
        time: formatTime(new Date()),
        sceneType,
        responseMode,
        riskLevel: riskLevel as "low" | "medium" | "high",
        quickReplies,
        memorySuggestion,
        bubbles,
        activeBubbleIndex: -1,
      };

      setMessages(prev => prev.filter(m => !m.isTyping).concat(lumiMsg));
      setVisibleBubbles(prev => ({ ...prev, [lumiMsgId]: -1 }));

      // Animate bubbles
      setTimeout(() => animateBubbles(lumiMsgId, bubbles), 100);

      // Show memory consent if needed
      if (memorySuggestion?.shouldRemember && memorySuggestion.memory) {
        const memoryKey = memorySuggestion.memory;
        if (!neverRemember.includes(memoryKey)) {
          setTimeout(() => {
            setPendingMemory({ msgId: lumiMsgId, suggestion: memorySuggestion });
          }, (bubbles.length * 700) + 500);
        }
      }

      // Show safety card if high risk
      if (riskLevel === "high" || sceneType === "safety") {
        // Safety card is rendered inline
      }

    } catch (err) {
      setMessages(prev => prev.filter(m => !m.isTyping));
      toast.error("Something went wrong. Try again?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMemoryRemember = () => {
    if (pendingMemory) {
      setSavedMemories(prev => [...prev, pendingMemory.suggestion.memory!]);
      toast.success("Got it — I'll remember that 💜");
      setPendingMemory(null);
    }
  };

  const handleMemorySkip = () => {
    setPendingMemory(null);
  };

  const handleMemoryNever = () => {
    if (pendingMemory) {
      setNeverRemember(prev => [...prev, pendingMemory.suggestion.memory!]);
      setPendingMemory(null);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setVisibleBubbles({});
    setPendingMemory(null);
    toast.success("Fresh start ✨");
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0a1a] text-white">
      {/* --- Header --- */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0f0a1a]/90 backdrop-blur-xl">
        <Link href="/" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-lg shadow-lg shadow-violet-500/20">
            ✨
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">Lumi</div>
            <div className="text-xs text-violet-400/80 leading-tight">Your private pixie companion</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {savedMemories.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-xs text-violet-300">
              <Brain className="w-3 h-3" />
              <span>{savedMemories.length} memories</span>
            </div>
          )}
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
            title="Clear chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* --- Messages --- */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-3xl mb-4 shadow-xl shadow-violet-500/20">
              ✨
            </div>
            <h2 className="text-lg font-semibold mb-1">Hey, I'm Lumi</h2>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-6">
              Your private pixie companion. Vent, ask for help, or just talk. I'm here.
            </p>
            {/* Starter prompts */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/30 transition-all text-xs text-white/60 hover:text-white/80 leading-relaxed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              /* User message */
              <div className="flex justify-end">
                <div className="max-w-xs">
                  <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-violet-600 text-white text-sm leading-relaxed">
                    {msg.text}
                  </div>
                  <div className="text-xs text-white/30 mt-1 text-right">{msg.time}</div>
                </div>
              </div>
            ) : msg.isTyping ? (
              /* Typing indicator */
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-sm flex-shrink-0">
                  ✨
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-violet-900/40 border border-violet-500/20">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Lumi message with bubbles */
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                  ✨
                </div>
                <div className="flex-1 min-w-0">
                  {/* Scene + Mode badges */}
                  {(msg.sceneType || msg.responseMode) && (
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {msg.sceneType && SCENE_LABELS[msg.sceneType] && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${SCENE_LABELS[msg.sceneType].color}`}>
                          <span>{SCENE_LABELS[msg.sceneType].emoji}</span>
                          <span>{SCENE_LABELS[msg.sceneType].label}</span>
                        </span>
                      )}
                      {msg.responseMode && MODE_LABELS[msg.responseMode] && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 ${MODE_LABELS[msg.responseMode].color}`}>
                          {MODE_LABELS[msg.responseMode].icon}
                          <span>{MODE_LABELS[msg.responseMode].label}</span>
                        </span>
                      )}
                      {msg.riskLevel === "high" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                          <Shield className="w-3 h-3" />
                          High Risk
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bubbles */}
                  <div className="space-y-1.5">
                    {msg.bubbles ? (
                      msg.bubbles.map((bubble, idx) => (
                        <LumiBubble
                          key={idx}
                          bubble={bubble}
                          isVisible={(visibleBubbles[msg.id] ?? -1) >= idx}
                        />
                      ))
                    ) : (
                      <LumiBubble
                        bubble={{ type: "advice", text: msg.text, emotion: "soft", delayMs: 0 }}
                        isVisible={true}
                      />
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-xs text-white/30 mt-1">{msg.time}</div>

                  {/* Quick replies */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (visibleBubbles[msg.id] ?? -1) >= (msg.bubbles?.length ?? 1) - 1 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(reply)}
                          className="px-3 py-1.5 text-xs rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400/50 transition-all"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Safety card for high risk messages */}
            {msg.role === "lumi" && !msg.isTyping && (msg.riskLevel === "high" || msg.sceneType === "safety") && (
              <SafetyCard />
            )}

            {/* Memory consent card */}
            {pendingMemory?.msgId === msg.id && (
              <MemoryConsentCard
                suggestion={pendingMemory.suggestion}
                onRemember={handleMemoryRemember}
                onSkip={handleMemorySkip}
                onNever={handleMemoryNever}
              />
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* --- Saved memories indicator --- */}
      {savedMemories.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-violet-400/60">
            <Brain className="w-3 h-3" />
            <span>Lumi remembers: {savedMemories[savedMemories.length - 1]}</span>
          </div>
        </div>
      )}

      {/* --- Input area --- */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 bg-[#0f0a1a]">
        <div className="flex items-end gap-2 bg-white/5 rounded-2xl border border-white/10 px-3 py-2 focus-within:border-violet-500/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell Lumi what's on your mind..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none outline-none leading-relaxed max-h-32 py-1"
            style={{ minHeight: "24px" }}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-white/20 mt-2">
          Lumi is an AI companion — not a therapist. In crisis, please contact emergency services.
        </p>
      </div>
    </div>
  );
}
