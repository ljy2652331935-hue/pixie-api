import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Stores generated activity plans from the Smart Planner feature.
 * Each plan contains two person profiles, a timeslot state, and the AI-generated results.
 * top3Json and chatTopicsJson are stored as JSON strings (parse on the client).
 */
export const activityPlans = mysqlTable("activity_plans", {
  id: int("id").autoincrement().primaryKey(),
  /** Optional: link to authenticated user who created the plan (null = anonymous) */
  userId: int("userId"),
  /** Person A display name */
  aName: varchar("aName", { length: 100 }).notNull(),
  /** Person B display name */
  bName: varchar("bName", { length: 100 }).notNull(),
  /** AI-generated shared vibe description */
  sharedVibe: text("sharedVibe"),
  /** Vibe category: emotional / action / mixed */
  vibeCategory: mysqlEnum("vibeCategory", ["emotional", "action", "mixed"]),
  /** Search query used to find events */
  searchQuery: text("searchQuery"),
  /** JSON string: EventRec[] — top 3 recommended venues/events with match scores */
  top3Json: text("top3Json"),
  /** JSON string: ChatTopicItem[] — 5 conversation starter topics */
  chatTopicsJson: text("chatTopicsJson"),
  /** JSON string: PersonProfile for Person A */
  personAJson: text("personAJson").notNull(),
  /** JSON string: PersonProfile for Person B */
  personBJson: text("personBJson").notNull(),
  /** JSON string: TimeslotState */
  timeslotJson: text("timeslotJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityPlan = typeof activityPlans.$inferSelect;
export type InsertActivityPlan = typeof activityPlans.$inferInsert;
