import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

type Bubble = {
  type: string;
  text: string;
  emotion: string;
  delayMs: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  bubbles?: Bubble[];
  quickReplies?: string[];
  suggestedAction?: string;
};

const PERSONA_OPTIONS = [
  { id: "sassy_roast_bestie", name: "Lumi", label: "Sassy Roast Bestie" },
  { id: "smooth_witty_fox", name: "Lumi", label: "Smooth Witty Fox" },
  { id: "elegant_gentleman", name: "Soren", label: "Elegant Gentleman" },
  { id: "loyal_bro", name: "Koda", label: "Loyal Bro" },
  { id: "soft_social_anxiety_helper", name: "Mimi", label: "Soft Social Anxiety Helper" },
  { id: "calm_strategist", name: "Orin", label: "Calm Strategist" },
];

const EMOTION_COLORS: Record<string, string> = {
  playful: "text-cyan-300",
  soft: "text-purple-300",
  serious: "text-amber-300",
  smug: "text-emerald-300",
  worried: "text-orange-300",
  excited: "text-pink-300",
};

export default function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState("sassy_roast_bestie");
  const [isTyping, setIsTyping] = useState(false);
  const [visibleBubbles, setVisibleBubbles] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPersona = PERSONA_OPTIONS.find((p) => p.id === persona);

  const liveChatMutation = trpc.pixie.liveChat.useMutation({
    onSuccess: (data) => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.bubbles.map((b: Bubble) => b.text).join("\n"),
        bubbles: data.bubbles,
        quickReplies: data.quickReplies,
        suggestedAction: data.suggestedAction,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);

      // Animate bubbles appearing one by one
      if (data.bubbles.length > 0) {
        setVisibleBubbles((prev) => ({ ...prev, [assistantMsg.id]: 0 }));
        let delay = 0;
        data.bubbles.forEach((bubble: Bubble, idx: number) => {
          delay += bubble.delayMs || (idx === 0 ? 300 : 800);
          setTimeout(() => {
            setVisibleBubbles((prev) => ({ ...prev, [assistantMsg.id]: idx + 1 }));
          }, delay);
        });
      }
    },
    onError: (err) => {
      setIsTyping(false);
      toast.error("Send failed: " + err.message);
    },
  });

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageText,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    // Send the full conversation history to the LLM
    liveChatMutation.mutate({
      persona: persona as "sassy_roast_bestie" | "smooth_witty_fox" | "elegant_gentleman" | "loyal_bro" | "soft_social_anxiety_helper" | "calm_strategist",
      messages: newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, visibleBubbles, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">
              {selectedPersona?.name || "Lumi"}
            </h1>
            <p className="text-white/50 text-xs">{selectedPersona?.label}</p>
          </div>
        </div>

        <div className="ml-auto">
          <Select value={persona} onValueChange={setPersona}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/20 text-white/80 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/20">
              {PERSONA_OPTIONS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-white/80 text-xs focus:bg-white/10 focus:text-white">
                  {p.name} · {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white/90 font-semibold text-lg">
                Hey, I'm {selectedPersona?.name || "Lumi"} ✨
              </h2>
              <p className="text-white/50 text-sm mt-1 max-w-sm">
                {selectedPersona?.label === "Sassy Roast Bestie"
                  ? "What's on your mind? Vent, spiral, or go off — I'm here for it."
                  : `I'm your ${selectedPersona?.label}. Chat anytime.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {["I'm so tired today", "I keep thinking about someone...", "I'm kinda bored", "I need a confidence boost"].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-white/60 text-xs hover:bg-white/10 hover:text-white/80 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white text-sm shadow-lg shadow-cyan-500/10">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[80%] space-y-2">
                {msg.bubbles?.map((bubble, idx) => {
                  const visible = (visibleBubbles[msg.id] ?? msg.bubbles!.length) > idx;
                  if (!visible) return null;
                  return (
                    <div
                      key={idx}
                      className="animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white/8 border border-white/10 backdrop-blur-sm">
                        <p className={`text-sm ${EMOTION_COLORS[bubble.emotion] || "text-white/85"}`}>
                          {bubble.text}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Quick Replies */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (visibleBubbles[msg.id] ?? msg.bubbles!.length) >= (msg.bubbles?.length || 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in duration-500">
                    {msg.quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(reply)}
                        className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs hover:bg-cyan-500/20 transition-all duration-200"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/8 border border-white/10">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 backdrop-blur-md bg-white/5 px-4 py-3">
        <div className="flex gap-2 items-center max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Say something to ${selectedPersona?.name || "Lumi"}...`}
            className="flex-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/50 rounded-full px-4"
            disabled={isTyping}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
