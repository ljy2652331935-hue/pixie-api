import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, Lock, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────

type MessageEntity = "jiayi" | "alice" | "lumi_public" | "lumi_private" | "alice_pixie";

interface ChatMessage {
  id: string;
  entity: MessageEntity;
  text: string;
  timestamp: number;
}

interface LumiBubble {
  type: string;
  text: string;
  emotion: string;
  delayMs: number;
}

// ─── Constants ──────────────────────────────────────────────────

const ALICE_AUTO_REPLIES = [
  "Haha yeah for sure!",
  "Hmm let me think about it",
  "That sounds fun actually",
  "I'm down! When?",
  "Lol you're funny",
  "Sure, why not",
  "Oh interesting, tell me more",
  "Yeah I was thinking the same thing",
  "Sounds good to me!",
  "Haha okay okay",
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Main Component ─────────────────────────────────────────────

export default function AppDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "init-1", entity: "alice", text: "Hey! What are you up to tonight?", timestamp: Date.now() - 60000 },
  ]);
  const [inputText, setInputText] = useState("");
  const [showLumiPanel, setShowLumiPanel] = useState(false);
  const [lumiPrivateInput, setLumiPrivateInput] = useState("");
  const [lumiWhispers, setLumiWhispers] = useState<LumiBubble[]>([]);
  const [panelWhispers, setPanelWhispers] = useState<LumiBubble[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedMessage, setSuggestedMessage] = useState<string | null>(null);
  const [presenceMessage, setPresenceMessage] = useState<{ text: string; type: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestMutation = trpc.pixie.suggest.useMutation();
  const chatMutation = trpc.pixie.chat.useMutation();
  const autoContextMutation = trpc.pixie.autoContext.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lumiWhispers, presenceMessage]);

  // Build chat context from messages
  const buildChatContext = useCallback(() => {
    return messages.slice(-10).map((m) => ({
      senderName: m.entity === "jiayi" ? "JiaYi" : m.entity === "alice" ? "Alice" : "Lumi",
      senderType: "human" as const,
      content: m.text,
    }));
  }, [messages]);

  // ─── Presence API: auto-trigger after new messages ────────────
  const triggerPresence = useCallback(async (currentMessages: ChatMessage[]) => {
    const context = currentMessages.slice(-10).map((m) => ({
      senderName: m.entity === "jiayi" ? "JiaYi" : m.entity === "alice" ? "Alice" : "Lumi",
      senderType: "human" as const,
      content: m.text,
    }));

    try {
      const result = await autoContextMutation.mutateAsync({
        roomId: "demo-room",
        userId: "jiaYi",
        pixieId: "lumi",
        persona: "lumi",
        chatContext: context,
      });

      if (result.shouldSpeak && result.message) {
        setPresenceMessage({ text: result.message, type: result.interventionType });
        // Auto-dismiss after 8s
        setTimeout(() => setPresenceMessage(null), 8000);
      }
    } catch (e) {
      // Presence failures are non-critical, don't interrupt user
      console.debug("Presence check failed:", e);
    }
  }, [autoContextMutation]);

  // ─── Send message to Alice ────────────────────────────────────
  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: generateId(),
      entity: "jiayi",
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText("");
    setSuggestedMessage(null);

    // Alice auto-reply after 1-3s
    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      const reply: ChatMessage = {
        id: generateId(),
        entity: "alice",
        text: ALICE_AUTO_REPLIES[Math.floor(Math.random() * ALICE_AUTO_REPLIES.length)],
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const newMsgs = [...prev, reply];
        // Trigger presence after Alice replies
        if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = setTimeout(() => triggerPresence(newMsgs), 1500);
        return newMsgs;
      });
    }, delay);

    // Trigger presence after user sends
    if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
    presenceTimeoutRef.current = setTimeout(() => triggerPresence(updatedMessages), 2000);
  };

  // ─── Ask Lumi (Suggestion API) ───────────────────────────────
  const handleAskLumi = async () => {
    if (!inputText.trim()) return;
    setSuggestionLoading(true);
    setSuggestedMessage(null);

    try {
      const result = await suggestMutation.mutateAsync({
        roomId: "demo-room",
        userId: "jiaYi",
        pixieId: "lumi",
        persona: "lumi",
        rawMessage: inputText.trim(),
        targetUser: { name: "Alice", relationshipStage: "casual_chat" },
        chatContext: buildChatContext(),
      });

      // Show Lumi's private bubbles in main chat only (not panel)
      if (result.privateBubbles && result.privateBubbles.length > 0) {
        setLumiWhispers(result.privateBubbles);
        setTimeout(() => setLumiWhispers([]), 8000);
      }

      // Show suggested public message
      if (result.suggestedPublicMessage) {
        setSuggestedMessage(result.suggestedPublicMessage);
      }
    } catch (e) {
      toast.error("Lumi couldn't process that. Try again!");
    } finally {
      setSuggestionLoading(false);
    }
  };

  // ─── Private Chat with Lumi (Chat API) ───────────────────────
  const handleLumiChat = async (questionOverride?: string) => {
    const question = (questionOverride || lumiPrivateInput).trim();
    if (!question) return;
    setChatLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        roomId: "demo-room",
        userId: "jiaYi",
        pixieId: "lumi",
        persona: "lumi",
        privateQuestion: question,
        chatContext: buildChatContext(),
      });

      // Show Lumi's response in panel only (not main chat)
      if (result.bubbles && result.bubbles.length > 0) {
        setPanelWhispers(result.bubbles);
      }

      // If Lumi suggests a public message
      if (result.suggestedPublicMessage) {
        setSuggestedMessage(result.suggestedPublicMessage);
      }

      setLumiPrivateInput("");
    } catch (e) {
      toast.error("Lumi is having trouble responding. Try again!");
    } finally {
      setChatLoading(false);
    }
  };

  // ─── Use suggested message ────────────────────────────────────
  const useSuggestion = () => {
    if (suggestedMessage) {
      setInputText(suggestedMessage);
      setSuggestedMessage(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[oklch(0.13_0.02_270)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-[oklch(0.15_0.02_270)]">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">A</div>
            <div>
              <p className="text-sm font-semibold text-foreground">Alice</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Lumi avatar - clickable for private chat */}
          <button
            onClick={() => setShowLumiPanel(!showLumiPanel)}
            className="relative w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform ring-2 ring-primary/30"
            title="Chat privately with Lumi"
          >
            ✨
            {showLumiPanel && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[oklch(0.15_0.02_270)]" />
            )}
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Lumi Presence Pop-up */}
            {presenceMessage && (
              <div className="flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] shrink-0 mt-1">✨</div>
                <div className="max-w-[75%] px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary">
                  <span className="text-[10px] text-primary/50 block mb-0.5">Lumi jumps in</span>
                  {presenceMessage.text}
                </div>
              </div>
            )}

            {/* Lumi Whispers (private, only user sees) */}
            {lumiWhispers.length > 0 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                {lumiWhispers.map((bubble, i) => (
                  <div key={i} className="flex items-start gap-2 ml-8">
                    <Lock className="w-3 h-3 text-primary/50 mt-1.5 shrink-0" />
                    <div className="max-w-[70%] px-3 py-2 rounded-xl bg-primary/5 border border-primary/15 border-dashed text-sm text-primary/80 italic">
                      <span className="text-[10px] text-primary/40 block mb-0.5">Lumi whispers to you</span>
                      {bubble.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Message Banner */}
          {suggestedMessage && (
            <div className="px-4 py-2 bg-primary/5 border-t border-primary/20 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-foreground flex-1 truncate">{suggestedMessage}</p>
              <Button size="sm" variant="default" className="text-xs shrink-0" onClick={useSuggestion}>
                Use this
              </Button>
              <button onClick={() => setSuggestedMessage(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-border/30 bg-[oklch(0.15_0.02_270)]">
            <div className="flex items-center gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message to Alice..."
                className="flex-1 bg-secondary/30 border-border/30"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAskLumi}
                disabled={!inputText.trim() || suggestionLoading}
                className="shrink-0 text-primary border-primary/30 hover:bg-primary/10"
                title="Ask Lumi for suggestion"
              >
                {suggestionLoading ? (
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
              <Button size="sm" onClick={handleSend} disabled={!inputText.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 ml-1">
              ✨ = Ask Lumi to improve your message before sending
            </p>
          </div>
        </div>

        {/* Lumi Private Chat Panel (Side Drawer) */}
        {showLumiPanel && (
          <div className="w-80 border-l border-border/30 bg-[oklch(0.12_0.03_270)] flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-semibold text-foreground">Private Chat with Lumi</span>
              </div>
              <button onClick={() => setShowLumiPanel(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="px-4 py-2 text-xs text-muted-foreground border-b border-border/20">
              Only you can see this. Ask Lumi anything about the conversation.
            </p>

            {/* Quick questions */}
            <div className="px-4 py-3 space-y-2 border-b border-border/20">
              <p className="text-xs text-muted-foreground font-medium">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "How should I reply?",
                  "Am I being too eager?",
                  "What does she mean?",
                  "Help me ask her out naturally",
                  "I'm feeling nervous",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setLumiPrivateInput(q); handleLumiChat(q); }}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Lumi responses */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {panelWhispers.length > 0 ? (
                panelWhispers.map((bubble, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] shrink-0 mt-0.5">✨</div>
                    <div className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm text-foreground">
                      {bubble.text}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary/30" />
                  <p>Ask Lumi anything about your conversation with Alice.</p>
                </div>
              )}
            </div>

            {/* Private input */}
            <form className="px-4 py-3 border-t border-border/30" onSubmit={(e) => { e.preventDefault(); handleLumiChat(); }}>
              <div className="flex items-center gap-2">
                <Input
                  value={lumiPrivateInput}
                  onChange={(e) => setLumiPrivateInput(e.target.value)}
                  placeholder="Ask Lumi privately..."
                  className="flex-1 bg-secondary/30 border-border/30 text-sm"
                />
                <Button type="submit" size="sm" disabled={!lumiPrivateInput.trim() || chatLoading}>
                  {chatLoading ? (
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Message Bubble Component ───────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isOwn = message.entity === "jiayi";
  const isLumi = message.entity === "lumi_public" || message.entity === "lumi_private";

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {/* Avatar (left side) */}
      {!isOwn && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
          message.entity === "alice"
            ? "bg-gradient-to-br from-pink-400 to-purple-500"
            : "bg-gradient-to-br from-cyan-400 to-blue-500"
        }`}>
          {message.entity === "alice" ? "A" : "✨"}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : isLumi
            ? "bg-primary/10 border border-primary/20 text-primary rounded-bl-md"
            : "bg-secondary/50 text-foreground rounded-bl-md"
        }`}
      >
        {message.text}
      </div>

      {/* Avatar (right side) */}
      {isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          J
        </div>
      )}
    </div>
  );
}
