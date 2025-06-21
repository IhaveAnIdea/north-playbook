import mysql from 'mysql2/promise';
import { getCurrentUser } from 'aws-amplify/auth';

// Database configuration
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
}

// Exercise Response interface
export interface ExerciseResponse {
  id: string;
  exerciseId: string;
  userId: string;
  responseText?: string;
  audioS3Key?: string;
  videoS3Key?: string;
  imageS3Keys?: string[];
  s3Bucket?: string;
  analysisResult?: Record<string, unknown>;
  insights?: string;
  mood?: string;
  tags?: string[];
  completionTimeSeconds?: number;
  confidenceRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Playbook Entry interface
export interface PlaybookEntry {
  id: string;
  userId: string;
  exerciseResponseId?: string;
  title: string;
  content: string;
  category: string;
  insights?: string;
  audioS3Keys?: string[];
  videoS3Keys?: string[];
  imageS3Keys?: string[];
  documentS3Keys?: string[];
  s3Bucket?: string;
  mood?: string;
  tags?: string[];
  isHighlight: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Media Asset interface
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
  tags?: string[];
  description?: string;
  uploadedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

// User Progress interface
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
  insights?: string[];
}

class DatabaseService {
  private pool: mysql.Pool | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize connection pool lazily
    this.initializePool();
  }

  /**
   * Initialize the connection pool
   */
  private async initializePool(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get database configuration from environment
      const config: DatabaseConfig = {
        host: process.env.AURORA_HOST || 'localhost',
        port: parseInt(process.env.AURORA_PORT || '3306'),
        database: process.env.AURORA_DATABASE || 'north_playbook',
        user: process.env.AURORA_USER || 'admin',
        password: process.env.AURORA_PASSWORD || 'password',
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : undefined,
        connectionLimit: 20,
        acquireTimeout: 60000,
        timeout: 60000,
      };

      this.pool = mysql.createPool(config);
      this.isInitialized = true;
      
      console.log('[DATABASE] Aurora Serverless v2 connection pool initialized');
    } catch (error) {
      console.error('[DATABASE] Failed to initialize connection pool:', error);
      throw error;
    }
  }

  /**
   * Get current user ID from Amplify Auth
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch (error) {
      throw new Error('User not authenticated');
    }
  }

  /**
   * Execute a query with parameters
   */
  private async executeQuery<T>(query: string, params: unknown[] = []): Promise<T[]> {
    if (!this.pool) {
      await this.initializePool();
    }

    if (!this.pool) {
      throw new Error('Database connection not available');
    }

    try {
      const [rows] = await this.pool.execute(query, params);
      return rows as T[];
    } catch (error) {
      console.error('[DATABASE] Query execution failed:', { query, params, error });
      throw error;
    }
  }

  /**
   * Save an exercise response
   */
  async saveExerciseResponse(data: {
    exerciseId: string;
    responseText?: string;
    audioS3Key?: string;
    videoS3Key?: string;
    imageS3Keys?: string[];
    s3Bucket?: string;
    mood?: string;
    tags?: string[];
    completionTimeSeconds?: number;
    confidenceRating?: number;
  }): Promise<ExerciseResponse> {
    const userId = await this.getCurrentUserId();
    const id = crypto.randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO exercise_responses (
        id, exercise_id, user_id, response_text, audio_s3_key, video_s3_key, 
        image_s3_keys, s3_bucket, mood, tags, completion_time_seconds, 
        confidence_rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      data.exerciseId,
      userId,
      data.responseText || null,
      data.audioS3Key || null,
      data.videoS3Key || null,
      data.imageS3Keys ? JSON.stringify(data.imageS3Keys) : null,
      data.s3Bucket || null,
      data.mood || null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.completionTimeSeconds || null,
      data.confidenceRating || null,
      now,
      now
    ];

    await this.executeQuery(query, params);

    // Update user progress
    await this.updateUserProgress(userId, data.exerciseId);

    return {
      id,
      exerciseId: data.exerciseId,
      userId,
      responseText: data.responseText,
      audioS3Key: data.audioS3Key,
      videoS3Key: data.videoS3Key,
      imageS3Keys: data.imageS3Keys,
      s3Bucket: data.s3Bucket,
      mood: data.mood,
      tags: data.tags,
      completionTimeSeconds: data.completionTimeSeconds,
      confidenceRating: data.confidenceRating,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Get exercise responses for a user
   */
  async getUserExerciseResponses(): Promise<ExerciseResponse[]> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT * FROM exercise_responses 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    const rows = await this.executeQuery<any>(query, [userId]);
    
    return rows.map(row => ({
      id: row.id,
      exerciseId: row.exercise_id,
      userId: row.user_id,
      responseText: row.response_text,
      audioS3Key: row.audio_s3_key,
      videoS3Key: row.video_s3_key,
      imageS3Keys: row.image_s3_keys ? JSON.parse(row.image_s3_keys) : undefined,
      s3Bucket: row.s3_bucket,
      analysisResult: row.analysis_result ? JSON.parse(row.analysis_result) : undefined,
      insights: row.insights,
      mood: row.mood,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      completionTimeSeconds: row.completion_time_seconds,
      confidenceRating: row.confidence_rating,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  /**
   * Get completed exercise IDs for a user
   */
  async getCompletedExerciseIds(): Promise<string[]> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT DISTINCT exercise_id 
      FROM exercise_responses 
      WHERE user_id = ?
    `;

    const rows = await this.executeQuery<{ exercise_id: string }>(query, [userId]);
    return rows.map(row => row.exercise_id);
  }

  /**
   * Save a media asset
   */
  async saveMediaAsset(data: {
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
    tags?: string[];
    description?: string;
  }): Promise<MediaAsset> {
    const userId = await this.getCurrentUserId();
    const id = crypto.randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO media_assets (
        id, user_id, s3_key, s3_bucket, file_name, file_type, file_size, 
        mime_type, exercise_id, exercise_response_id, playbook_entry_id, 
        category, tags, description, uploaded_at, access_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      userId,
      data.s3Key,
      data.s3Bucket,
      data.fileName,
      data.fileType,
      data.fileSize,
      data.mimeType,
      data.exerciseId || null,
      data.exerciseResponseId || null,
      data.playbookEntryId || null,
      data.category || null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.description || null,
      now,
      0
    ];

    await this.executeQuery(query, params);

    return {
      id,
      userId,
      s3Key: data.s3Key,
      s3Bucket: data.s3Bucket,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      exerciseId: data.exerciseId,
      exerciseResponseId: data.exerciseResponseId,
      playbookEntryId: data.playbookEntryId,
      category: data.category,
      tags: data.tags,
      description: data.description,
      uploadedAt: now,
      accessCount: 0
    };
  }

  /**
   * Update user progress for an exercise
   */
  private async updateUserProgress(userId: string, exerciseId: string): Promise<void> {
    const query = `
      INSERT INTO user_progress (
        id, user_id, exercise_id, completion_count, last_completed_at, 
        current_streak, total_time_spent_seconds, created_at, updated_at
      ) VALUES (?, ?, ?, 1, NOW(), 1, 0, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        completion_count = completion_count + 1,
        last_completed_at = NOW(),
        current_streak = current_streak + 1,
        updated_at = NOW()
    `;

    await this.executeQuery(query, [crypto.randomUUID(), userId, exerciseId]);
  }

  /**
   * Get user progress data
   */
  async getUserProgress(): Promise<UserProgress[]> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT * FROM user_progress 
      WHERE user_id = ? 
      ORDER BY last_completed_at DESC
    `;

    const rows = await this.executeQuery<any>(query, [userId]);
    
    return rows.map(row => ({
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
      insights: row.insights ? JSON.parse(row.insights) : undefined
    }));
  }

  /**
   * Search content using full-text search
   */
  async searchContent(searchTerm: string, filters?: {
    category?: string;
    mood?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    exerciseResponses: ExerciseResponse[];
    playbookEntries: PlaybookEntry[];
    mediaAssets: MediaAsset[];
  }> {
    const userId = await this.getCurrentUserId();
    
    // Search exercise responses
    let exerciseQuery = `
      SELECT * FROM exercise_responses 
      WHERE user_id = ? 
      AND MATCH(response_text, insights) AGAINST(? IN NATURAL LANGUAGE MODE)
    `;
    const exerciseParams: unknown[] = [userId, searchTerm];

    if (filters?.category) {
      exerciseQuery += ` AND JSON_UNQUOTE(JSON_EXTRACT(tags, '$[*]')) LIKE ?`;
      exerciseParams.push(`%${filters.category}%`);
    }

    if (filters?.mood) {
      exerciseQuery += ` AND mood = ?`;
      exerciseParams.push(filters.mood);
    }

    const exerciseResponses = await this.executeQuery<any>(exerciseQuery, exerciseParams);

    // Search playbook entries
    let playbookQuery = `
      SELECT * FROM playbook_entries 
      WHERE user_id = ? 
      AND MATCH(title, content, insights) AGAINST(? IN NATURAL LANGUAGE MODE)
    `;
    const playbookParams: unknown[] = [userId, searchTerm];

    const playbookEntries = await this.executeQuery<any>(playbookQuery, playbookParams);

    // Search media assets
    let mediaQuery = `
      SELECT * FROM media_assets 
      WHERE user_id = ? 
      AND MATCH(file_name, description) AGAINST(? IN NATURAL LANGUAGE MODE)
    `;
    const mediaParams: unknown[] = [userId, searchTerm];

    const mediaAssets = await this.executeQuery<any>(mediaQuery, mediaParams);

    return {
      exerciseResponses: exerciseResponses.map(this.mapExerciseResponse),
      playbookEntries: playbookEntries.map(this.mapPlaybookEntry),
      mediaAssets: mediaAssets.map(this.mapMediaAsset)
    };
  }

  /**
   * Helper methods to map database rows to interfaces
   */
  private mapExerciseResponse(row: any): ExerciseResponse {
    return {
      id: row.id,
      exerciseId: row.exercise_id,
      userId: row.user_id,
      responseText: row.response_text,
      audioS3Key: row.audio_s3_key,
      videoS3Key: row.video_s3_key,
      imageS3Keys: row.image_s3_keys ? JSON.parse(row.image_s3_keys) : undefined,
      s3Bucket: row.s3_bucket,
      analysisResult: row.analysis_result ? JSON.parse(row.analysis_result) : undefined,
      insights: row.insights,
      mood: row.mood,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      completionTimeSeconds: row.completion_time_seconds,
      confidenceRating: row.confidence_rating,
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
      insights: row.insights,
      audioS3Keys: row.audio_s3_keys ? JSON.parse(row.audio_s3_keys) : undefined,
      videoS3Keys: row.video_s3_keys ? JSON.parse(row.video_s3_keys) : undefined,
      imageS3Keys: row.image_s3_keys ? JSON.parse(row.image_s3_keys) : undefined,
      documentS3Keys: row.document_s3_keys ? JSON.parse(row.document_s3_keys) : undefined,
      s3Bucket: row.s3_bucket,
      mood: row.mood,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      isHighlight: row.is_highlight,
      viewCount: row.view_count,
      lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapMediaAsset(row: any): MediaAsset {
    return {
      id: row.id,
      userId: row.user_id,
      s3Key: row.s3_key,
      s3Bucket: row.s3_bucket,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      exerciseId: row.exercise_id,
      exerciseResponseId: row.exercise_response_id,
      playbookEntryId: row.playbook_entry_id,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      description: row.description,
      uploadedAt: new Date(row.uploaded_at),
      lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : undefined,
      accessCount: row.access_count
    };
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
    }
  }
}

export const databaseService = new DatabaseService(); 