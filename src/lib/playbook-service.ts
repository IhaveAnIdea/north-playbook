// Aurora PostgreSQL service for North Playbook
// Handles core playbook data (vectors managed by Pinecone)
import { Pool, PoolClient } from 'pg';

// Database connection configuration
const poolConfig = {
  host: process.env.AURORA_POSTGRES_HOST,
  port: parseInt(process.env.AURORA_POSTGRES_PORT || '5432'),
  database: process.env.AURORA_POSTGRES_DATABASE,
  user: process.env.AURORA_POSTGRES_USER,
  password: process.env.AURORA_POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool: Pool | null = null;

// Initialize connection pool
function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
  }
  return pool;
}

// Check if database is configured
function isDatabaseConfigured(): boolean {
  return !!(process.env.AURORA_POSTGRES_HOST && 
           process.env.AURORA_POSTGRES_DATABASE && 
           process.env.AURORA_POSTGRES_USER && 
           process.env.AURORA_POSTGRES_PASSWORD);
}

// Development mode detection
function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development' || !isDatabaseConfigured();
}

// Type definitions
export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  preferences: Record<string, any>;
  avatarSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: 'mindset' | 'motivation' | 'goals' | 'reflection' | 'gratitude' | 'vision';
  question: string;
  promptType: 'text' | 'audio' | 'video';
  isActive: boolean;
  displayOrder: number;
  estimatedTimeMinutes: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseResponse {
  id: string;
  exerciseId: string;
  userId: string;
  responseText?: string;
  audioS3Key?: string;
  videoS3Key?: string;
  imageS3Keys: string[];
  s3Bucket?: string;
  analysisResult: Record<string, any>;
  insights: string[];
  mood?: string;
  tags: string[];
  completionTimeSeconds?: number;
  confidenceRating?: number;
  sentimentScore?: number;
  pineconeId?: string; // Reference to Pinecone vector
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybookEntry {
  id: string;
  userId: string;
  exerciseResponseId?: string;
  title: string;
  content: string;
  category: string;
  insights: string[];
  audioS3Keys: string[];
  videoS3Keys: string[];
  imageS3Keys: string[];
  documentS3Keys: string[];
  s3Bucket?: string;
  mood?: string;
  tags: string[];
  isHighlight: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  pineconeId?: string; // Reference to Pinecone vector
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  userId: string;
  s3Key: string;
  s3Bucket: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  exerciseId?: string;
  exerciseResponseId?: string;
  playbookEntryId?: string;
  category?: string;
  tags: string[];
  description?: string;
  metadata: Record<string, any>;
  uploadedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

export interface UserProgress {
  id: string;
  userId: string;
  exerciseId: string;
  completionCount: number;
  lastCompletedAt?: Date;
  averageCompletionTimeSeconds?: number;
  averageMoodRating?: number;
  bestStreak: number;
  currentStreak: number;
  totalTimeSpentSeconds: number;
  insights: string[];
  aiRecommendations: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInsights {
  id: string;
  userId: string;
  overallMood?: string;
  growthAreas: string[];
  strengths: string[];
  recommendations: string[];
  progressMetrics: Record<string, any>;
  totalExercisesCompleted: number;
  streakDays: number;
  lastExerciseDate?: Date;
  aiAnalysis: Record<string, any>;
  personalityProfile: Record<string, any>;
  avatarContext: Record<string, any>;
  lastUpdated: Date;
}

export interface AvatarInteraction {
  id: string;
  userId: string;
  sessionId?: string;
  userMessage: string;
  avatarResponse: string;
  contextUsed: Record<string, any>;
  pineconeQueryIds: string[]; // IDs of Pinecone results used
  interactionType: string;
  sentimentScore?: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionType: 'exercise' | 'reflection' | 'goal_setting' | 'review' | 'avatar_chat';
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  exerciseIds: string[];
  mood?: string;
  notes?: string;
  completionStatus: 'started' | 'completed' | 'paused' | 'abandoned';
  avatarInteractions: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ProgressSummary {
  totalExercises: number;
  completedExercises: number;
  completionRate: number;
  currentStreak: number;
  totalTimeHours: number;
  avgConfidence: number;
  mostCommonMood: string;
}

// Mock data for development
const mockExercises: Exercise[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Daily Gratitude Reflection',
    description: 'Reflect on three things you are grateful for today and why they matter to you.',
    category: 'gratitude',
    question: 'What are three things you are grateful for today, and how do they make you feel?',
    promptType: 'text',
    isActive: true,
    displayOrder: 1,
    estimatedTimeMinutes: 5,
    metadata: { difficulty: 'easy', focusArea: 'mindfulness' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Future Vision Exercise',
    description: 'Visualize and describe your ideal life 5 years from now.',
    category: 'vision',
    question: 'Describe in detail what your life looks like 5 years from now. What have you achieved?',
    promptType: 'text',
    isActive: true,
    displayOrder: 2,
    estimatedTimeMinutes: 15,
    metadata: { difficulty: 'medium', focusArea: 'goal_setting' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Mindset Check-In',
    description: 'Examine your current mindset and identify areas for growth.',
    category: 'mindset',
    question: 'How would you describe your current mindset? What beliefs are serving you well, and which ones might be holding you back?',
    promptType: 'audio',
    isActive: true,
    displayOrder: 3,
    estimatedTimeMinutes: 10,
    metadata: { difficulty: 'medium', focusArea: 'self_awareness' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

class PlaybookService {
  
  // User Profile Operations
  async createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    if (isDevMode()) {
      return {
        id: `profile-${Date.now()}`,
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const client = await getPool().connect();
    try {
      const result = await client.query(`
        INSERT INTO user_profiles (user_id, first_name, last_name, email, preferences, avatar_settings)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [profile.userId, profile.firstName, profile.lastName, profile.email, 
          JSON.stringify(profile.preferences), JSON.stringify(profile.avatarSettings)]);
      
      return this.mapUserProfile(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (isDevMode()) {
      return {
        id: `profile-${userId}`,
        userId,
        firstName: 'Dev',
        lastName: 'User',
        email: 'dev@example.com',
        preferences: {},
        avatarSettings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const client = await getPool().connect();
    try {
      const result = await client.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
      return result.rows[0] ? this.mapUserProfile(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (isDevMode()) {
      return {
        id: `profile-${userId}`,
        userId,
        firstName: 'Dev',
        lastName: 'User',
        email: 'dev@example.com',
        preferences: updates.preferences || {},
        avatarSettings: updates.avatarSettings || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const client = await getPool().connect();
    try {
      const result = await client.query(`
        UPDATE user_profiles 
        SET first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            email = COALESCE($4, email),
            preferences = COALESCE($5, preferences),
            avatar_settings = COALESCE($6, avatar_settings),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `, [userId, updates.firstName, updates.lastName, updates.email,
          updates.preferences ? JSON.stringify(updates.preferences) : null,
          updates.avatarSettings ? JSON.stringify(updates.avatarSettings) : null]);
      
      return result.rows[0] ? this.mapUserProfile(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  // Exercise Operations
  async getExercises(activeOnly: boolean = true): Promise<Exercise[]> {
    if (isDevMode()) {
      return activeOnly ? mockExercises.filter(e => e.isActive) : mockExercises;
    }

    const client = await getPool().connect();
    try {
      const query = activeOnly 
        ? 'SELECT * FROM exercises WHERE is_active = true ORDER BY display_order'
        : 'SELECT * FROM exercises ORDER BY display_order';
      
      const result = await client.query(query);
      return result.rows.map(row => this.mapExercise(row));
    } finally {
      client.release();
    }
  }

  async getExercise(exerciseId: string): Promise<Exercise | null> {
    if (isDevMode()) {
      return mockExercises.find(e => e.id === exerciseId) || null;
    }

    const client = await getPool().connect();
    try {
      const result = await client.query('SELECT * FROM exercises WHERE id = $1', [exerciseId]);
      return result.rows[0] ? this.mapExercise(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  // Exercise Response Operations
  async saveExerciseResponse(response: Omit<ExerciseResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExerciseResponse> {
    if (isDevMode()) {
      return {
        id: `response-${Date.now()}`,
        ...response,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const client = await getPool().connect();
    try {
      const result = await client.query(`
        INSERT INTO exercise_responses (
          exercise_id, user_id, response_text, audio_s3_key, video_s3_key, 
          image_s3_keys, s3_bucket, analysis_result, insights, mood, tags, 
          completion_time_seconds, confidence_rating, sentiment_score, 
          pinecone_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        response.exerciseId, response.userId, response.responseText,
        response.audioS3Key, response.videoS3Key, response.imageS3Keys,
        response.s3Bucket, JSON.stringify(response.analysisResult),
        response.insights, response.mood, response.tags,
        response.completionTimeSeconds, response.confidenceRating,
        response.sentimentScore, response.pineconeId, JSON.stringify(response.metadata)
      ]);

      return this.mapExerciseResponse(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getExerciseResponses(userId: string, exerciseId?: string): Promise<ExerciseResponse[]> {
    if (isDevMode()) {
      return [
        {
          id: `response-${Date.now()}`,
          exerciseId: exerciseId || mockExercises[0].id,
          userId,
          responseText: 'Sample response text',
          audioS3Key: undefined,
          videoS3Key: undefined,
          imageS3Keys: [],
          s3Bucket: undefined,
          analysisResult: {},
          insights: ['Sample insight'],
          mood: 'positive',
          tags: ['gratitude', 'reflection'],
          completionTimeSeconds: 300,
          confidenceRating: 8,
          sentimentScore: 0.7,
          pineconeId: undefined,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }

    const client = await getPool().connect();
    try {
      const query = exerciseId 
        ? 'SELECT * FROM exercise_responses WHERE user_id = $1 AND exercise_id = $2 ORDER BY created_at DESC'
        : 'SELECT * FROM exercise_responses WHERE user_id = $1 ORDER BY created_at DESC';
      
      const params = exerciseId ? [userId, exerciseId] : [userId];
      const result = await client.query(query, params);
      
      return result.rows.map(row => this.mapExerciseResponse(row));
    } finally {
      client.release();
    }
  }

  // Playbook Entry Operations
  async createPlaybookEntry(entry: Omit<PlaybookEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlaybookEntry> {
    if (isDevMode()) {
      return {
        id: `playbook-${Date.now()}`,
        ...entry,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const client = await getPool().connect();
    try {
      const result = await client.query(`
        INSERT INTO playbook_entries (
          user_id, exercise_response_id, title, content, category, insights,
          audio_s3_keys, video_s3_keys, image_s3_keys, document_s3_keys,
          s3_bucket, mood, tags, is_highlight, pinecone_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        entry.userId, entry.exerciseResponseId, entry.title, entry.content,
        entry.category, entry.insights, entry.audioS3Keys, entry.videoS3Keys,
        entry.imageS3Keys, entry.documentS3Keys, entry.s3Bucket, entry.mood,
        entry.tags, entry.isHighlight, entry.pineconeId, JSON.stringify(entry.metadata)
      ]);

      return this.mapPlaybookEntry(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getPlaybookEntries(userId: string, options: {
    category?: string;
    limit?: number;
    offset?: number;
    highlightsOnly?: boolean;
  } = {}): Promise<PlaybookEntry[]> {
    if (isDevMode()) {
      return [
        {
          id: `playbook-${Date.now()}`,
          userId,
          exerciseResponseId: undefined,
          title: 'Sample Playbook Entry',
          content: 'This is a sample playbook entry content.',
          category: 'reflection',
          insights: ['Sample insight'],
          audioS3Keys: [],
          videoS3Keys: [],
          imageS3Keys: [],
          documentS3Keys: [],
          s3Bucket: undefined,
          mood: 'positive',
          tags: ['reflection', 'growth'],
          isHighlight: false,
          viewCount: 0,
          lastViewedAt: undefined,
          pineconeId: undefined,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }

    const client = await getPool().connect();
    try {
      let query = 'SELECT * FROM playbook_entries WHERE user_id = $1';
      const params: any[] = [userId];
      let paramCount = 1;

      if (options.category) {
        query += ` AND category = $${++paramCount}`;
        params.push(options.category);
      }

      if (options.highlightsOnly) {
        query += ' AND is_highlight = true';
      }

      query += ' ORDER BY created_at DESC';

      if (options.limit) {
        query += ` LIMIT $${++paramCount}`;
        params.push(options.limit);
      }

      if (options.offset) {
        query += ` OFFSET $${++paramCount}`;
        params.push(options.offset);
      }

      const result = await client.query(query, params);
      return result.rows.map(row => this.mapPlaybookEntry(row));
    } finally {
      client.release();
    }
  }

  // Progress and Analytics
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    if (isDevMode()) {
      return [
        {
          id: `progress-${Date.now()}`,
          userId,
          exerciseId: mockExercises[0].id,
          completionCount: 5,
          lastCompletedAt: new Date(),
          averageCompletionTimeSeconds: 300,
          averageMoodRating: 4.2,
          bestStreak: 7,
          currentStreak: 3,
          totalTimeSpentSeconds: 1500,
          insights: ['Consistent progress', 'Shows growth mindset'],
          aiRecommendations: { nextFocus: 'goal_setting' },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }

    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT * FROM user_progress 
        WHERE user_id = $1 
        ORDER BY completion_count DESC
      `, [userId]);
      
      return result.rows.map(row => this.mapUserProgress(row));
    } finally {
      client.release();
    }
  }

  async getUserProgressSummary(userId: string): Promise<ProgressSummary> {
    if (isDevMode()) {
      return {
        totalExercises: 8,
        completedExercises: 3,
        completionRate: 37.5,
        currentStreak: 3,
        totalTimeHours: 2.5,
        avgConfidence: 7.5,
        mostCommonMood: 'positive'
      };
    }

    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT * FROM get_user_progress_summary($1)
      `, [userId]);
      
      return result.rows[0] || {
        totalExercises: 0,
        completedExercises: 0,
        completionRate: 0,
        currentStreak: 0,
        totalTimeHours: 0,
        avgConfidence: 0,
        mostCommonMood: ''
      };
    } finally {
      client.release();
    }
  }

  // Avatar Interactions
  async saveAvatarInteraction(interaction: Omit<AvatarInteraction, 'id' | 'createdAt'>): Promise<AvatarInteraction> {
    if (isDevMode()) {
      return {
        id: `interaction-${Date.now()}`,
        ...interaction,
        createdAt: new Date()
      };
    }

    const client = await getPool().connect();
    try {
      const result = await client.query(`
        INSERT INTO avatar_interactions (
          user_id, session_id, user_message, avatar_response, context_used,
          pinecone_query_ids, interaction_type, sentiment_score, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        interaction.userId, interaction.sessionId, interaction.userMessage,
        interaction.avatarResponse, JSON.stringify(interaction.contextUsed),
        interaction.pineconeQueryIds, interaction.interactionType,
        interaction.sentimentScore, JSON.stringify(interaction.metadata)
      ]);

      return this.mapAvatarInteraction(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Utility Methods
  async updateUserProgress(userId: string, exerciseId: string, completionData: {
    completionTimeSeconds?: number;
    mood?: string;
    confidenceRating?: number;
  }): Promise<void> {
    if (isDevMode()) {
      return;
    }

    const client = await getPool().connect();
    try {
      await client.query(`
        INSERT INTO user_progress (user_id, exercise_id, completion_count, last_completed_at, 
                                 total_time_spent_seconds, current_streak)
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP, $3, 1)
        ON CONFLICT (user_id, exercise_id) 
        DO UPDATE SET 
          completion_count = user_progress.completion_count + 1,
          last_completed_at = CURRENT_TIMESTAMP,
          total_time_spent_seconds = user_progress.total_time_spent_seconds + COALESCE($3, 0),
          current_streak = user_progress.current_streak + 1
      `, [userId, exerciseId, completionData.completionTimeSeconds || 0]);
    } finally {
      client.release();
    }
  }

  async searchPlaybookEntries(userId: string, query: string, options: {
    category?: string;
    limit?: number;
  } = {}): Promise<PlaybookEntry[]> {
    if (isDevMode()) {
      return this.getPlaybookEntries(userId, options);
    }

    const client = await getPool().connect();
    try {
      let sqlQuery = `
        SELECT * FROM playbook_entries 
        WHERE user_id = $1 
        AND (to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $2))
      `;
      const params: any[] = [userId, query];
      let paramCount = 2;

      if (options.category) {
        sqlQuery += ` AND category = $${++paramCount}`;
        params.push(options.category);
      }

      sqlQuery += ' ORDER BY ts_rank(to_tsvector(\'english\', title || \' \' || content), plainto_tsquery(\'english\', $2)) DESC';

      if (options.limit) {
        sqlQuery += ` LIMIT $${++paramCount}`;
        params.push(options.limit);
      }

      const result = await client.query(sqlQuery, params);
      return result.rows.map(row => this.mapPlaybookEntry(row));
    } finally {
      client.release();
    }
  }

  // Mapping functions
  private mapUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      preferences: row.preferences || {},
      avatarSettings: row.avatar_settings || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapExercise(row: any): Exercise {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      question: row.question,
      promptType: row.prompt_type,
      isActive: row.is_active,
      displayOrder: row.display_order,
      estimatedTimeMinutes: row.estimated_time_minutes,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapExerciseResponse(row: any): ExerciseResponse {
    return {
      id: row.id,
      exerciseId: row.exercise_id,
      userId: row.user_id,
      responseText: row.response_text,
      audioS3Key: row.audio_s3_key,
      videoS3Key: row.video_s3_key,
      imageS3Keys: row.image_s3_keys || [],
      s3Bucket: row.s3_bucket,
      analysisResult: row.analysis_result || {},
      insights: row.insights || [],
      mood: row.mood,
      tags: row.tags || [],
      completionTimeSeconds: row.completion_time_seconds,
      confidenceRating: row.confidence_rating,
      sentimentScore: row.sentiment_score,
      pineconeId: row.pinecone_id,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapPlaybookEntry(row: any): PlaybookEntry {
    return {
      id: row.id,
      userId: row.user_id,
      exerciseResponseId: row.exercise_response_id,
      title: row.title,
      content: row.content,
      category: row.category,
      insights: row.insights || [],
      audioS3Keys: row.audio_s3_keys || [],
      videoS3Keys: row.video_s3_keys || [],
      imageS3Keys: row.image_s3_keys || [],
      documentS3Keys: row.document_s3_keys || [],
      s3Bucket: row.s3_bucket,
      mood: row.mood,
      tags: row.tags || [],
      isHighlight: row.is_highlight,
      viewCount: row.view_count,
      lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at) : undefined,
      pineconeId: row.pinecone_id,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapUserProgress(row: any): UserProgress {
    return {
      id: row.id,
      userId: row.user_id,
      exerciseId: row.exercise_id,
      completionCount: row.completion_count,
      lastCompletedAt: row.last_completed_at ? new Date(row.last_completed_at) : undefined,
      averageCompletionTimeSeconds: row.average_completion_time_seconds,
      averageMoodRating: row.average_mood_rating,
      bestStreak: row.best_streak,
      currentStreak: row.current_streak,
      totalTimeSpentSeconds: row.total_time_spent_seconds,
      insights: row.insights || [],
      aiRecommendations: row.ai_recommendations || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapAvatarInteraction(row: any): AvatarInteraction {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      userMessage: row.user_message,
      avatarResponse: row.avatar_response,
      contextUsed: row.context_used || {},
      pineconeQueryIds: row.pinecone_query_ids || [],
      interactionType: row.interaction_type,
      sentimentScore: row.sentiment_score,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at)
    };
  }
}

// Export singleton instance
export const playbookService = new PlaybookService();
export default playbookService; 