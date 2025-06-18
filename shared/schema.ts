import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  googleFitConnected: boolean("google_fit_connected").default(false),
  notificationsEnabled: boolean("notifications_enabled").default(true),
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  emotion: text("emotion").notNull(), // angry, sad, neutral, happy, excited, love, anxious, calm
  intensity: integer("intensity").notNull(), // 1-10
  thoughts: text("thoughts"),
  activity: text("activity"), // work, exercise, social, eating, relaxing, studying
  location: text("location"),
  photoUrl: text("photo_url"),
  emotionTriggers: text("emotion_triggers").array(), // What triggered this emotion
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  heartRate: integer("heart_rate"),
  sleepHours: real("sleep_hours"),
  sleepScore: integer("sleep_score"),
  stepCount: integer("step_count"),
  date: timestamp("date").defaultNow().notNull(),
});

export const breathingSessions = pgTable("breathing_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  duration: integer("duration").notNull(), // in minutes
  pattern: text("pattern").notNull(), // 4-4-4-4, 4-7-8, 6-2-6-2
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  timestamp: true,
});

export const insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  date: true,
});

export const insertBreathingSessionSchema = createInsertSchema(breathingSessions).omit({
  id: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type HealthData = typeof healthData.$inferSelect;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;
export type BreathingSession = typeof breathingSessions.$inferSelect;
export type InsertBreathingSession = z.infer<typeof insertBreathingSessionSchema>;
