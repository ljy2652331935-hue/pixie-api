import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sparkles, MessageCircle, Eye, BookOpen, Play, MessagesSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen cosmic-bg">
      {/* Nebula decorations */}
      <div className="cosmic-nebula w-[600px] h-[600px] bg-[oklch(0.5_0.18_290)] top-[-200px] left-[-100px]" />
      <div className="cosmic-nebula w-[400px] h-[400px] bg-[oklch(0.6_0.14_192)] top-[30%] right-[-100px]" />
      <div className="cosmic-nebula w-[500px] h-[500px] bg-[oklch(0.45_0.15_300)] bottom-[-150px] left-[30%]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Pixie</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/demo">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <MessageCircle className="w-4 h-4 mr-2" />
              App Demo
            </Button>
          </Link>
          <Link href="/playground">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Play className="w-4 h-4 mr-2" />
              Playground
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <MessagesSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              API Docs
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          {/* Planet decoration with lens flare */}
          <div className="relative inline-block mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[oklch(0.78_0.14_192)] to-[oklch(0.55_0.2_290)] opacity-80 mx-auto shadow-[0_0_40px_oklch(0.78_0.14_192_/_30%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-transparent via-[oklch(0.78_0.14_192_/_50%)] to-transparent rounded-full rotate-[-20deg]" />
            {/* Lens flare */}
            <div className="absolute top-[20%] right-[-10px] w-3 h-3 rounded-full bg-[oklch(0.95_0.05_192_/_60%)] blur-[2px]" />
            <div className="absolute top-[-5px] left-[60%] w-2 h-2 rounded-full bg-[oklch(0.9_0.08_220_/_50%)] blur-[1px]" />
            <div className="absolute top-[40%] left-[-15px] w-24 h-[1px] bg-gradient-to-r from-transparent via-[oklch(0.9_0.1_192_/_40%)] to-transparent rotate-[30deg]" />
            <div className="absolute bottom-[10%] right-[-20px] w-16 h-[1px] bg-gradient-to-r from-transparent via-[oklch(0.85_0.08_290_/_30%)] to-transparent rotate-[-15deg]" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight cosmic-glow text-primary mb-6">
            Pixie API
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light mb-4">
            AI Social Co-Pilot · Your Pixie Companion
          </p>
          <p className="text-base text-muted-foreground/80 max-w-xl mx-auto mb-12 leading-relaxed">
            Helping you express yourself better in social situations. Not replacing human connection — making it more natural.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/playground">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_oklch(0.78_0.14_192_/_30%)] transition-all hover:shadow-[0_0_30px_oklch(0.78_0.14_192_/_50%)]">
                <Play className="w-5 h-5 mr-2" />
                Open Playground
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10">
                <BookOpen className="w-5 h-5 mr-2" />
                View API Docs
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl w-full">
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Suggestion API"
            description="Analyzes your messages and suggests more natural, socially-aware expressions"
            badge="P0"
          />
          <FeatureCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="Chat API"
            description="Chat privately with Lumi for social advice and emotional support"
            badge="P1"
          />
          <FeatureCard
            icon={<Eye className="w-6 h-6" />}
            title="Presence API"
            description="Reads chat context and speaks up at the right moment with reminders or tips"
            badge="P2"
          />
          <Link href="/chat" className="block">
            <FeatureCard
              icon={<MessagesSquare className="w-6 h-6" />}
              title="Live Chat"
              description="Real-time conversation with your Pixie for emotional support and social guidance"
              badge="NEW"
            />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-muted-foreground/60 text-sm">
        Lumi is not chatting for you. Lumi helps you show up better.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, badge }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="cosmic-card rounded-xl p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_oklch(0.78_0.14_192_/_10%)] group">
      <div className="flex items-center justify-between mb-4">
        <div className="text-primary group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {badge}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
