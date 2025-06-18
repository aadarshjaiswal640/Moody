import { users, moodEntries, healthData, breathingSessions, type User, type InsertUser, type MoodEntry, type InsertMoodEntry, type HealthData, type InsertHealthData, type BreathingSession, type InsertBreathingSession } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Mood Entries
  getMoodEntries(userId: number, limit?: number): Promise<MoodEntry[]>;
  getMoodEntriesInDateRange(userId: number, startDate: Date, endDate: Date): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  
  // Health Data
  getHealthData(userId: number, date?: Date): Promise<HealthData | undefined>;
  getHealthDataInDateRange(userId: number, startDate: Date, endDate: Date): Promise<HealthData[]>;
  createOrUpdateHealthData(data: InsertHealthData): Promise<HealthData>;
  
  // Breathing Sessions
  getBreathingSessions(userId: number, limit?: number): Promise<BreathingSession[]>;
  createBreathingSession(session: InsertBreathingSession): Promise<BreathingSession>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moodEntries: Map<number, MoodEntry>;
  private healthData: Map<number, HealthData>;
  private breathingSessions: Map<number, BreathingSession>;
  private currentUserId: number;
  private currentMoodId: number;
  private currentHealthId: number;
  private currentBreathingId: number;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.healthData = new Map();
    this.breathingSessions = new Map();
    this.currentUserId = 1;
    this.currentMoodId = 1;
    this.currentHealthId = 1;
    this.currentBreathingId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample user
    const user = {
      id: 1,
      username: "demo_user",
      password: "demo",
      googleFitConnected: false,
      notificationsEnabled: true
    };
    this.users.set(1, user);

    // Create sample mood entries for the last week
    const now = new Date();
    const sampleMoods = [
      { emotion: 'happy', intensity: 7, activity: 'work', thoughts: 'Had a productive morning meeting', triggers: ['achievement'] },
      { emotion: 'calm', intensity: 6, activity: 'relaxing', thoughts: 'Enjoyed my afternoon tea', triggers: ['weather'] },
      { emotion: 'excited', intensity: 8, activity: 'social', thoughts: 'Great dinner with friends', triggers: ['relationship'] },
      { emotion: 'anxious', intensity: 4, activity: 'work', thoughts: 'Worried about upcoming deadline', triggers: ['work_stress'] },
      { emotion: 'love', intensity: 9, activity: 'social', thoughts: 'Quality time with family', triggers: ['relationship'] },
      { emotion: 'neutral', intensity: 5, activity: 'studying', thoughts: 'Regular study session', triggers: [] },
      { emotion: 'sad', intensity: 3, activity: 'work', thoughts: 'Difficult day at work', triggers: ['work_stress'] },
    ];

    sampleMoods.forEach((mood, index) => {
      const timestamp = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
      const entry = {
        id: index + 1,
        userId: 1,
        emotion: mood.emotion,
        intensity: mood.intensity,
        thoughts: mood.thoughts,
        activity: mood.activity,
        location: null,
        photoUrl: null,
        emotionTriggers: mood.triggers,
        timestamp
      };
      this.moodEntries.set(index + 1, entry);
    });

    this.currentMoodId = 8;

    // Create sample health data
    const healthEntry = {
      id: 1,
      userId: 1,
      date: new Date(),
      heartRate: 72,
      sleepHours: 7.5,
      sleepScore: 85,
      stepCount: 8432
    };
    this.healthData.set(1, healthEntry);
    this.currentHealthId = 2;

    // Create sample breathing sessions
    const breathingSessions = [
      { pattern: '4-7-8', duration: 300 },
      { pattern: 'box', duration: 600 },
      { pattern: '4-7-8', duration: 420 }
    ];

    breathingSessions.forEach((session, index) => {
      const completedAt = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
      const breathingSession = {
        id: index + 1,
        userId: 1,
        pattern: session.pattern,
        duration: session.duration,
        completedAt
      };
      this.breathingSessions.set(index + 1, breathingSession);
    });

    this.currentBreathingId = 4;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      googleFitConnected: insertUser.googleFitConnected ?? false,
      notificationsEnabled: insertUser.notificationsEnabled ?? true
    };
    this.users.set(id, user);
    return user;
  }

  async getMoodEntries(userId: number, limit = 50): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getMoodEntriesInDateRange(userId: number, startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values())
      .filter(entry => 
        entry.userId === userId &&
        new Date(entry.timestamp) >= startDate &&
        new Date(entry.timestamp) <= endDate
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.currentMoodId++;
    const entry: MoodEntry = { 
      id,
      userId: insertEntry.userId ?? 1,
      emotion: insertEntry.emotion,
      intensity: insertEntry.intensity,
      thoughts: insertEntry.thoughts ?? null,
      activity: insertEntry.activity ?? null,
      location: insertEntry.location ?? null,
      photoUrl: insertEntry.photoUrl ?? null,
      emotionTriggers: insertEntry.emotionTriggers ?? null,
      timestamp: new Date() 
    };
    this.moodEntries.set(id, entry);
    return entry;
  }

  async getHealthData(userId: number, date?: Date): Promise<HealthData | undefined> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return Array.from(this.healthData.values())
      .find(data => 
        data.userId === userId &&
        new Date(data.date) >= startOfDay &&
        new Date(data.date) < endOfDay
      );
  }

  async getHealthDataInDateRange(userId: number, startDate: Date, endDate: Date): Promise<HealthData[]> {
    return Array.from(this.healthData.values())
      .filter(data => 
        data.userId === userId &&
        new Date(data.date) >= startDate &&
        new Date(data.date) <= endDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createOrUpdateHealthData(insertData: InsertHealthData): Promise<HealthData> {
    const existing = await this.getHealthData(insertData.userId ?? 1);
    if (existing) {
      const updated: HealthData = { ...existing, ...insertData };
      this.healthData.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentHealthId++;
      const data: HealthData = { 
        id,
        userId: insertData.userId ?? 1,
        date: new Date(),
        heartRate: insertData.heartRate ?? null,
        sleepHours: insertData.sleepHours ?? null,
        sleepScore: insertData.sleepScore ?? null,
        stepCount: insertData.stepCount ?? null
      };
      this.healthData.set(id, data);
      return data;
    }
  }

  async getBreathingSessions(userId: number, limit = 20): Promise<BreathingSession[]> {
    return Array.from(this.breathingSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, limit);
  }

  async createBreathingSession(insertSession: InsertBreathingSession): Promise<BreathingSession> {
    const id = this.currentBreathingId++;
    const session: BreathingSession = { 
      id,
      userId: insertSession.userId ?? 1,
      pattern: insertSession.pattern,
      duration: insertSession.duration,
      completedAt: new Date() 
    };
    this.breathingSessions.set(id, session);
    return session;
  }
}

export const storage = new MemStorage();
