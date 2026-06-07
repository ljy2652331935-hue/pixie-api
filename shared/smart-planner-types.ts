/**
 * Smart Planner — Shared Types
 * Used by both server-side router and client-side UI.
 */

// ─── Person Profile ───────────────────────────────────────────────────────────

export const HOBBIES = [
  "Photography", "Cycling", "Cooking", "Drawing", "Gaming",
  "Hiking", "Yoga", "Reading", "Dancing", "Travelling",
] as const;

export const MUSIC_GENRES = [
  "Jazz", "Indie", "Electronic", "Classical", "Hip-hop",
  "R&B", "Pop", "Rock", "Soul", "Lo-fi",
] as const;

export const TOPIC_INTERESTS = [
  "Technology", "Art", "Film", "Food", "Travel",
  "Science", "Philosophy", "Fashion", "Sports", "Music",
] as const;

export const MBTI_TYPES = [
  "INFJ", "ENFP", "INTJ", "ENTP", "ISFJ",
  "ESFP", "INTP", "ENTJ", "ISFP", "ESTJ",
] as const;

export const ACTIVITIES = [
  "Coffee", "Food", "Walking", "Gaming", "Study",
  "Movies", "Concerts", "Art", "Events", "Shopping",
] as const;

export const VIBE_TYPES = [
  "Chill", "Fun", "Focused", "Deep", "Active",
  "Creative", "Adventurous", "Low-key",
] as const;

export const MOODS = [
  "Chill", "Social", "Excited", "Calm", "Bored", "Tired", "Lonely",
] as const;

export const ENERGY_LEVELS = [
  "Low", "Balanced", "Fun", "Focused", "Spontaneous",
] as const;

export const AVOID_OPTIONS = [
  "Loud places", "Crowds", "Serious topics",
  "Romantic settings", "Smokers", "Intense activities",
] as const;

export const MOMENT_OPTIONS = [
  "Walk", "Coffee", "Dinner", "Study", "Concert", "Chat",
] as const;

export interface PersonProfile {
  name: string;
  age?: number;
  bio?: string;
  gender?: string;
  hobbies: string[];
  music: string[];
  topicInterests: string[];
  mbti?: string;
  /** 0 = pure listener, 1 = pure speaker */
  listenerSpeaker: number;
  /** 0 = dominant, 1 = passive */
  dominantPassive: number;
  /** 0 = emotion-driven, 1 = action-driven */
  emotionAction: number;
  goal?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

// ─── Timeslot State ───────────────────────────────────────────────────────────

export interface TimeslotState {
  mood?: string;
  energy?: string;
  activities: string[];
  vibeType?: string;
  avoid: string[];
  moment?: string;
  /** 0 = prefer topics, 1 = prefer activities */
  topicType: number;
  /** 0 = calm, 1 = energetic */
  calmEnergetic: number;
  /** 0 = share freely, 1 = reserved */
  shareReserve: number;
}

// ─── Match Score ──────────────────────────────────────────────────────────────

export interface MatchBreakdown {
  vibe: number;       // 0–20
  interest: number;   // 0–25
  relevance: number;  // 0–15
  distance: number;   // 0–25
  cost: number;       // 0–15
  total: number;      // 0–100
}

// ─── Event Record ─────────────────────────────────────────────────────────────

export interface EventRec {
  title: string;
  address: string;
  date?: string;
  website?: string;
  isFree: boolean;
  estimatedCost?: string;
  distanceKm?: number;
  travelMin?: number;
  /** AI-generated personalised reason (1–2 sentences) */
  why: string;
  lat?: number;
  lng?: number;
  matchScore: MatchBreakdown;
}

// ─── Chat Topic ───────────────────────────────────────────────────────────────

export interface ChatTopicItem {
  title: string;
  context: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

// ─── Plan Result ──────────────────────────────────────────────────────────────

export interface PlanResult {
  id?: number;
  sharedVibe: string;
  vibeCategory: "emotional" | "action" | "mixed";
  searchQuery: string;
  top3: EventRec[];
  chatTopics: ChatTopicItem[];
  personA: { name: string; location?: string; lat?: number; lng?: number };
  personB: { name: string; location?: string; lat?: number; lng?: number };
  createdAt?: Date;
}
