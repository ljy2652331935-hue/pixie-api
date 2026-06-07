/**
 * Smart Planner — Deterministic Scoring Algorithm
 *
 * Scores each candidate event against two PersonProfiles + TimeslotState.
 * No AI involved — all calculations are pure math.
 *
 * Score breakdown (max 100):
 *   Vibe       0–20  emotionAction slider delta + vibeType keyword match
 *   Interest   0–25  shared hobbies/activities overlap (5 pts each, +5 bonus)
 *   Relevance  0–15  keyword hits in event title/address (4 pts/hit, ≥3 chars)
 *   Distance   0–25  linear decay from midpoint (0 km = 25, ≥10 km = 0)
 *   Cost       0–15  free=15, <£5=10, £5-15=7, £20+=4
 */

import type { EventRec, MatchBreakdown, PersonProfile, TimeslotState } from "@shared/smart-planner-types";

// ─── Vibe Score (0–20) ────────────────────────────────────────────────────────

const VIBE_ENERGY_MAP: Record<string, number> = {
  Chill: 0.1, "Low-key": 0.15, Focused: 0.3, Deep: 0.35,
  Fun: 0.6, Active: 0.7, Creative: 0.5, Adventurous: 0.85,
};

function calcVibeScore(
  personA: PersonProfile,
  personB: PersonProfile,
  timeslot: TimeslotState
): number {
  // Slider harmony: reward when both are similarly emotion- or action-driven
  const sliderDelta = Math.abs(personA.emotionAction - personB.emotionAction);
  const sliderScore = Math.round((1 - sliderDelta) * 12); // 0–12

  // VibeType match: if the event vibe aligns with timeslot calmEnergetic
  let vibeBonus = 0;
  if (timeslot.vibeType) {
    const vibeEnergy = VIBE_ENERGY_MAP[timeslot.vibeType] ?? 0.5;
    const delta = Math.abs(vibeEnergy - timeslot.calmEnergetic);
    vibeBonus = Math.round((1 - delta) * 8); // 0–8
  }

  return Math.min(20, sliderScore + vibeBonus);
}

// ─── Interest Score (0–25) ────────────────────────────────────────────────────

function calcInterestScore(
  personA: PersonProfile,
  personB: PersonProfile,
  timeslot: TimeslotState,
  eventTitle: string
): number {
  const titleLower = eventTitle.toLowerCase();

  // Shared hobbies between A and B
  const sharedHobbies = personA.hobbies.filter(h =>
    personB.hobbies.map(x => x.toLowerCase()).includes(h.toLowerCase())
  );

  // Activities from timeslot that appear in event title
  const matchedActivities = timeslot.activities.filter(a =>
    titleLower.includes(a.toLowerCase())
  );

  // Topic interests overlap
  const sharedTopics = personA.topicInterests.filter(t =>
    personB.topicInterests.map(x => x.toLowerCase()).includes(t.toLowerCase())
  );

  const hits = sharedHobbies.length + matchedActivities.length + sharedTopics.length;
  const base = Math.min(20, hits * 5);
  const bonus = hits >= 2 ? 5 : 0;

  return Math.min(25, base + bonus);
}

// ─── Relevance Score (0–15) ───────────────────────────────────────────────────

function calcRelevanceScore(
  personA: PersonProfile,
  personB: PersonProfile,
  timeslot: TimeslotState,
  eventTitle: string,
  eventAddress: string
): number {
  const haystack = `${eventTitle} ${eventAddress}`.toLowerCase();

  const keywords = [
    ...personA.hobbies,
    ...personB.hobbies,
    ...timeslot.activities,
    ...personA.topicInterests,
    ...personB.topicInterests,
    ...(timeslot.vibeType ? [timeslot.vibeType] : []),
    ...(timeslot.mood ? [timeslot.mood] : []),
  ].filter(k => k.length >= 3);

  const uniqueKeywords = Array.from(new Set(keywords.map(k => k.toLowerCase())));
  const hits = uniqueKeywords.filter(k => haystack.includes(k)).length;

  return Math.min(15, hits * 4);
}

// ─── Distance Score (0–25) ────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Default: central London
const DEFAULT_LAT = 51.5074;
const DEFAULT_LNG = -0.1278;

function calcDistanceScore(
  personA: PersonProfile,
  personB: PersonProfile,
  eventLat?: number,
  eventLng?: number
): { score: number; distanceKm: number } {
  if (eventLat === undefined || eventLng === undefined) {
    return { score: 0, distanceKm: 0 };
  }

  const aLat = personA.lat ?? DEFAULT_LAT;
  const aLng = personA.lng ?? DEFAULT_LNG;
  const bLat = personB.lat ?? DEFAULT_LAT;
  const bLng = personB.lng ?? DEFAULT_LNG;

  // Midpoint between the two people
  const midLat = (aLat + bLat) / 2;
  const midLng = (aLng + bLng) / 2;

  const distKm = haversineKm(midLat, midLng, eventLat, eventLng);
  // Linear decay: 0 km = 25 pts, 10+ km = 0 pts
  const score = Math.max(0, Math.round(25 - distKm * 2.5));

  return { score, distanceKm: Math.round(distKm * 10) / 10 };
}

// ─── Cost Score (0–15) ────────────────────────────────────────────────────────

function calcCostScore(isFree: boolean, estimatedCost?: string): number {
  if (isFree) return 15;
  if (!estimatedCost) return 7; // unknown — assume mid-range

  const match = estimatedCost.match(/[\d.]+/);
  if (!match) return 7;

  const amount = parseFloat(match[0]);
  if (amount < 5) return 10;
  if (amount <= 15) return 7;
  return 4;
}

// ─── Main Scorer ──────────────────────────────────────────────────────────────

export interface CandidateEvent {
  title: string;
  address: string;
  date?: string;
  website?: string;
  isFree: boolean;
  estimatedCost?: string;
  why: string;
  lat?: number;
  lng?: number;
}

export function scoreEvent(
  candidate: CandidateEvent,
  personA: PersonProfile,
  personB: PersonProfile,
  timeslot: TimeslotState
): EventRec {
  const vibe = calcVibeScore(personA, personB, timeslot);
  const interest = calcInterestScore(personA, personB, timeslot, candidate.title);
  const relevance = calcRelevanceScore(personA, personB, timeslot, candidate.title, candidate.address);
  const { score: distance, distanceKm } = calcDistanceScore(
    personA, personB, candidate.lat, candidate.lng
  );
  const cost = calcCostScore(candidate.isFree, candidate.estimatedCost);
  const total = vibe + interest + relevance + distance + cost;

  const matchScore: MatchBreakdown = { vibe, interest, relevance, distance, cost, total };

  return {
    title: candidate.title,
    address: candidate.address,
    date: candidate.date,
    website: candidate.website,
    isFree: candidate.isFree,
    estimatedCost: candidate.estimatedCost,
    distanceKm,
    why: candidate.why,
    lat: candidate.lat,
    lng: candidate.lng,
    matchScore,
  };
}

/**
 * Score and rank a list of candidate events, returning the top N.
 */
export function rankEvents(
  candidates: CandidateEvent[],
  personA: PersonProfile,
  personB: PersonProfile,
  timeslot: TimeslotState,
  topN = 3
): EventRec[] {
  return candidates
    .map(c => scoreEvent(c, personA, personB, timeslot))
    .sort((a, b) => b.matchScore.total - a.matchScore.total)
    .slice(0, topN);
}

// ─── Vibe Category Classifier ─────────────────────────────────────────────────

export function classifyVibeCategory(
  personA: PersonProfile,
  personB: PersonProfile,
  timeslot: TimeslotState
): "emotional" | "action" | "mixed" {
  const avgEmotion = (personA.emotionAction + personB.emotionAction) / 2;
  const energy = timeslot.calmEnergetic;

  if (avgEmotion < 0.35 && energy < 0.4) return "emotional";
  if (avgEmotion > 0.65 && energy > 0.6) return "action";
  return "mixed";
}

// ─── Search Query Builder ─────────────────────────────────────────────────────

export function buildSearchQuery(
  personA: PersonProfile,
  personB: PersonProfile,
  timeslot: TimeslotState
): string {
  const sharedHobbies = personA.hobbies.filter(h =>
    personB.hobbies.map(x => x.toLowerCase()).includes(h.toLowerCase())
  );

  const keywords = [
    ...(timeslot.vibeType ? [timeslot.vibeType] : []),
    ...(timeslot.mood ? [timeslot.mood] : []),
    ...timeslot.activities.slice(0, 2),
    ...sharedHobbies.slice(0, 2),
  ].filter(Boolean);

  const base = keywords.length > 0 ? keywords.join(" ") : "things to do";
  return `${base} London ${new Date().getFullYear()}`;
}
