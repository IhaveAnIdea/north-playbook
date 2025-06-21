// Mock Database Service for Local Development
// This service provides in-memory data storage to avoid hitting production databases

import type { 
  Exercise, 
  ExerciseResponse, 
  PlaybookEntry, 
  MediaAsset, 
  UserProfile,
  UserProgress,
  ProgressSummary,
  AvatarInteraction
} from './aurora-postgresql-service';

// In-memory storage
class MockDatabase {
  private exercises: Exercise[] = [];
  private exerciseResponses: ExerciseResponse[] = [];
  private playbookEntries: PlaybookEntry[] = [];
  private mediaAssets: MediaAsset[] = [];
  private userProfiles: UserProfile[] = [];
  private userProgress: UserProgress[] = [];
  private avatarInteractions: AvatarInteraction[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock exercises
    this.exercises = [
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
    ];

    // Mock user profile
    this.userProfiles = [
      {
        id: 'profile-1',
        userId: 'dev-user',
        firstName: 'Development',
        lastName: 'User',
        email: 'dev@example.com',
        preferences: {},
        avatarSettings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('🎭 [MOCK DATABASE] Initialized with sample data');
  }

  // Exercise methods
  async getExercises(): Promise<Exercise[]> {
    console.log('🎭 [MOCK DATABASE] Getting exercises');
    return this.exercises;
  }

  async getExercise(exerciseId: string): Promise<Exercise | null> {
    console.log('🎭 [MOCK DATABASE] Getting exercise:', exerciseId);
    return this.exercises.find(e => e.id === exerciseId) || null;
  }

  // Exercise Response methods
  async saveExerciseResponse(response: Omit<ExerciseResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExerciseResponse> {
    console.log('🎭 [MOCK DATABASE] Saving exercise response');
    
    const newResponse: ExerciseResponse = {
      id: `response-${Date.now()}`,
      ...response,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.exerciseResponses.push(newResponse);
    return newResponse;
  }

  async getExerciseResponses(userId: string, exerciseId?: string): Promise<ExerciseResponse[]> {
    console.log('🎭 [MOCK DATABASE] Getting exercise responses for user:', userId, 'exercise:', exerciseId);
    
    let responses = this.exerciseResponses.filter(r => r.userId === userId);
    if (exerciseId) {
      responses = responses.filter(r => r.exerciseId === exerciseId);
    }
    return responses;
  }

  // Playbook Entry methods
  async createPlaybookEntry(entry: Omit<PlaybookEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlaybookEntry> {
    console.log('🎭 [MOCK DATABASE] Creating playbook entry');
    
    const newEntry: PlaybookEntry = {
      id: `entry-${Date.now()}`,
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.playbookEntries.push(newEntry);
    return newEntry;
  }

  async getPlaybookEntries(userId: string): Promise<PlaybookEntry[]> {
    console.log('🎭 [MOCK DATABASE] Getting playbook entries for user:', userId);
    
    const entries = this.playbookEntries.filter(e => e.userId === userId);
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
    console.log('🎭 [MOCK DATABASE] Saving media asset');
    
    const newAsset: MediaAsset = {
      id: `asset-${Date.now()}`,
      userId: 'dev-user',
      ...data,
      tags: data.tags || [],
      metadata: {},
      uploadedAt: new Date(),
      accessCount: 0
    };
    
    this.mediaAssets.push(newAsset);
    return newAsset;
  }

  // User Profile methods
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('🎭 [MOCK DATABASE] Getting user profile:', userId);
    return this.userProfiles.find(p => p.userId === userId) || null;
  }

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    console.log('🎭 [MOCK DATABASE] Creating user profile:', profile);
    
    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userProfiles.push(newProfile);
    return newProfile;
  }

  // Progress methods
  async getUserProgressSummary(userId: string): Promise<ProgressSummary> {
    console.log('🎭 [MOCK DATABASE] Getting progress summary for user:', userId);
    
    const responses = this.exerciseResponses.filter(r => r.userId === userId);
    const completedExercises = responses.length;
    const totalExercises = this.exercises.length;
    
    return {
      totalExercises,
      completedExercises,
      completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
      currentStreak: 3, // Mock data
      totalTimeHours: 2.5, // Mock data
      avgConfidence: 4.2, // Mock data
      mostCommonMood: 'positive' // Mock data
    };
  }

  // Avatar Interaction methods
  async saveAvatarInteraction(interaction: Omit<AvatarInteraction, 'id' | 'createdAt'>): Promise<AvatarInteraction> {
    console.log('🎭 [MOCK DATABASE] Saving avatar interaction:', interaction);
    
    const newInteraction: AvatarInteraction = {
      id: `interaction-${Date.now()}`,
      ...interaction,
      createdAt: new Date()
    };
    
    this.avatarInteractions.push(newInteraction);
    return newInteraction;
  }

  // Utility methods for development
  getAllData() {
    return {
      exercises: this.exercises,
      exerciseResponses: this.exerciseResponses,
      playbookEntries: this.playbookEntries,
      mediaAssets: this.mediaAssets,
      userProfiles: this.userProfiles,
      userProgress: this.userProgress,
      avatarInteractions: this.avatarInteractions
    };
  }

  clearAllData() {
    this.exercises = [];
    this.exerciseResponses = [];
    this.playbookEntries = [];
    this.mediaAssets = [];
    this.userProfiles = [];
    this.userProgress = [];
    this.avatarInteractions = [];
    console.log('🎭 [MOCK DATABASE] All data cleared');
  }
}

// Global singleton instance to persist across module reloads
let globalMockDatabase: MockDatabase | null = null;

function getMockDatabase(): MockDatabase {
  if (!globalMockDatabase) {
    globalMockDatabase = new MockDatabase();
  }
  return globalMockDatabase;
}

// Export singleton instance
export const mockDatabase = getMockDatabase();
export default mockDatabase; 