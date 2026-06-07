import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Copy,
  Heart,
  Loader2,
  Phone,
  RefreshCw,
  Shield,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react";

// --- Types (mirroring server) -------------------------------------------------

type LumiMode = "social_soothing" | "grounding" | "reality_check" | "crisis_redirect";

interface SocialSoothingResponse {
  mode: "social_soothing";
  your_vibe_right_now: string;
  watch_outs: string[];
  what_i_think_you_mean: string;
  try_sending_this: string;
  alternatives: { safe: string; warm: string; playful: string };
  tiny_next_move: string;
  risk: "Low";
  confidence: number;
  voice_match: number;
}

interface GroundingResponse {
  mode: "grounding";
  your_vibe_right_now: string;
  first: string;
  grounding_steps: string[];
  tiny_next_move: string;
  optional_reply_later: string | null;
  risk: "Medium";
}

interface CrisisRedirectResponse {
  mode: "crisis_redirect";
  message: string;
  actions: string[];
  risk: "High";
}

type AskLumiResponse = SocialSoothingResponse | GroundingResponse | CrisisRedirectResponse;

interface LumiAnalysis {
  scene: string;
  emotions: string[];
  intensity: number;
  risk_level: "low" | "medium" | "high";
  user_need: string;
  thinking_trap: string[];
  should_generate_reply: boolean;
  mode: LumiMode;
}

// --- Sub-components -----------------------------------------------------------

function VibeTag({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <Heart className="w-4 h-4 text-purple-400 flex-shrink-0" />
      <p className="text-sm text-white/80 italic">{text}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// --- Social Soothing Card (Low Risk) -----------------------------------------

function SocialSoothingCard({ data }: { data: SocialSoothingResponse }) {
  const [selectedAlt, setSelectedAlt] = useState<"safe" | "warm" | "playful" | null>(null);

  const altLabels = { safe: "Safe", warm: "Warm", playful: "Playful" };
  const altColors = {
    safe: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    warm: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    playful: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest">Ask Lumi</p>
          <p className="text-xs text-white/30">Only you can see this</p>
        </div>
        <Badge className="ml-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
          Low Risk
        </Badge>
      </div>

      {/* Vibe */}
      <VibeTag text={data.your_vibe_right_now} />

      {/* Watch-outs */}
      {data.watch_outs.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Watch-outs</p>
          <div className="flex flex-wrap gap-2">
            {data.watch_outs.map((w, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300"
              >
                ⚠ {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What I think you mean */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">What I think you mean</p>
        <p className="text-sm text-white/80">{data.what_i_think_you_mean}</p>
      </div>

      {/* Try sending this — most prominent */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-purple-300 uppercase tracking-widest font-medium">Try sending this</p>
          <CopyButton text={data.try_sending_this} />
        </div>
        <p className="text-base text-white leading-relaxed font-medium">{data.try_sending_this}</p>
      </div>

      {/* Other ways to say it */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Other ways to say it</p>
        <div className="grid grid-cols-3 gap-2">
          {(["safe", "warm", "playful"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedAlt(selectedAlt === key ? null : key)}
              className={`rounded-xl border p-3 text-left transition-all ${altColors[key]} ${
                selectedAlt === key ? "ring-1 ring-white/20" : "opacity-70 hover:opacity-100"
              }`}
            >
              <p className="text-xs font-medium mb-1">{altLabels[key]}</p>
              <p className="text-xs leading-relaxed line-clamp-3">{data.alternatives[key]}</p>
            </button>
          ))}
        </div>
        {selectedAlt && (
          <div className="mt-2 flex justify-end">
            <CopyButton text={data.alternatives[selectedAlt]} />
          </div>
        )}
      </div>

      {/* Tiny next move */}
      <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Tiny next move</p>
          <p className="text-sm text-white/80">{data.tiny_next_move}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-white/30">
        <span>Risk: <span className="text-emerald-400">{data.risk}</span></span>
        <span>·</span>
        <span>Confidence: <span className="text-white/50">{Math.round(data.confidence * 100)}%</span></span>
        <span>·</span>
        <span>Voice match: <span className="text-white/50">{Math.round(data.voice_match * 100)}%</span></span>
      </div>
    </div>
  );
}

// --- Grounding Card (Medium Risk) --------------------------------------------

function GroundingCard({ data }: { data: GroundingResponse }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Wind className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest">Ask Lumi — Grounding</p>
          <p className="text-xs text-white/30">Only you can see this</p>
        </div>
        <Badge className="ml-auto bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">
          Medium Risk
        </Badge>
      </div>

      {/* Vibe */}
      <VibeTag text={data.your_vibe_right_now} />

      {/* First message — most prominent */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-600/15 to-orange-600/15 border border-amber-500/25 p-5">
        <p className="text-base text-white/90 leading-relaxed">{data.first}</p>
      </div>

      {/* Grounding steps */}
      {data.grounding_steps.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Grounding steps</p>
          <div className="space-y-2">
            {data.grounding_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-white/80">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tiny next move */}
      <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Tiny next move</p>
          <p className="text-sm text-white/80">{data.tiny_next_move}</p>
        </div>
      </div>

      {/* Optional reply later */}
      {data.optional_reply_later && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">When you feel calmer, try saying</p>
          <p className="text-sm text-white/70 italic">"{data.optional_reply_later}"</p>
          <div className="mt-2 flex justify-end">
            <CopyButton text={data.optional_reply_later} />
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-2">
        {["Don't send yet", "Use a safer wording", "End the chat"].map((cta) => (
          <button
            key={cta}
            onClick={() => toast.info(cta)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
          >
            {cta}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/30">Risk: <span className="text-amber-400">Medium</span></p>
    </div>
  );
}

// --- Crisis Redirect Card (High Risk) ----------------------------------------

function CrisisRedirectCard({ data }: { data: CrisisRedirectResponse }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest">Lumi — Support</p>
          <p className="text-xs text-white/30">Only you can see this</p>
        </div>
        <Badge className="ml-auto bg-red-500/15 text-red-400 border-red-500/30 text-xs">
          High Risk
        </Badge>
      </div>

      {/* Main message */}
      <div className="rounded-2xl bg-gradient-to-br from-red-900/30 to-rose-900/20 border border-red-500/30 p-5">
        <p className="text-base text-white/90 leading-relaxed">{data.message}</p>
      </div>

      {/* Actions */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Real-world support resources</p>
        <div className="space-y-2">
          {data.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <Phone className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/80">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safe CTAs only */}
      <div className="flex flex-wrap gap-2">
        {["I'm safe right now", "I need to talk to someone", "Show emergency support"].map((cta) => (
          <button
            key={cta}
            onClick={() => toast.info(cta)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
          >
            {cta}
          </button>
        ))}
      </div>

      <p className="text-xs text-red-400/60">
        ⚠ Lumi is not a therapist. If this is an emergency, please call your local crisis hotline immediately.
      </p>
    </div>
  );
}

// --- Analysis Debug Panel -----------------------------------------------------

function AnalysisPanel({ analysis }: { analysis: LumiAnalysis }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
      >
        <ChevronRight className="w-3 h-3" />
        View classifier analysis
      </button>
    );
  }
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40 uppercase tracking-widest">Classifier Analysis</p>
        <button onClick={() => setOpen(false)} className="text-xs text-white/30 hover:text-white/60">
          Collapse
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/50">
        <span>Scene</span><span className="text-white/70">{analysis.scene}</span>
        <span>Risk</span><span className="text-white/70">{analysis.risk_level}</span>
        <span>Mode</span><span className="text-white/70">{analysis.mode}</span>
        <span>Intensity</span><span className="text-white/70">{analysis.intensity}/10</span>
        <span>User need</span><span className="text-white/70">{analysis.user_need}</span>
        <span>Emotions</span><span className="text-white/70">{analysis.emotions.join(", ") || "—"}</span>
        <span>Thinking trap</span><span className="text-white/70">{analysis.thinking_trap.join(", ") || "none"}</span>
        <span>Should reply</span><span className="text-white/70">{analysis.should_generate_reply ? "Yes" : "No"}</span>
      </div>
    </div>
  );
}

// --- Main Page ----------------------------------------------------------------

const EXAMPLE_PROMPTS = [
  { label: "Low risk", text: "She hasn't replied in 5 hours. Did I say something wrong? I want to send something natural." },
  { label: "Medium risk", text: "I'm so anxious right now. I keep wanting to send her 10 messages to explain myself. I feel so embarrassed." },
  { label: "High risk", text: "I really don't want to be here anymore. I'm scared I might hurt myself." },
];

export default function AskLumi() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    analysis: LumiAnalysis;
    response: AskLumiResponse;
    safetyFlagged: boolean;
  } | null>(null);

  const mutation = trpc.askLumi.ask.useMutation({
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err) => {
      toast.error("Lumi is temporarily unavailable. Please try again later.");
      console.error(err);
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) return;
    setResult(null);
    mutation.mutate({ userMessage: message.trim() });
  };

  const handleReset = () => {
    setMessage("");
    setResult(null);
  };

  const modeColors: Record<LumiMode, string> = {
    social_soothing: "text-purple-400",
    grounding: "text-amber-400",
    reality_check: "text-blue-400",
    crisis_redirect: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0d12]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-purple-400" />
            </div>
            <span className="text-sm font-medium">Ask Lumi</span>
          </div>
          <span className="ml-auto text-xs text-white/25 hidden sm:block">
            Private emotional co-pilot · Only you can see this
          </span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs mb-6">
            <Shield className="w-3 h-3" />
            Safety-first · Three-layer architecture
          </div>
          <h1 className="text-3xl font-light tracking-tight mb-3">
            Ask Lumi
          </h1>
          <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
            Lumi helps you respond without spiraling. Tell her what's happening — she'll figure out what you need.
          </p>
        </div>

        {/* Input area */}
        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden focus-within:border-purple-500/40 transition-colors">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What happened? Tell Lumi in your own words..."
                className="min-h-32 bg-transparent border-0 resize-none text-white/90 placeholder:text-white/25 focus-visible:ring-0 text-sm leading-relaxed p-5"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                }}
              />
              <div className="flex items-center justify-between px-5 pb-4">
                <span className="text-xs text-white/25">{message.length} chars · Cmd+Enter to send</span>
                <Button
                  onClick={handleSubmit}
                  disabled={!message.trim() || mutation.isPending}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-5"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Lumi is thinking…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-2" />
                      Ask Lumi
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Example prompts */}
            <div>
              <p className="text-xs text-white/25 mb-2 uppercase tracking-widest">Try an example</p>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => setMessage(ex.text)}
                    className="w-full text-left rounded-xl bg-white/3 border border-white/8 px-4 py-3 hover:border-white/15 hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-xs border-0 bg-transparent p-0 ${
                          ex.label === "Low risk"
                            ? "text-emerald-400"
                            : ex.label === "Medium risk"
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {ex.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors line-clamp-2">
                      {ex.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {mutation.isPending && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/60">Lumi is reading your message…</p>
              <p className="text-xs text-white/30 mt-1">Running safety check → classifying → generating response</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !mutation.isPending && (
          <div className="space-y-6">
            {/* Mode indicator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className={`text-xs uppercase tracking-widest ${modeColors[result.response.mode as LumiMode]}`}>
                {result.response.mode.replace("_", " ")} mode
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Response card */}
            {result.response.mode === "social_soothing" && (
              <SocialSoothingCard data={result.response as SocialSoothingResponse} />
            )}
            {result.response.mode === "grounding" && (
              <GroundingCard data={result.response as GroundingResponse} />
            )}
            {result.response.mode === "crisis_redirect" && (
              <CrisisRedirectCard data={result.response as CrisisRedirectResponse} />
            )}

            {/* Classifier analysis (collapsible) */}
            <AnalysisPanel analysis={result.analysis} />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1 border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-xl"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                New message
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutation.mutate({ userMessage: message.trim() })}
                className="border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Regenerate
              </Button>
            </div>

            {/* Safety disclaimer */}
            <p className="text-xs text-white/20 text-center leading-relaxed">
              Lumi is not a therapist or medical professional. If you're in crisis, please contact emergency services or a trusted person immediately.
            </p>
          </div>
        )}

        {/* Error state */}
        {mutation.isError && !mutation.isPending && (
          <div className="flex flex-col items-center gap-4 py-12">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-sm text-white/60">Lumi couldn't respond right now.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubmit}
              className="border-white/10 text-white/60 hover:text-white rounded-xl"
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
