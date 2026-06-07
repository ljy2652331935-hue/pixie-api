import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Sparkles, MessageCircle, Zap, BookOpen, ArrowRight, Star, Shield, Cpu, Users } from "lucide-react";

const PERSONAS = [
  { id: "lumi", name: "Lumi", label: "Warm Bestie", emoji: "✨", color: "from-violet-500 to-purple-600", desc: "Lucy's personal pixie — short, sharp, protective, and always keeping it real." },
  { id: "foxxz", name: "Foxxz", label: "Gentleman Fox", emoji: "🦊", color: "from-amber-500 to-orange-600", desc: "Pat's personal pixie — chill strategist energy, no emotion policing, just the next move." },
];

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Expression Suggestion",
    description: "Six intelligent modes — icebreaker, rewrite, boundary, plan, whisper, offline profile — to help you say exactly what you mean.",
    badge: "SUGGESTION",
    href: "/playground",
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: "Chat with Lumi",
    description: "Your personal social co-pilot. Ask anything, vent freely, get real advice without judgment.",
    badge: "CHAT",
    href: "/chat",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Auto Context Awareness",
    description: "Lumi reads the room, decides when to speak — encouraging you, bridging topics, or staying silent when you're doing great.",
    badge: "AUTO-CONTEXT",
    href: "/playground",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Pixie Live Chat",
    description: "Lumi and Foxxz join the conversation as public participants — speaking openly in the chat, not as private advisors.",
    badge: "LIVE-CHAT",
    href: "/live-chat",
  },
];

const MODES = [
  { id: "icebreaker", label: "Icebreaker", desc: "Start conversations naturally" },
  { id: "rewrite", label: "Rewrite", desc: "Say it better, keep your voice" },
  { id: "boundary", label: "Boundary", desc: "Firm but never cruel" },
  { id: "plan", label: "Plan", desc: "Turn chat into real plans" },
  { id: "whisper", label: "Whisper", desc: "Private advice, just for you" },
  { id: "offline_profile", label: "Offline Profile", desc: "Transparent presence card" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pixie-gradient flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-lg">Pixie API</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/playground" className="hover:text-foreground transition-colors">Playground</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/chat" className="hover:text-foreground transition-colors">Live Chat</Link>
            <Link href="/ask-lumi" className="hover:text-foreground transition-colors font-medium text-purple-400">Ask Lumi</Link>
          </div>
          <Link href="/playground">
            <Button size="sm" className="bg-pixie-gradient text-white border-0 shadow-pixie hover:opacity-90 transition-opacity">
              Try Lumi
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-pixie/8 blur-[80px]" />
        </div>

        <div className="container relative text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-medium border-primary/30 text-primary bg-primary/5">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Powered by Lumi · Your AI Social Co-Pilot
          </Badge>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-tight mb-6 max-w-4xl mx-auto">
            Express yourself{" "}
            <span className="text-gradient">better in every conversation</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Pixie is an AI social co-pilot that helps you express yourself with clarity, confidence, and care — without sounding like an AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/playground">
              <Button size="lg" className="bg-pixie-gradient text-white border-0 shadow-pixie hover:opacity-90 transition-opacity px-8 h-12 text-base">
                Open Playground
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base border-border/60 hover:bg-muted/50">
                <BookOpen className="w-4 h-4 mr-2" />
                Read Docs
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "2", label: "Pixie Personas" },
              { value: "6", label: "Suggestion Modes" },
              { value: "4", label: "Core APIs" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-display font-semibold text-gradient">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">Four Core APIs</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Each endpoint is a different dimension of social intelligence — all powered by the same Lumi persona system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <Link key={f.badge} href={f.href}>
                <div className="group relative p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-pixie transition-all duration-300 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors">
                      {f.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono bg-muted text-muted-foreground">
                      {f.badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  <div className="mt-4 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Try now <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Personas ─────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">Two Pixie Personas</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Each persona has its own voice, personality, and way of helping you. Choose the one that feels right.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PERSONAS.map((p) => (
              <div key={p.id} className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-all duration-200 cursor-default">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl shadow-sm`}>
                    {p.emoji}
                  </div>
                  <div>
                    <div className="font-semibold text-base">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.label}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                <div className="mt-3 text-xs font-mono text-muted-foreground/50">{p.id}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Modes ────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-xs border-primary/30 text-primary bg-primary/5">
                SUGGESTION API
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
                Six Modes, One Voice
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                From icebreakers to setting boundaries — every social moment has a matching mode. Lumi adapts to your needs, not the other way around.
              </p>
              <Link href="/playground">
                <Button className="bg-pixie-gradient text-white border-0 hover:opacity-90">
                  Test all modes
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors">
                  <div className="font-semibold text-sm mb-1">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                  <div className="mt-2 text-xs font-mono text-primary/60">{m.id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust ────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "Server-Side Sealed", desc: "All persona prompts and LLM calls are processed server-side. Zero prompt leakage." },
              { icon: <Cpu className="w-6 h-6" />, title: "tRPC End-to-End", desc: "Full type inference from server to client. No REST, no manual types." },
              { icon: <Star className="w-6 h-6" />, title: "Conversational Realism", desc: "Lumi sounds like a real friend — not a therapist, not a corporate AI." },
            ].map((t) => (
              <div key={t.title} className="p-6 rounded-2xl border border-border/60 bg-card">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                  {t.icon}
                </div>
                <h3 className="font-semibold mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="py-24 border-t border-border/50">
        <div className="container text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
            <div className="relative max-w-2xl mx-auto">
              <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-6">
                Ready to{" "}
                <span className="text-gradient">express yourself better?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Open the playground and test all of Lumi's capabilities in real time.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/playground">
                  <Button size="lg" className="bg-pixie-gradient text-white border-0 shadow-pixie hover:opacity-90 px-10 h-12 text-base">
                    Open Playground
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button size="lg" variant="outline" className="px-10 h-12 text-base border-border/60">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Lumi
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-pixie-gradient flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span>Pixie API — Your AI Social Co-Pilot</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/playground" className="hover:text-foreground transition-colors">Playground</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/chat" className="hover:text-foreground transition-colors">Live Chat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
