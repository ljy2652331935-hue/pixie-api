import { describe, it, expect } from "vitest";
import {
  scoreEvent,
  rankEvents,
  classifyVibeCategory,
  buildSearchQuery,
  type CandidateEvent,
} from "./smart-planner-scoring";
import type { PersonProfile, TimeslotState } from "@shared/smart-planner-types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const personA: PersonProfile = {
  name: "Alex",
  hobbies: ["Art", "Music", "Photography"],
  music: [],
  topicInterests: ["Travel", "Culture"],
  listenerSpeaker: 0.3,
  dominantPassive: 0.4,
  emotionAction: 0.3,
  lat: 51.5074,
  lng: -0.1278,
};

const personB: PersonProfile = {
  name: "Jordan",
  hobbies: ["Music", "Food", "Photography"],
  music: [],
  topicInterests: ["Culture", "History"],
  listenerSpeaker: 0.6,
  dominantPassive: 0.5,
  emotionAction: 0.4,
  lat: 51.5100,
  lng: -0.1200,
};

const timeslot: TimeslotState = {
  mood: "Curious",
  energy: "Medium",
  activities: ["Museum visit", "Food tour"],
  vibeType: "Chill",
  avoid: [],
  topicType: 0.4,
  calmEnergetic: 0.3,
  shareReserve: 0.5,
};

const candidate: CandidateEvent = {
  title: "Tate Modern — Free Gallery Visit",
  address: "Bankside, London SE1 9TG",
  isFree: true,
  why: "",
  lat: 51.5076,
  lng: -0.0994,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("scoreEvent", () => {
  it("returns an EventRec with matchScore fields summing to total", () => {
    const result = scoreEvent(candidate, personA, personB, timeslot);
    const { vibe, interest, relevance, distance, cost, total } = result.matchScore;
    expect(total).toBe(vibe + interest + relevance + distance + cost);
  });

  it("total score is between 0 and 100", () => {
    const result = scoreEvent(candidate, personA, personB, timeslot);
    expect(result.matchScore.total).toBeGreaterThanOrEqual(0);
    expect(result.matchScore.total).toBeLessThanOrEqual(100);
  });

  it("free events get max cost score (15)", () => {
    const result = scoreEvent({ ...candidate, isFree: true }, personA, personB, timeslot);
    expect(result.matchScore.cost).toBe(15);
  });

  it("expensive events get low cost score (4)", () => {
    const pricey: CandidateEvent = { ...candidate, isFree: false, estimatedCost: "£30" };
    const result = scoreEvent(pricey, personA, personB, timeslot);
    expect(result.matchScore.cost).toBe(4);
  });

  it("events with no lat/lng get distance score of 0", () => {
    const noGeo: CandidateEvent = { ...candidate, lat: undefined, lng: undefined };
    const result = scoreEvent(noGeo, personA, personB, timeslot);
    expect(result.matchScore.distance).toBe(0);
  });

  it("nearby events get higher distance score than far ones", () => {
    const nearby: CandidateEvent = { ...candidate, lat: 51.508, lng: -0.128 }; // ~0.5 km
    const farAway: CandidateEvent = { ...candidate, lat: 51.600, lng: -0.300 }; // ~20 km
    const nearResult = scoreEvent(nearby, personA, personB, timeslot);
    const farResult = scoreEvent(farAway, personA, personB, timeslot);
    expect(nearResult.matchScore.distance).toBeGreaterThan(farResult.matchScore.distance);
  });

  it("shared hobbies increase interest score", () => {
    const noHobbies: PersonProfile = { ...personA, hobbies: [], topicInterests: [] };
    const withHobbies: PersonProfile = { ...personA, hobbies: ["Music", "Photography"] };
    const resultLow = scoreEvent(candidate, noHobbies, personB, timeslot);
    const resultHigh = scoreEvent(candidate, withHobbies, personB, timeslot);
    expect(resultHigh.matchScore.interest).toBeGreaterThanOrEqual(resultLow.matchScore.interest);
  });
});

describe("rankEvents", () => {
  const candidates: CandidateEvent[] = [
    { title: "Free Art Gallery", address: "London", isFree: true, why: "", lat: 51.508, lng: -0.128 },
    { title: "Expensive Nightclub", address: "London", isFree: false, estimatedCost: "£40", why: "", lat: 51.600, lng: -0.300 },
    { title: "Music Festival", address: "London", isFree: false, estimatedCost: "£10", why: "", lat: 51.505, lng: -0.120 },
  ];

  it("returns at most topN events", () => {
    const result = rankEvents(candidates, personA, personB, timeslot, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("results are sorted by total score descending", () => {
    const result = rankEvents(candidates, personA, personB, timeslot, 3);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].matchScore.total).toBeGreaterThanOrEqual(result[i + 1].matchScore.total);
    }
  });
});

describe("classifyVibeCategory", () => {
  it("returns 'emotional' for low emotion+action sliders and low energy", () => {
    const lowA: PersonProfile = { ...personA, emotionAction: 0.2 };
    const lowB: PersonProfile = { ...personB, emotionAction: 0.2 };
    const calmSlot: TimeslotState = { ...timeslot, calmEnergetic: 0.2 };
    expect(classifyVibeCategory(lowA, lowB, calmSlot)).toBe("emotional");
  });

  it("returns 'action' for high emotion+action sliders and high energy", () => {
    const highA: PersonProfile = { ...personA, emotionAction: 0.8 };
    const highB: PersonProfile = { ...personB, emotionAction: 0.8 };
    const energeticSlot: TimeslotState = { ...timeslot, calmEnergetic: 0.8 };
    expect(classifyVibeCategory(highA, highB, energeticSlot)).toBe("action");
  });

  it("returns 'mixed' for moderate values", () => {
    const midA: PersonProfile = { ...personA, emotionAction: 0.5 };
    const midB: PersonProfile = { ...personB, emotionAction: 0.5 };
    const midSlot: TimeslotState = { ...timeslot, calmEnergetic: 0.5 };
    expect(classifyVibeCategory(midA, midB, midSlot)).toBe("mixed");
  });
});

describe("buildSearchQuery", () => {
  it("includes vibe type and activities in the query", () => {
    const query = buildSearchQuery(personA, personB, timeslot);
    expect(query).toContain("London");
    // Should include at least one of the timeslot activities or vibeType
    const hasContent = query.includes("Chill") || query.includes("Museum") || query.includes("Food");
    expect(hasContent).toBe(true);
  });

  it("falls back to 'things to do London' when no keywords", () => {
    const emptySlot: TimeslotState = {
      activities: [],
      avoid: [],
      topicType: 0.5,
      calmEnergetic: 0.5,
      shareReserve: 0.5,
    };
    const emptyA: PersonProfile = { ...personA, hobbies: [] };
    const emptyB: PersonProfile = { ...personB, hobbies: [] };
    const query = buildSearchQuery(emptyA, emptyB, emptySlot);
    expect(query).toContain("things to do");
    expect(query).toContain("London");
  });
});
