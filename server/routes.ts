import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMoodEntrySchema, insertHealthDataSchema, insertBreathingSessionSchema, type MoodEntry, type HealthData } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for simplicity (in production, use proper auth)
  const MOCK_USER_ID = 1;

  // Ensure mock user exists
  try {
    await storage.createUser({ 
      username: "demo_user", 
      password: "demo_pass",
      googleFitConnected: false,
      notificationsEnabled: true
    });
  } catch (error) {
    // User might already exist
  }

  // Mood Entries
  app.get("/api/mood-entries", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getMoodEntries(MOCK_USER_ID, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.get("/api/mood-entries/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const entries = await storage.getMoodEntriesInDateRange(
        MOCK_USER_ID, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entries in range" });
    }
  });

  app.post("/api/mood-entries", async (req, res) => {
    try {
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: MOCK_USER_ID
      });
      const entry = await storage.createMoodEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid mood entry data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create mood entry" });
      }
    }
  });

  // Health Data
  app.get("/api/health-data/today", async (req, res) => {
    try {
      const data = await storage.getHealthData(MOCK_USER_ID);
      res.json(data || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch health data" });
    }
  });

  app.get("/api/health-data/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const data = await storage.getHealthDataInDateRange(
        MOCK_USER_ID, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch health data in range" });
    }
  });

  app.post("/api/health-data", async (req, res) => {
    try {
      const validatedData = insertHealthDataSchema.parse({
        ...req.body,
        userId: MOCK_USER_ID
      });
      const data = await storage.createOrUpdateHealthData(validatedData);
      res.status(201).json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid health data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save health data" });
      }
    }
  });

  // Breathing Sessions
  app.get("/api/breathing-sessions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getBreathingSessions(MOCK_USER_ID, limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch breathing sessions" });
    }
  });

  app.post("/api/breathing-sessions", async (req, res) => {
    try {
      const validatedData = insertBreathingSessionSchema.parse({
        ...req.body,
        userId: MOCK_USER_ID
      });
      const session = await storage.createBreathingSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid breathing session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create breathing session" });
      }
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/mood-summary", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const entries = await storage.getMoodEntriesInDateRange(MOCK_USER_ID, startDate, endDate);
      
      if (entries.length === 0) {
        return res.json({ 
          averageMood: 0, 
          totalEntries: 0, 
          emotionFrequency: {},
          moodTrend: []
        });
      }

      const averageMood = entries.reduce((sum, entry) => sum + entry.intensity, 0) / entries.length;
      const emotionFrequency = entries.reduce((acc, entry) => {
        acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by day for trend
      const dailyMoods = entries.reduce((acc, entry) => {
        const date = new Date(entry.timestamp).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry.intensity);
        return acc;
      }, {} as Record<string, number[]>);

      const moodTrend = Object.entries(dailyMoods).map(([date, moods]) => ({
        date,
        averageMood: moods.reduce((sum, mood) => sum + mood, 0) / moods.length
      }));

      res.json({
        averageMood: Number(averageMood.toFixed(1)),
        totalEntries: entries.length,
        emotionFrequency,
        moodTrend
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
