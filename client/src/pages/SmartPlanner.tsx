/**
 * Smart Planner — Two-person activity matching page
 *
 * Flow:
 *   1. Fill in Person A + Person B profiles (name, hobbies, interests, sliders)
 *   2. Set the Timeslot (mood, energy, activities, vibe)
 *   3. Generate → see top 3 London venues with match scores + 5 chat topics
 *   4. View history of past plans
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  MapPin, Sparkles, MessageCircle, Clock, Globe, Banknote,
  ChevronRight, History, Users, Zap, Heart, RefreshCw,
} from "lucide-react";
import {
  HOBBIES, ACTIVITIES, VIBE_TYPES, MOODS, ENERGY_LEVELS,
  TOPIC_INTERESTS, AVOID_OPTIONS,
} from "@shared/smart-planner-types";
import type { PersonProfile, TimeslotState, PlanResult, EventRec } from "@shared/smart-planner-types";

// ─── Default Profiles ─────────────────────────────────────────────────────────

function randomProfile(name: string): PersonProfile {
  const pick = <T,>(arr: readonly T[], n: number): T[] =>
    [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  return {
    name,
    hobbies: pick(HOBBIES, 3),
    music: [],
    topicInterests: pick(TOPIC_INTERESTS, 3),
    listenerSpeaker: Math.round(Math.random() * 10) / 10,
    dominantPassive: Math.round(Math.random() * 10) / 10,
    emotionAction: Math.round(Math.random() * 10) / 10,
  };
}

function defaultTimeslot(): TimeslotState {
  return {
    activities: [],
    avoid: [],
    topicType: 0.5,
    calmEnergetic: 0.5,
    shareReserve: 0.5,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChipGroup({
  options, selected, onChange, color = "default",
}: {
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
  color?: "default" | "personA" | "personB";
}) {
  const toggle = (v: string) =>
    selected.includes(v) ? onChange(selected.filter(x => x !== v)) : onChange([...selected, v]);

  const activeClass =
    color === "personA"
      ? "bg-[#6B2737] text-white border-[#6B2737]"
      : color === "personB"
      ? "bg-[#2D5A6B] text-white border-[#2D5A6B]"
      : "bg-foreground text-background border-foreground";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`px-3 py-1 rounded-full text-sm border transition-all duration-120 active:scale-[0.97] ${
            selected.includes(opt)
              ? activeClass
              : "bg-transparent border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SliderField({
  label, leftLabel, rightLabel, value, onChange,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">{Math.round(value * 10) / 10}</span>
      </div>
      <Slider
        min={0} max={1} step={0.1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function PersonCard({
  person, onChange, accentColor, label,
}: {
  person: PersonProfile;
  onChange: (p: PersonProfile) => void;
  accentColor: string;
  label: string;
}) {
  const chipColor = label === "Person A" ? "personA" : "personB";
  return (
    <Card className="border-2" style={{ borderColor: accentColor + "40" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: accentColor }}
          >
            {person.name?.[0]?.toUpperCase() || "?"}
          </div>
          <CardTitle className="text-base">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
          <Input
            value={person.name}
            onChange={e => onChange({ ...person, name: e.target.value })}
            placeholder="Enter name..."
            className="h-9"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Hobbies</Label>
          <ChipGroup
            options={HOBBIES}
            selected={person.hobbies}
            onChange={v => onChange({ ...person, hobbies: v })}
            color={chipColor}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Topic Interests</Label>
          <ChipGroup
            options={TOPIC_INTERESTS}
            selected={person.topicInterests}
            onChange={v => onChange({ ...person, topicInterests: v })}
            color={chipColor}
          />
        </div>

        <Separator />

        <SliderField
          label="Listener ↔ Speaker"
          leftLabel="Listener"
          rightLabel="Speaker"
          value={person.listenerSpeaker}
          onChange={v => onChange({ ...person, listenerSpeaker: v })}
        />
        <SliderField
          label="Emotion ↔ Action"
          leftLabel="Emotion-driven"
          rightLabel="Action-driven"
          value={person.emotionAction}
          onChange={v => onChange({ ...person, emotionAction: v })}
        />
        <SliderField
          label="Dominant ↔ Passive"
          leftLabel="Dominant"
          rightLabel="Passive"
          value={person.dominantPassive}
          onChange={v => onChange({ ...person, dominantPassive: v })}
        />
      </CardContent>
    </Card>
  );
}

// ─── Match Score Ring ─────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E8DFC8" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke="#6B2737" strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.23,1,0.32,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground">{score}</span>
        <span className="text-[9px] text-muted-foreground leading-none">match</span>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, rank }: { event: EventRec; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const { matchScore } = event;

  const scoreItems = [
    { label: "Vibe", value: matchScore.vibe, max: 20 },
    { label: "Interest", value: matchScore.interest, max: 25 },
    { label: "Relevance", value: matchScore.relevance, max: 15 },
    { label: "Distance", value: matchScore.distance, max: 25 },
    { label: "Cost", value: matchScore.cost, max: 15 },
  ];

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-3 items-start">
          {/* Rank badge */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6B2737] text-white text-xs font-bold flex items-center justify-center mt-0.5">
            {rank}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight mb-1">{event.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.address}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {event.isFree ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Free</Badge>
              ) : event.estimatedCost ? (
                <Badge variant="secondary" className="text-xs">{event.estimatedCost}</Badge>
              ) : null}
              {event.date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {event.date}
                </div>
              )}
              {event.distanceKm !== undefined && event.distanceKm > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {event.distanceKm} km
                </div>
              )}
            </div>

            {event.why && (
              <p className="text-xs text-muted-foreground italic leading-relaxed">{event.why}</p>
            )}

            {event.website && (
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#6B2737] hover:underline mt-1"
              >
                <Globe className="w-3 h-3" />
                More info
              </a>
            )}

            {/* Score breakdown toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              />
              Score breakdown
            </button>

            {expanded && (
              <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {scoreItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">{item.label}</span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6B2737] rounded-full transition-all duration-500"
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">
                      {item.value}/{item.max}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score ring */}
          <div className="flex-shrink-0">
            <ScoreRing score={matchScore.total} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Result View ──────────────────────────────────────────────────────────────

function ResultView({ result, onReset }: { result: PlanResult; onReset: () => void }) {
  const vibeCategoryColor: Record<string, string> = {
    emotional: "bg-pink-100 text-pink-700",
    action: "bg-orange-100 text-orange-700",
    mixed: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6B2737] text-white text-xs font-bold flex items-center justify-center">
            {result.personA.name[0]?.toUpperCase()}
          </div>
          <Heart className="w-4 h-4 text-muted-foreground" />
          <div className="w-8 h-8 rounded-full bg-[#2D5A6B] text-white text-xs font-bold flex items-center justify-center">
            {result.personB.name[0]?.toUpperCase()}
          </div>
        </div>
        <p className="text-sm text-muted-foreground italic">"{result.sharedVibe}"</p>
        <Badge className={`${vibeCategoryColor[result.vibeCategory]} border-0`}>
          {result.vibeCategory} vibe
        </Badge>
      </div>

      {/* Top 3 Events */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Top 3 Picks for You
        </h2>
        <div className="space-y-3">
          {result.top3.length > 0 ? (
            result.top3.map((event, i) => (
              <EventCard key={i} event={event} rank={i + 1} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events found. Try adjusting your interests or vibe.
            </p>
          )}
        </div>
      </div>

      {/* Chat Topics */}
      {result.chatTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Conversation Starters
          </h2>
          <div className="space-y-2">
            {result.chatTopics.map((topic, i) => (
              <Card key={i} className="border border-border/60">
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-0.5">{topic.title}</p>
                  <p className="text-xs text-muted-foreground">{topic.context}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onReset} className="flex-1 gap-2">
          <RefreshCw className="w-4 h-4" />
          New Plan
        </Button>
      </div>
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────

function HistoryView({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: plans, isLoading } = trpc.smartPlanner.list.useQuery({ limit: 20 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No past plans yet.</p>
        <p className="text-xs mt-1">Generate your first plan to see it here.</p>
      </div>
    );
  }

  const vibeCategoryColor: Record<string, string> = {
    emotional: "bg-pink-100 text-pink-700",
    action: "bg-orange-100 text-orange-700",
    mixed: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-2">
      {plans.map(plan => (
        <button
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          className="w-full text-left"
        >
          <Card className="hover:shadow-md transition-shadow duration-200 active:scale-[0.99]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    <div className="w-6 h-6 rounded-full bg-[#6B2737] text-white text-xs font-bold flex items-center justify-center ring-2 ring-background">
                      {plan.aName[0]?.toUpperCase()}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#2D5A6B] text-white text-xs font-bold flex items-center justify-center ring-2 ring-background">
                      {plan.bName[0]?.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{plan.aName} & {plan.bName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {plan.sharedVibe}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${vibeCategoryColor[plan.vibeCategory ?? "mixed"]} border-0 text-xs`}>
                    {plan.vibeCategory}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(plan.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartPlanner() {
  const [personA, setPersonA] = useState<PersonProfile>(() => randomProfile("Alex"));
  const [personB, setPersonB] = useState<PersonProfile>(() => randomProfile("Jordan"));
  const [timeslot, setTimeslot] = useState<TimeslotState>(defaultTimeslot);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [activeTab, setActiveTab] = useState("plan");
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  const generateMutation = trpc.smartPlanner.generate.useMutation({
    onSuccess: data => {
      setResult(data);
      setActiveTab("result");
    },
  });

  const { data: historyPlan } = trpc.smartPlanner.getById.useQuery(
    { id: selectedHistoryId! },
    { enabled: selectedHistoryId !== null }
  );

  const handleGenerate = () => {
    if (!personA.name.trim() || !personB.name.trim()) return;
    generateMutation.mutate({ personA, personB, timeslot });
  };

  const handleRandomise = () => {
    setPersonA(randomProfile(personA.name || "Alex"));
    setPersonB(randomProfile(personB.name || "Jordan"));
    setTimeslot({
      mood: MOODS[Math.floor(Math.random() * MOODS.length)],
      energy: ENERGY_LEVELS[Math.floor(Math.random() * ENERGY_LEVELS.length)],
      activities: [...ACTIVITIES].sort(() => Math.random() - 0.5).slice(0, 2),
      vibeType: VIBE_TYPES[Math.floor(Math.random() * VIBE_TYPES.length)],
      avoid: [],
      topicType: Math.round(Math.random() * 10) / 10,
      calmEnergetic: Math.round(Math.random() * 10) / 10,
      shareReserve: Math.round(Math.random() * 10) / 10,
    });
  };

  const displayedHistoryPlan = historyPlan ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6B2737]" />
            <h1 className="font-semibold text-base">Smart Planner</h1>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            AI-matched London activities for two
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="plan" className="flex-1 gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="result" className="flex-1 gap-1.5" disabled={!result}>
              <Sparkles className="w-3.5 h-3.5" />
              Result
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <History className="w-3.5 h-3.5" />
              History
            </TabsTrigger>
          </TabsList>

          {/* ── Plan Tab ── */}
          <TabsContent value="plan" className="space-y-6 mt-0">
            {/* Randomise button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleRandomise} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                Randomise profiles
              </Button>
            </div>

            {/* Person cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PersonCard
                person={personA}
                onChange={setPersonA}
                accentColor="#6B2737"
                label="Person A"
              />
              <PersonCard
                person={personB}
                onChange={setPersonB}
                accentColor="#2D5A6B"
                label="Person B"
              />
            </div>

            {/* Timeslot */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#D4A853]" />
                  Today's Vibe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Mood</Label>
                  <ChipGroup
                    options={MOODS}
                    selected={timeslot.mood ? [timeslot.mood] : []}
                    onChange={v => setTimeslot({ ...timeslot, mood: v[v.length - 1] })}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Energy</Label>
                  <ChipGroup
                    options={ENERGY_LEVELS}
                    selected={timeslot.energy ? [timeslot.energy] : []}
                    onChange={v => setTimeslot({ ...timeslot, energy: v[v.length - 1] })}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Activities</Label>
                  <ChipGroup
                    options={ACTIVITIES}
                    selected={timeslot.activities}
                    onChange={v => setTimeslot({ ...timeslot, activities: v })}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Vibe Type</Label>
                  <ChipGroup
                    options={VIBE_TYPES}
                    selected={timeslot.vibeType ? [timeslot.vibeType] : []}
                    onChange={v => setTimeslot({ ...timeslot, vibeType: v[v.length - 1] })}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Avoid</Label>
                  <ChipGroup
                    options={AVOID_OPTIONS}
                    selected={timeslot.avoid}
                    onChange={v => setTimeslot({ ...timeslot, avoid: v })}
                  />
                </div>

                <Separator />

                <SliderField
                  label="Topic ↔ Activity"
                  leftLabel="Deep topics"
                  rightLabel="Active doing"
                  value={timeslot.topicType}
                  onChange={v => setTimeslot({ ...timeslot, topicType: v })}
                />
                <SliderField
                  label="Calm ↔ Energetic"
                  leftLabel="Calm"
                  rightLabel="Energetic"
                  value={timeslot.calmEnergetic}
                  onChange={v => setTimeslot({ ...timeslot, calmEnergetic: v })}
                />
                <SliderField
                  label="Open ↔ Reserved"
                  leftLabel="Share freely"
                  rightLabel="Reserved"
                  value={timeslot.shareReserve}
                  onChange={v => setTimeslot({ ...timeslot, shareReserve: v })}
                />
              </CardContent>
            </Card>

            {/* Generate button */}
            <Button
              className="w-full h-12 text-base gap-2 bg-[#6B2737] hover:bg-[#5a2030] text-white"
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !personA.name.trim() || !personB.name.trim()}
            >
              {generateMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Finding the best spots…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Plan
                </>
              )}
            </Button>

            {generateMutation.isError && (
              <p className="text-sm text-red-500 text-center">
                Something went wrong. Please try again.
              </p>
            )}
          </TabsContent>

          {/* ── Result Tab ── */}
          <TabsContent value="result" className="mt-0">
            {result ? (
              <ResultView result={result} onReset={() => { setResult(null); setActiveTab("plan"); }} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Generate a plan to see results here.</p>
              </div>
            )}
          </TabsContent>

          {/* ── History Tab ── */}
          <TabsContent value="history" className="mt-0">
            {selectedHistoryId && displayedHistoryPlan ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedHistoryId(null)}
                  className="gap-1.5"
                >
                  ← Back to history
                </Button>
                <ResultView
                  result={displayedHistoryPlan}
                  onReset={() => setSelectedHistoryId(null)}
                />
              </div>
            ) : (
              <HistoryView onSelect={id => setSelectedHistoryId(id)} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
