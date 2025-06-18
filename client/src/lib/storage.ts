// IndexedDB wrapper for offline storage
class LocalStorage {
  private dbName = 'MoodSyncDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores
        if (!db.objectStoreNames.contains('moodEntries')) {
          const moodStore = db.createObjectStore('moodEntries', { keyPath: 'id', autoIncrement: true });
          moodStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('healthData')) {
          const healthStore = db.createObjectStore('healthData', { keyPath: 'id', autoIncrement: true });
          healthStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('breathingSessions')) {
          db.createObjectStore('breathingSessions', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async saveMoodEntry(entry: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['moodEntries'], 'readwrite');
      const store = transaction.objectStore('moodEntries');
      const request = store.add({ ...entry, timestamp: new Date() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMoodEntries(limit = 50): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['moodEntries'], 'readonly');
      const store = transaction.objectStore('moodEntries');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const entries = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(entries);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveHealthData(data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['healthData'], 'readwrite');
      const store = transaction.objectStore('healthData');
      const request = store.add({ ...data, date: new Date() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveBreathingSession(session: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['breathingSessions'], 'readwrite');
      const store = transaction.objectStore('breathingSessions');
      const request = store.add({ ...session, completedAt: new Date() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const localStorage = new LocalStorage();
