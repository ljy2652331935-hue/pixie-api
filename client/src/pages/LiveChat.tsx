/**
 * LiveChat — Lucy & Pat real-time chat interface + Lumi/Foxxz pixie context awareness
 * -----------------------------------------------------------------------------
 * Interaction flow:
 *   • After sending a message → pixie auto-reads context, inserts suggestion bubbles into chat
 *   • ✨ button (Ask Pixie) → bottom panel with suggestion card, watch-outs, try sending this
 *   • Click pixie avatar → bottom panel for Lumi whisper private chat
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Sparkles, X, Send, MoreHorizontal, Shield, Zap, Smile } from "lucide-react";
import { toast } from "sonner";

// --- Types --------------------------------------------------------------------
type PersonaId = "lumi" | "foxxz";
type MsgRole = "me" | "other" | "lumi" | "foxxz";

interface ChatMsg {
  id: string;
  role: MsgRole;
  text: string;
  time: string;
  senderName?: string;
  avatarInitial?: string;
  avatarColor?: string;
  isTyping?: boolean;
  isLumiSuggestion?: boolean;
  isFoxxzSuggestion?: boolean;
}

interface WhisperMsg {
  id: string;
  role: "user" | "lumi";
  text: string;
  time: string;
  isTyping?: boolean;
}

interface SuggestResult {
  detectedMode: string;
  detectedIntent: string;
  emotionDetected: string[];
  riskFlags: string[];
  rewriteStrategy: string;
  privateBubbles: { type: string; text: string; emotion: string; delayMs: number }[];
  suggestedPublicMessage: string;
  userVoiceMatch: number;
  riskLevel: string;
  confidence: number;
}

// --- Constants ----------------------------------------------------------------
const PERSONAS: { id: PersonaId; label: string; emoji: string; color: string }[] = [
  { id: "lumi", label: "Lumi", emoji: "✨", color: "from-purple-500 to-violet-600" },
  { id: "foxxz", label: "Foxxz", emoji: "🦊", color: "from-amber-500 to-orange-500" },
];

const OTHER_USER = { name: "Pat", initial: "P", color: "bg-rose-400" };
const MY_USER = { name: "Lucy", initial: "L", color: "bg-violet-500" };

const SEED_MESSAGES: ChatMsg[] = [
  { id: "s1", role: "me", text: "Had so much fun today! Your book recs were spot on 💜", time: "9:40 PM" },
  {
    id: "s2", role: "other",
    text: "Haha glad you liked them! Let's do it again soon 😄",
    time: "9:41 PM", senderName: OTHER_USER.name, avatarInitial: OTHER_USER.initial, avatarColor: OTHER_USER.color,
  },
  { id: "s4", role: "me", text: "Definitely! We should check out that museum next time 🖼", time: "9:42 PM" },
  {
    id: "s5", role: "other",
    text: "Yes! Are you free this Saturday?",
    time: "9:43 PM", senderName: OTHER_USER.name, avatarInitial: OTHER_USER.initial, avatarColor: OTHER_USER.color,
  },
];

const ALICE_REPLIES = [
  "Haha sure! Sounds fun 😄",
  "I was thinking the same thing!",
  "Really? Tell me more 👀",
  "Yay! We have to go 💜",
  "That's such a great idea!",
  "I'd love that 🙌",
  "Okay okay, it's a plan then",
  "I've always wanted to go there!",
  "That sounds so cute 🥹",
  "Let me check my schedule and get back to you!",
];

const QUICK_PROMPTS = [
  { label: "Help me reply 💬", text: "Help me reply to Pat's last message" },
  { label: "What does Pat mean? 🤔", text: "What do you think Pat means by that?" },
  { label: "Can I send this? ✨", text: "Can I send what I have in the input box?" },
  { label: "Ask Pat out 💜", text: "Help me ask Pat to hang out again" },
];

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// --- Avatar -------------------------------------------------------------------
function Avatar({ initial, color, size = "md" }: { initial: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-14 h-14 text-xl" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initial}
    </div>
  );
}

// --- Pixie Avatar (clickable) ---
function LumiAvatar({ persona, size = "md", onClick }: { persona: PersonaId; size?: "sm" | "md" | "lg"; onClick?: () => void }) {
  const sz = size === "sm" ? "w-7 h-7 text-base" : size === "lg" ? "w-14 h-14 text-2xl" : "w-9 h-9 text-lg";
  const p = PERSONAS.find(p => p.id === persona) ?? PERSONAS[0]!;
  return (
    <button
      onClick={onClick}
      className={`${sz} rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center flex-shrink-0 shadow-sm ${onClick ? "cursor-pointer hover:scale-110 active:scale-95 transition-transform" : "cursor-default"}`}
    >
      <span>{p.emoji}</span>
    </button>
  );
}

// --- Message Bubble ---
// Lumi fixed config (Lucy's pixie, always Bestie style)
const LUMI_CONFIG = { emoji: "✨", zhLabel: "Lumi ✨", color: "from-purple-500 to-violet-600" };

function MsgBubble({ msg, persona }: { msg: ChatMsg; persona: PersonaId }) {
  // persona state only used for Ask Lumi panel and Whisper, does not affect bubble avatar
  void persona;

  // Lumi suggestion bubble (Lucy right side, fixed Lumi style)
  if (msg.role === "lumi") {
    return (
      <div className="flex flex-row-reverse items-end gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${LUMI_CONFIG.color} flex items-center justify-center text-base flex-shrink-0 shadow-sm`}>
          {LUMI_CONFIG.emoji}
        </div>
        <div className="max-w-[72%]">
          <p className="text-[10px] text-[#9B9BB4] mb-1 mr-1 text-right">
            {LUMI_CONFIG.zhLabel}
          </p>
          <div className="rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border border-[#D8D0FF] bg-[#F0EEFF]">
            {msg.isTyping ? (
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:300ms]" />
              </div>
            ) : (
              <p className="text-sm text-[#4A3FC8] leading-relaxed">{msg.text}</p>
            )}
          </div>
          <p className="text-[11px] text-[#9B9BB4] mt-1 mr-1 text-right">{msg.time}</p>
        </div>
      </div>
    );
  }

  // Foxxz suggestion bubble (Pat left side)
  if (msg.role === "foxxz") {
    return (
      <div className="flex items-end gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-base flex-shrink-0 shadow-sm">
          🦊
        </div>
        <div className="max-w-[72%]">
          <p className="text-[10px] text-[#9B9BB4] mb-1 ml-1">
            Foxxz 🦊
          </p>
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#FFE0A8] bg-[#FFF8EC]">
            {msg.isTyping ? (
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 rounded-full bg-[#C8A060] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[#C8A060] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#C8A060] animate-bounce [animation-delay:300ms]" />
              </div>
            ) : (
              <p className="text-sm text-[#8B5E1A] leading-relaxed">{msg.text}</p>
            )}
          </div>
          <p className="text-[11px] text-[#9B9BB4] mt-1 ml-1">{msg.time}</p>
        </div>
      </div>
    );
  }

  // My message (right side)
  if (msg.role === "me") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[72%]">
          <div className="bg-[#5B4FD9] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
            {msg.isTyping ? (
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
              </div>
            ) : <p className="text-sm leading-relaxed">{msg.text}</p>}
          </div>
          <p className="text-right text-[11px] text-[#9B9BB4] mt-1 pr-1">{msg.time}</p>
        </div>
      </div>
    );
  }

  // Other's message (left side)
  return (
    <div className="flex items-end gap-2 mb-3">
      <Avatar initial={msg.avatarInitial ?? "?"} color={msg.avatarColor ?? "bg-gray-400"} />
      <div className="max-w-[72%]">
        {msg.senderName && <p className="text-[11px] text-[#9B9BB4] mb-1 ml-1">{msg.senderName}</p>}
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#EBEBF5]">
          {msg.isTyping ? (
            <div className="flex gap-1 items-center h-5">
              <span className="w-2 h-2 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:300ms]" />
            </div>
          ) : <p className="text-sm text-[#2D2D44] leading-relaxed">{msg.text}</p>}
        </div>
        <p className="text-[11px] text-[#9B9BB4] mt-1 ml-1">{msg.time}</p>
      </div>
    </div>
  );
}

// --- Ask Pixie Bottom Panel (triggered by ✨ button) ---
function AskLumiSheet({
  persona, inputText, chatContext, onClose, onUseThis,
}: {
  persona: PersonaId;
  inputText: string;
  chatContext: ChatMsg[];
  onClose: () => void;
  onUseThis: (text: string) => void;
}) {
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [loading, setLoading] = useState(true);

  const suggestMutation = trpc.pixie.suggest.useMutation({
    onSuccess: (data) => { setResult(data as SuggestResult); setLoading(false); },
    onError: () => { setLoading(false); toast.error("Pixie is temporarily unavailable, please try again later"); },
  });

  const playfulMutation = trpc.pixie.suggest.useMutation({
    onSuccess: (data) => setResult(data as SuggestResult),
    onError: () => toast.error("Pixie cannot generate a more playful version"),
  });

  useEffect(() => {
    const context = chatContext.filter(m => m.role !== "lumi" && m.role !== "foxxz").slice(-6).map(m => ({
      senderName: m.role === "me" ? MY_USER.name : OTHER_USER.name,
      senderType: "human" as const,
      content: m.text,
    }));
    suggestMutation.mutate({
      roomId: "livechat-demo",
      userId: "demo-user",
      persona,
      rawMessage: inputText || "Help me reply",
      chatContext: context,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMorePlayful = () => {
    const context = chatContext.filter(m => m.role !== "lumi" && m.role !== "foxxz").slice(-6).map(m => ({
      senderName: m.role === "me" ? MY_USER.name : OTHER_USER.name,
      senderType: "human" as const,
      content: m.text,
    }));
    playfulMutation.mutate({
      roomId: "livechat-demo",
      userId: "demo-user",
      persona,
      rawMessage: (inputText || "Help me reply") + " — make it more playful and fun",
      chatContext: context,
    });
  };

  const p = PERSONAS.find(x => x.id === persona) ?? PERSONAS[0]!;
  const riskPct = result ? Math.round(result.confidence * 100) : 0;
  const voiceMatch = result ? Math.round(result.userVoiceMatch * 100) : 0;
  const riskColor = result?.riskLevel === "high" ? "text-red-500" : result?.riskLevel === "medium" ? "text-amber-500" : "text-emerald-500";
  const riskLabel = result?.riskLevel === "high" ? "High" : result?.riskLevel === "medium" ? "Med" : "Low";

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85%] flex flex-col overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#DDDDF0]" />
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
              {p.emoji}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D2D44]">Ask Pixie</h2>
              <p className="text-xs text-[#9B9BB4] flex items-center gap-1">
                <Shield className="w-3 h-3" /> Only you can see this
              </p>
            </div>
            <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-[#F5F4FB] flex items-center justify-center text-[#9B9BB4] hover:bg-[#EBEBF5]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-xl animate-pulse`}>{p.emoji}</div>
              <p className="text-sm text-[#9B9BB4]">Pixie is thinking...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Private bubbles */}
              {result.privateBubbles.length > 0 && (
                <div className="space-y-2">
                  {result.privateBubbles.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#7B6FD8] mt-0.5 flex-shrink-0">✦</span>
                      <p className="text-sm text-[#2D2D44] bg-[#F5F4FB] rounded-xl px-3 py-2 flex-1">{b.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Current state */}
              {result.emotionDetected.length > 0 && (
                <div className="bg-[#FAFAFA] rounded-2xl p-3 border border-[#EBEBF5]">
                  <p className="text-xs font-semibold text-[#9B9BB4] mb-2 flex items-center gap-1">
                    <Smile className="w-3 h-3" /> Your vibe right now
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.emotionDetected.map((e, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#DDDDF0] text-[#5B4FD9]">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Watch-outs */}
              {result.riskFlags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#2D2D44] mb-2 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#7B6FD8]" /> Watch-outs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.riskFlags.map((f, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[#FFF5F5] border border-[#FFD5D5] text-[#C0392B] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] inline-block" />{f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pixie's understanding */}
              {result.detectedIntent && (
                <div>
                  <p className="text-xs font-semibold text-[#2D2D44] mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#7B6FD8]" /> Pixie thinks you mean
                  </p>
                  <p className="text-sm text-[#6B6B8A] bg-[#F5F4FB] rounded-xl px-3 py-2">{result.detectedIntent}</p>
                </div>
              )}

              {/* Suggested message */}
              {result.suggestedPublicMessage && (
                <div className="bg-[#F0EEFF] rounded-2xl p-4 border border-[#D8D0FF]">
                  <p className="text-xs font-semibold text-[#5B4FD9] mb-2 flex items-center gap-1">
                    <Send className="w-3 h-3" /> Try sending this
                  </p>
                  <p className="text-base font-medium text-[#2D2D44] leading-relaxed">{result.suggestedPublicMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#9B9BB4] text-center py-8">No suggestions yet</p>
          )}
        </div>

        {/* Action buttons */}
        {result?.suggestedPublicMessage && (
          <div className="px-5 pb-5 pt-3 border-t border-[#EBEBF5] flex-shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => onUseThis(result.suggestedPublicMessage)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#5B4FD9] text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-[#4A3FC8] active:scale-98 transition-all shadow-md"
              >
                <Send className="w-4 h-4" /> Use this
              </button>
              <button
                onClick={handleMorePlayful}
                disabled={playfulMutation.isPending}
                className="flex items-center justify-center gap-1.5 px-4 bg-[#F5F4FB] text-[#5B4FD9] rounded-2xl py-3.5 font-medium text-sm hover:bg-[#EBEBF5] active:scale-98 transition-all border border-[#D8D0FF] disabled:opacity-50"
              >
                <Smile className="w-4 h-4" /> More playful
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-4 bg-[#F5F4FB] text-[#9B9BB4] rounded-2xl py-3.5 font-medium text-sm hover:bg-[#EBEBF5] active:scale-98 transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
            {result && (
              <p className="text-center text-[10px] text-[#9B9BB4] mt-2">
                Risk: <span className={riskColor}>{riskLabel}</span>
                {" · "}Confidence: {riskPct}%
                {" · "}Voice Match: {voiceMatch}%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Lumi Whisper Panel (triggered by pixie avatar click) ---
function LumiWhisperSheet({
  persona, chatContext, onClose, onUseThis, injectedMessages,
}: {
  persona: PersonaId;
  chatContext: ChatMsg[];
  onClose: () => void;
  onUseThis: (text: string) => void;
  injectedMessages?: WhisperMsg[];
}) {
  const [whisperMsgs, setWhisperMsgs] = useState<WhisperMsg[]>(injectedMessages ?? []);

  // When external injected messages update, append to list
  useEffect(() => {
    if (injectedMessages && injectedMessages.length > 0) {
      setWhisperMsgs(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = injectedMessages.filter(m => !existingIds.has(m.id));
        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectedMessages?.length]);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = trpc.pixie.chat.useMutation({
    onSuccess: (data) => {
      setWhisperMsgs(prev => prev.filter(m => m.id !== "lumi-typing"));
      const bubbles: string[] = (data.bubbles ?? []).map((b: { text: string }) => b.text);
      bubbles.forEach((text, i) => {
        setTimeout(() => {
          setWhisperMsgs(prev => [
            ...prev,
            { id: `lumi-${Date.now()}-${i}`, role: "lumi", text, time: getTime() },
          ]);
        }, i * 500);
      });
    },
    onError: () => {
      setWhisperMsgs(prev => prev.filter(m => m.id !== "lumi-typing"));
      toast.error("Pixie is temporarily unavailable");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [whisperMsgs]);

  const sendToLumi = (text: string) => {
    if (!text.trim()) return;
    const userMsg: WhisperMsg = { id: `u-${Date.now()}`, role: "user", text: text.trim(), time: getTime() };
    setWhisperMsgs(prev => [...prev, userMsg]);
    setWhisperMsgs(prev => [...prev, { id: "lumi-typing", role: "lumi", text: "", time: getTime(), isTyping: true }]);
    const context = chatContext.filter(m => m.role !== "lumi" && m.role !== "foxxz").slice(-6).map(m => ({
      senderName: m.role === "me" ? MY_USER.name : OTHER_USER.name,
      senderType: "human" as const,
      content: m.text,
    }));
    chatMutation.mutate({
      roomId: "livechat-demo",
      userId: "demo-user",
      persona,
      privateQuestion: text.trim(),
      chatContext: context,
    });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendToLumi(inputText);
    setInputText("");
  };

  const p = PERSONAS.find(x => x.id === persona) ?? PERSONAS[0]!;

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-[#F8F7FF] rounded-t-3xl shadow-2xl max-h-[85%] flex flex-col overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#DDDDF0]" />
        </div>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#EBEBF5] flex-shrink-0">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
            {p.emoji}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2D2D44] flex items-center gap-1.5">
              Pixie Whisper <span className="text-[#7B6FD8]">✦</span>
            </h2>
            <p className="text-[11px] text-[#9B9BB4] flex items-center gap-1">
              <Shield className="w-3 h-3" /> Only you can see this
            </p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-[#F5F4FB] flex items-center justify-center text-[#9B9BB4] hover:bg-[#EBEBF5]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[160px]">
          {whisperMsgs.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-[#9B9BB4]">Anything you want to ask Pixie privately?</p>
            </div>
          )}
          {whisperMsgs.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "items-end gap-2"}`}>
              {msg.role === "lumi" && (
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-sm flex-shrink-0`}>
                  {p.emoji}
                </div>
              )}
              <div className="max-w-[78%]">
                {msg.role === "lumi" && <p className="text-[10px] text-[#9B9BB4] mb-1 ml-1">Pixie</p>}
                <div className={`rounded-2xl px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-[#5B4FD9] text-white rounded-tr-sm"
                    : "bg-white text-[#2D2D44] rounded-tl-sm border border-[#EBEBF5] shadow-sm"
                }`}>
                  {msg.isTyping ? (
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B9BB4] animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                </div>
                <p className={`text-[10px] text-[#9B9BB4] mt-1 ${msg.role === "user" ? "text-right pr-1" : "ml-1"}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-4 pt-2 pb-3 bg-white border-t border-[#EBEBF5] flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#F5F4FB] rounded-full px-4 py-2.5">
            <Sparkles className="w-4 h-4 text-[#9B9BB4] flex-shrink-0" />
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask Pixie privately..."
              className="flex-1 bg-transparent text-sm text-[#2D2D44] placeholder:text-[#9B9BB4] outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || chatMutation.isPending}
              className="w-8 h-8 rounded-full bg-[#5B4FD9] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#4A3FC8] active:scale-95 transition-all flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Quick prompts */}
          <div className="flex gap-2 overflow-x-auto mt-2 pb-1 scrollbar-none">
            {QUICK_PROMPTS.map(q => (
              <button
                key={q.label}
                onClick={() => sendToLumi(q.text)}
                className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-[#F0EEFF] text-[#5B4FD9] border border-[#D8D0FF] hover:bg-[#E4DEFF] transition-colors whitespace-nowrap"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Persona Selector Capsule ---
function PersonaPill({ persona, selected, onClick }: { persona: typeof PERSONAS[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        selected ? `bg-gradient-to-r ${persona.color} text-white shadow-sm` : "bg-[#EBEBF5] text-[#6B6B8A] hover:bg-[#DDD8F5]"
      }`}
    >
      <span>{persona.emoji}</span>
      {persona.label}
    </button>
  );
}

// --- Main Page ---
export default function LiveChat() {
  const [messages, setMessages] = useState<ChatMsg[]>(SEED_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [persona, setPersona] = useState<PersonaId>("lumi");
  const [showAskLumi, setShowAskLumi] = useState(false);
  const [showWhisper, setShowWhisper] = useState(false);
  const [whisperQueue, setWhisperQueue] = useState<WhisperMsg[]>([]);
  const [whisperBadge, setWhisperBadge] = useState(false); // New whisper badge
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Round allocation: randomly decide which pixie speaks each round（"lumi" | "foxxz" | "none"）
  const roundSpeaker = useRef<"lumi" | "foxxz" | "none">("none");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Scene detection: determine if pixie must speak
  const detectMustSpeak = useCallback((msgs: ChatMsg[], triggerText: string): boolean => {
    const humanMsgs = msgs.filter(m => m.role === "me" || m.role === "other");
    const last4 = humanMsgs.slice(-4).map(m => m.text);
    const allText = [...last4, triggerText].join(" ");
    // Meeting scene: mentions meeting/time/place
    if (/weekend|saturday|sunday|meet up|hang out|date|get together|catch up/i.test(allText)) return true;
    // Missing details: has intent but no specific time/place
    if (/sure|okay|sounds good|i.m down|let.s do it/i.test(triggerText) && /meet|hang out|date/i.test(last4.join(" "))) return true;
    // Awkward silence: last 4 messages are all short replies
    if (last4.length >= 3 && last4.every(t => /^(haha|yeah|ok|OK|sure|yep|mhm|lol|hah|hmm|nice|cool)$/i.test(t.trim()))) return true;
    // First time suggesting to meet
    if (/wanna meet|wanna hang|let's meet|should we meet|come out|let's grab/i.test(triggerText)) return true;
    return false;
  }, []);

  // Lumi public speak mutation
  // lumiPublicSpeakMutation: global callback does not handle message insertion to avoid duplication with inline onSuccess
  // Message insertion logic is unified in triggerLumiAutoSuggest inline onSuccess
  const lumiPublicSpeakMutation = trpc.pixie.publicSpeak.useMutation();

  // Trigger Lumi public participation (delayed after sending message)
  const triggerLumiAutoSuggest = useCallback((currentMsgs: ChatMsg[], sentText: string) => {
    // Round check: skip if not Lumi's turn
    if (roundSpeaker.current !== "lumi") return;
    const mustSpeak = detectMustSpeak(currentMsgs, sentText);
    if (!mustSpeak && Math.random() > 0.7) return;
    const delay = mustSpeak ? 1800 : (2500 + Math.random() * 1000);
    // Use unique id per trigger to avoid race condition overwrites
    const typingId = `lumi-typing-${Date.now()}`;
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: typingId,
          role: "lumi" as const,
          text: "",
          time: getTime(),
          isTyping: true,
        },
      ]);
      const context = currentMsgs.filter(m => m.role !== "lumi" && m.role !== "foxxz").slice(-8).map(m => ({
        senderName: m.role === "me" ? MY_USER.name : OTHER_USER.name,
        senderType: "human" as const,
        content: m.text,
      }));
      // Store typingId in closure, onSuccess/onError clears the correct indicator
      lumiPublicSpeakMutation.mutate(
        {
          persona,
          pixieName: "Lumi",
          ownerName: MY_USER.name,
          otherName: OTHER_USER.name,
          chatContext: context,
          triggerMessage: sentText,
          triggerBy: "owner",
        },
        {
          onSuccess: (data) => {
            setMessages(prev => prev.filter(m => m.id !== typingId));
            if (data.shouldSpeak && data.message && data.message.trim()) {
              if (data.visibility === "private_whisper") {
                setWhisperQueue(prev => [...prev, { id: `lumi-w-${Date.now()}`, role: "lumi", text: data.message!, time: getTime() }]);
                setWhisperBadge(true);
              } else {
                setMessages(prev => [...prev, { id: `lumi-pub-${Date.now()}`, role: "lumi" as const, text: data.message!, time: getTime(), isLumiSuggestion: false }]);
              }
            }
          },
          onError: () => {
            setMessages(prev => prev.filter(m => m.id !== typingId));
          },
        }
      );
    }, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, detectMustSpeak]);

  const sendMsg = useCallback((text: string, role: "me" | "other" = "me") => {
    if (!text.trim()) return;
    const msg: ChatMsg = {
      id: `msg-${Date.now()}`,
      role,
      text: text.trim(),
      time: getTime(),
      ...(role === "other" ? { senderName: OTHER_USER.name, avatarInitial: OTHER_USER.initial, avatarColor: OTHER_USER.color } : {}),
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  // Foxxz public speak mutation
  // foxxzPublicSpeakMutation: global callback does not handle message insertion
  // Message insertion logic is unified in mutate() inline onSuccess
  const foxxzPublicSpeakMutation = trpc.pixie.publicSpeak.useMutation();

  const triggerFoxxzAutoSuggest = useCallback((currentMsgs: ChatMsg[], patText: string) => {
    // Round check: skip if not Foxxz's turn
    if (roundSpeaker.current !== "foxxz") return;
    const mustSpeak = detectMustSpeak(currentMsgs, patText);
    if (!mustSpeak && Math.random() > 0.7) return;
    const delay = mustSpeak ? 1500 : (2000 + Math.random() * 1000);
    // Use unique id per trigger to avoid race overwrites
    const typingId = `foxxz-typing-${Date.now()}`;
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: typingId,
          role: "foxxz" as const,
          text: "",
          time: getTime(),
          isTyping: true,
        },
      ]);
      const context = currentMsgs.filter(m => m.role !== "lumi" && m.role !== "foxxz").slice(-8).map(m => ({
        senderName: m.role === "me" ? MY_USER.name : OTHER_USER.name,
        senderType: "human" as const,
        content: m.text,
      }));
      foxxzPublicSpeakMutation.mutate(
        {
          persona: "foxxz" as const,
          pixieName: "Foxxz",
          ownerName: OTHER_USER.name,
          otherName: MY_USER.name,
          chatContext: context,
          triggerMessage: patText,
          triggerBy: "owner",
        },
        {
          onSuccess: (data) => {
            setMessages(prev => prev.filter(m => m.id !== typingId));
            if (data.shouldSpeak && data.message && data.message.trim()) {
              if (data.visibility === "private_whisper") {
                setWhisperQueue(prev => [...prev, { id: `foxxz-w-${Date.now()}`, role: "lumi" as const, text: `🦊 Foxxz: ${data.message!}`, time: getTime() }]);
              } else {
                setMessages(prev => [...prev, { id: `foxxz-pub-${Date.now()}`, role: "foxxz" as const, text: data.message!, time: getTime(), isFoxxzSuggestion: false }]);
              }
            }
          },
          onError: () => {
            setMessages(prev => prev.filter(m => m.id !== typingId));
          },
        }
      );
    }, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectMustSpeak]);

  // Pat auto-reply
  const triggerPatReply = useCallback(() => {
    const typingDelay = 800 + Math.random() * 600;
    const replyDelay = typingDelay + 1200 + Math.random() * 800;
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: "pat-typing",
        role: "other" as const,
        text: "",
        time: getTime(),
        senderName: OTHER_USER.name,
        avatarInitial: OTHER_USER.initial,
        avatarColor: OTHER_USER.color,
        isTyping: true,
      }]);
    }, typingDelay);
    setTimeout(() => {
      const reply = ALICE_REPLIES[Math.floor(Math.random() * ALICE_REPLIES.length)]!;
      setMessages(prev => {
        const next = [
          ...prev.filter(m => m.id !== "pat-typing"),
          {
            id: `pat-${Date.now()}`,
            role: "other" as const,
            text: reply,
            time: getTime(),
            senderName: OTHER_USER.name,
            avatarInitial: OTHER_USER.initial,
            avatarColor: OTHER_USER.color,
          },
        ];
        // Foxxz auto-reads context after Pat replies
        triggerFoxxzAutoSuggest(next, reply);
        return next;
      });
    }, replyDelay);
  }, [triggerFoxxzAutoSuggest]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    sendMsg(text);
    setInputText("");
    inputRef.current?.focus();
    // Randomly decide which pixie speaks: 50% Lumi / 30% Foxxz / 20% neither
    const roll = Math.random();
    if (roll < 0.5) {
      roundSpeaker.current = "lumi";   // Lumi speaks this round
    } else if (roll < 0.8) {
      roundSpeaker.current = "foxxz";  // Foxxz speaks this round
    } else {
      roundSpeaker.current = "none";   // Both pixies stay silent
    }
    // If mustSpeak scene, force assign a pixie (cannot both be silent)
    setMessages(prev => {
      if (roundSpeaker.current === "none" && detectMustSpeak(prev, text)) {
        roundSpeaker.current = Math.random() < 0.5 ? "lumi" : "foxxz";
      }
      triggerLumiAutoSuggest(prev, text);
      return prev;
    });
    triggerPatReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleUseThis = (text: string) => {
    setInputText(text);
    setShowAskLumi(false);
    setShowWhisper(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0EEFF] via-[#F8F7FF] to-[#EEF0FF] flex flex-col items-center justify-center py-8 px-4">
      {/* Phone frame */}
      <div className="relative w-[375px] h-[780px] bg-[#F5F4FB] rounded-[44px] shadow-2xl overflow-hidden border-4 border-[#2D2D44]/10 flex flex-col">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 bg-[#F5F4FB] flex-shrink-0">
          <span className="text-xs font-semibold text-[#2D2D44]">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 items-end h-3">
              {[2, 3, 4, 5].map(h => <div key={h} style={{ height: h * 2.5 }} className="w-1 bg-[#2D2D44] rounded-sm" />)}
            </div>
            <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
              <path d="M8 2.5C10.2 2.5 12.2 3.4 13.6 4.9L15 3.5C13.2 1.7 10.7 0.5 8 0.5C5.3 0.5 2.8 1.7 1 3.5L2.4 4.9C3.8 3.4 5.8 2.5 8 2.5Z" fill="#2D2D44" />
              <path d="M8 5.5C9.4 5.5 10.7 6.1 11.6 7L13 5.6C11.7 4.3 10 3.5 8 3.5C6 3.5 4.3 4.3 3 5.6L4.4 7C5.3 6.1 6.6 5.5 8 5.5Z" fill="#2D2D44" />
              <circle cx="8" cy="10" r="1.5" fill="#2D2D44" />
            </svg>
            <svg className="w-6 h-3" viewBox="0 0 24 12" fill="none">
              <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="#2D2D44" strokeOpacity="0.35" />
              <rect x="2" y="2" width="16" height="8" rx="1.5" fill="#2D2D44" />
              <path d="M22 4v4a2 2 0 000-4z" fill="#2D2D44" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#EBEBF5] flex-shrink-0">
          <button className="text-[#5B4FD9]"><ArrowLeft className="w-5 h-5" /></button>
          <div className="relative">
            <Avatar initial={MY_USER.initial} color={MY_USER.color} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-[#2D2D44]">{MY_USER.name} & {OTHER_USER.name}</p>
            <p className="text-[11px] text-[#9B9BB4]">Getting to know each other</p>
          </div>
          <Avatar initial={OTHER_USER.initial} color={OTHER_USER.color} />
          <button className="text-[#9B9BB4]"><MoreHorizontal className="w-5 h-5" /></button>
        </div>

        {/* Pixie selector */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-[#EBEBF5] flex-shrink-0">
          <span className="text-[11px] text-[#9B9BB4] mr-1">Pixie:</span>
          {PERSONAS.map(p => (
            <PersonaPill key={p.id} persona={p} selected={persona === p.id} onClick={() => setPersona(p.id)} />
          ))}
          {/* Pixie avatar — click to open whisper */}
          <div className="ml-auto relative">
            <LumiAvatar persona={persona} size="sm" onClick={() => { setShowWhisper(true); setWhisperBadge(false); }} />
            {whisperBadge && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map(msg => <MsgBubble key={msg.id} msg={msg} persona={persona} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-[#EBEBF5] px-4 pb-5 pt-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F5F4FB] rounded-full px-4 py-2.5 flex items-center gap-2">
              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${MY_USER.name} & ${OTHER_USER.name}...`}
                className="flex-1 bg-transparent text-sm text-[#2D2D44] placeholder:text-[#9B9BB4] outline-none"
              />
            </div>
            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-[#5B4FD9] flex items-center justify-center text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4A3FC8] active:scale-95 transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
              </svg>
            </button>
            {/* Ask Pixie button */}
            <button
              onClick={() => setShowAskLumi(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-sm hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
              title="Ask Pixie"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ask Pixie bottom panel */}
        {showAskLumi && (
          <AskLumiSheet
            persona={persona}
            inputText={inputText}
            chatContext={messages}
            onClose={() => setShowAskLumi(false)}
            onUseThis={handleUseThis}
          />
        )}

        {/* Pixie Whisper panel */}
        {showWhisper && (
          <LumiWhisperSheet
            persona={persona}
            chatContext={messages}
            onClose={() => setShowWhisper(false)}
            onUseThis={handleUseThis}
            injectedMessages={whisperQueue}
          />
        )}
      </div>

      {/* Back link */}
      <div className="mt-6 flex items-center gap-4">
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-[#7B6FD8] hover:text-[#5B4FD9] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
