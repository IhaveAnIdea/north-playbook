// Development Storage Service - File-based persistence for local dev
import fs from 'fs';
import path from 'path';
import type { 
  Exercise, 
  ExerciseResponse, 
  PlaybookEntry, 
  MediaAsset 
} from './aurora-postgresql-service';

const DEV_DATA_FILE = path.join(process.cwd(), '.dev-data.json');

interface DevData {
  exercises: Exercise[];
  exerciseResponses: ExerciseResponse[];
  playbookEntries: PlaybookEntry[];
  mediaAssets: MediaAsset[];
  lastUpdated: string;
}

const defaultData: DevData = {
  exercises: [
    {
      id: '1',
      title: 'Daily Gratitude Reflection',
      description: 'Reflect on three things you are grateful for today.',
      category: 'gratitude',
      question: 'What are three things you are grateful for today?',
      promptType: 'text',
      isActive: true,
      displayOrder: 1,
      estimatedTimeMinutes: 5,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Vision Board Creation',
      description: 'Create a visual representation of your goals.',
      category: 'vision',
      question: 'What does your ideal future look like?',
      promptType: 'text',
      isActive: true,
      displayOrder: 2,
      estimatedTimeMinutes: 15,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Mindfulness Check-in',
      description: 'Take a moment to check in with yourself.',
      category: 'mindset',
      question: 'How are you feeling right now, and what do you need?',
      promptType: 'text',
      isActive: true,
      displayOrder: 3,
      estimatedTimeMinutes: 10,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  exerciseResponses: [],
  playbookEntries: [],
  mediaAssets: [],
  lastUpdated: new Date().toISOString()
};

class DevStorage {
  private data: DevData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DevData {
    try {
      if (fs.existsSync(DEV_DATA_FILE)) {
        const fileContent = fs.readFileSync(DEV_DATA_FILE, 'utf-8');
        const parsedData = JSON.parse(fileContent);
        
        // Convert date strings back to Date objects
        this.convertStringDatesToObjects(parsedData);
        
        console.log('🎭 [DEV STORAGE] Loaded existing data:', {
          exercises: parsedData.exercises.length,
          exerciseResponses: parsedData.exerciseResponses.length,
          playbookEntries: parsedData.playbookEntries.length,
          mediaAssets: parsedData.mediaAssets.length
        });
        
        return parsedData;
      }
    } catch (error) {
      console.warn('🎭 [DEV STORAGE] Error loading dev data, using defaults:', error);
    }
    
    console.log('🎭 [DEV STORAGE] Creating new dev data file');
    this.saveData(defaultData);
    return { ...defaultData };
  }

  private convertStringDatesToObjects(data: any) {
    // Convert date strings back to Date objects for all entities
    const convertDates = (item: any) => {
      if (item.createdAt && typeof item.createdAt === 'string') {
        item.createdAt = new Date(item.createdAt);
      }
      if (item.updatedAt && typeof item.updatedAt === 'string') {
        item.updatedAt = new Date(item.updatedAt);
      }
      if (item.uploadedAt && typeof item.uploadedAt === 'string') {
        item.uploadedAt = new Date(item.uploadedAt);
      }
    };

    data.exercises?.forEach(convertDates);
    data.exerciseResponses?.forEach(convertDates);
    data.playbookEntries?.forEach(convertDates);
    data.mediaAssets?.forEach(convertDates);
  }

  private saveData(data: DevData) {
    try {
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DEV_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('🎭 [DEV STORAGE] Error saving data:', error);
    }
  }

  // Exercise methods
  async getExercises(): Promise<Exercise[]> {
    return this.data.exercises;
  }

  async getExercise(exerciseId: string): Promise<Exercise | null> {
    return this.data.exercises.find(e => e.id === exerciseId) || null;
  }

  // Exercise Response methods
  async saveExerciseResponse(response: Omit<ExerciseResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExerciseResponse> {
    const newResponse: ExerciseResponse = {
      id: `response-${Date.now()}`,
      ...response,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.data.exerciseResponses.push(newResponse);
    this.saveData(this.data);
    
    console.log('🎭 [DEV STORAGE] Saved exercise response:', newResponse.id);
    return newResponse;
  }

  async getExerciseResponses(userId: string): Promise<ExerciseResponse[]> {
    return this.data.exerciseResponses.filter(r => r.userId === userId);
  }

  // Playbook Entry methods
  async createPlaybookEntry(entry: Omit<PlaybookEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlaybookEntry> {
    const newEntry: PlaybookEntry = {
      id: `entry-${Date.now()}`,
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.data.playbookEntries.push(newEntry);
    this.saveData(this.data);
    
    console.log('🎭 [DEV STORAGE] Created playbook entry:', newEntry.id);
    return newEntry;
  }

  async getPlaybookEntries(userId: string): Promise<PlaybookEntry[]> {
    // In dev mode, if using 'dev-user', return all entries regardless of userId
    // This helps with development when user IDs might not match exactly
    let entries: PlaybookEntry[];
    if (userId === 'dev-user') {
      entries = this.data.playbookEntries;
      console.log('🎭 [DEV STORAGE] Returning all playbook entries for dev-user:', entries.length);
    } else {
      entries = this.data.playbookEntries.filter(e => e.userId === userId);
      console.log('🎭 [DEV STORAGE] Returning filtered playbook entries for user', userId, ':', entries.length);
    }
    return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Media Asset methods
  async saveMediaAsset(data: {
    s3Key: string;
    s3Bucket: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    mimeType: string;
    exerciseId?: string;
    category?: string;
    tags?: string[];
    description?: string;
  }): Promise<MediaAsset> {
    const newAsset: MediaAsset = {
      id: `asset-${Date.now()}`,
      userId: 'dev-user',
      ...data,
      tags: data.tags || [],
      metadata: {},
      uploadedAt: new Date(),
      accessCount: 0
    };
    
    this.data.mediaAssets.push(newAsset);
    this.saveData(this.data);
    
    console.log('🎭 [DEV STORAGE] Saved media asset:', newAsset.id);
    return newAsset;
  }

  // Utility methods
  clearAllData() {
    this.data = { ...defaultData };
    this.saveData(this.data);
    console.log('🎭 [DEV STORAGE] All data cleared');
  }

  getAllData() {
    return this.data;
  }
}

// Export singleton
export const devStorage = new DevStorage();
export default devStorage; 