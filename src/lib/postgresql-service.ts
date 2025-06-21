import { Pool, PoolClient } from 'pg';
import { getCurrentUser } from 'aws-amplify/auth';

// Database configuration for PostgreSQL Aurora Serverless v2
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

// Enhanced interfaces with vector support
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
  insights?: string[];
  mood?: string;
  tags?: string[];
  completionTimeSeconds?: number;
  confidenceRating?: number;
  sentimentScore?: number;
  responseEmbedding?: number[]; // Vector embedding for semantic search
  metadata?: Record<string, unknown>;
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
  insights?: string[];
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
  contentEmbedding?: number[];
  metadata?: Record<string, unknown>;
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
  tags?: string[];
  description?: string;
  metadata?: Record<string, unknown>;
  contentEmbedding?: number[];
  uploadedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

export interface UserInsights {
  id: string;
  userId: string;
  overallMood?: string;
  growthAreas?: string[];
  strengths?: string[];
  recommendations?: string[];
  progressMetrics?: Record<string, unknown>;
  totalExercisesCompleted: number;
  streakDays: number;
  lastExerciseDate?: Date;
  insightsEmbedding?: number[];
  aiAnalysis?: Record<string, unknown>;
  personalityProfile?: Record<string, unknown>;
  lastUpdated: Date;
}

export interface SimilaritySearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

class PostgreSQLService {
  private pool: Pool | null = null;
  private isInitialized = false;

  constructor() {
    this.initializePool();
  }

  /**
   * Initialize the PostgreSQL connection pool
   */
  private async initializePool(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const config: DatabaseConfig = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE || 'north_playbook',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : undefined,
        max: 20,
        connectionTimeoutMillis: 60000,
        idleTimeoutMillis: 30000,
      };

      this.pool = new Pool(config);
      this.isInitialized = true;
      
      console.log('[DATABASE] PostgreSQL Aurora Serverless v2 connection pool initialized');
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

    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      const result = await client.query(query, params);
      return result.rows as T[];
    } catch (error) {
      console.error('[DATABASE] Query execution failed:', { query, params, error });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Generate embedding for text content (placeholder - integrate with OpenAI)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // TODO: Integrate with OpenAI or other embedding service
    // For now, return a placeholder vector
    console.log('[DATABASE] Generating embedding for text:', text.substring(0, 100) + '...');
    
    // In production, this would call OpenAI API:
    // const response = await openai.embeddings.create({
    //   model: "text-embedding-ada-002",
    //   input: text,
    // });
    // return response.data[0].embedding;
    
    // Return zero vector as placeholder (1536 dimensions for OpenAI)
    return new Array(1536).fill(0);
  }

  /**
   * Save an exercise response with semantic embedding
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
    sentimentScore?: number;
  }): Promise<ExerciseResponse> {
    const userId = await this.getCurrentUserId();
    const now = new Date();

    // Generate embedding for response text
    let responseEmbedding: number[] | null = null;
    if (data.responseText) {
      responseEmbedding = await this.generateEmbedding(data.responseText);
    }

    const query = `
      INSERT INTO exercise_responses (
        exercise_id, user_id, response_text, audio_s3_key, video_s3_key, 
        image_s3_keys, s3_bucket, mood, tags, completion_time_seconds, 
        confidence_rating, sentiment_score, response_embedding, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const params = [
      data.exerciseId,
      userId,
      data.responseText || null,
      data.audioS3Key || null,
      data.videoS3Key || null,
      data.imageS3Keys || null,
      data.s3Bucket || null,
      data.mood || null,
      data.tags || null,
      data.completionTimeSeconds || null,
      data.confidenceRating || null,
      data.sentimentScore || null,
      responseEmbedding ? `[${responseEmbedding.join(',')}]` : null,
      now,
      now
    ];

    const rows = await this.executeQuery<any>(query, params);
    const row = rows[0];

    // Update user progress
    await this.updateUserProgress(userId, data.exerciseId);

    return this.mapExerciseResponse(row);
  }

  /**
   * Get exercise responses for a user
   */
  async getUserExerciseResponses(): Promise<ExerciseResponse[]> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT * FROM exercise_responses 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

    const rows = await this.executeQuery<any>(query, [userId]);
    return rows.map(row => this.mapExerciseResponse(row));
  }

  /**
   * Get completed exercise IDs for a user
   */
  async getCompletedExerciseIds(): Promise<string[]> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT DISTINCT exercise_id 
      FROM exercise_responses 
      WHERE user_id = $1
    `;

    const rows = await this.executeQuery<{ exercise_id: string }>(query, [userId]);
    return rows.map(row => row.exercise_id);
  }

  /**
   * Semantic search across exercise responses
   */
  async searchSimilarResponses(queryText: string, limit: number = 10): Promise<SimilaritySearchResult[]> {
    const userId = await this.getCurrentUserId();
    
    // Generate embedding for search query
    const queryEmbedding = await this.generateEmbedding(queryText);
    
    const query = `
      SELECT 
        id,
        response_text as content,
        1 - (response_embedding <=> $1::vector) as similarity,
        metadata
      FROM exercise_responses
      WHERE user_id = $2 
      AND response_embedding IS NOT NULL
      AND response_text IS NOT NULL
      ORDER BY response_embedding <=> $1::vector
      LIMIT $3
    `;

    const embeddingVector = `[${queryEmbedding.join(',')}]`;
    const rows = await this.executeQuery<any>(query, [embeddingVector, userId, limit]);
    
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata
    }));
  }

  /**
   * Find similar playbook entries using vector similarity
   */
  async findSimilarPlaybookEntries(contentEmbedding: number[], limit: number = 5): Promise<SimilaritySearchResult[]> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT 
        id,
        title || ': ' || content as content,
        1 - (content_embedding <=> $1::vector) as similarity,
        metadata
      FROM playbook_entries
      WHERE user_id = $2 
      AND content_embedding IS NOT NULL
      ORDER BY content_embedding <=> $1::vector
      LIMIT $3
    `;

    const embeddingVector = `[${contentEmbedding.join(',')}]`;
    const rows = await this.executeQuery<any>(query, [embeddingVector, userId, limit]);
    
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata
    }));
  }

  /**
   * Advanced full-text search with PostgreSQL's text search capabilities
   */
  async fullTextSearch(searchTerm: string, filters?: {
    category?: string;
    mood?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    exerciseResponses: ExerciseResponse[];
    playbookEntries: PlaybookEntry[];
  }> {
    const userId = await this.getCurrentUserId();
    
    // Search exercise responses
    let exerciseQuery = `
      SELECT *, ts_rank(to_tsvector('english', response_text), plainto_tsquery('english', $2)) as rank
      FROM exercise_responses 
      WHERE user_id = $1 
      AND to_tsvector('english', response_text) @@ plainto_tsquery('english', $2)
    `;
    const exerciseParams: unknown[] = [userId, searchTerm];
    let paramCount = 2;

    if (filters?.category) {
      paramCount++;
      exerciseQuery += ` AND $${paramCount} = ANY(tags)`;
      exerciseParams.push(filters.category);
    }

    if (filters?.mood) {
      paramCount++;
      exerciseQuery += ` AND mood = $${paramCount}`;
      exerciseParams.push(filters.mood);
    }

    if (filters?.dateFrom) {
      paramCount++;
      exerciseQuery += ` AND created_at >= $${paramCount}`;
      exerciseParams.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      paramCount++;
      exerciseQuery += ` AND created_at <= $${paramCount}`;
      exerciseParams.push(filters.dateTo);
    }

    exerciseQuery += ` ORDER BY rank DESC, created_at DESC LIMIT 20`;

    // Search playbook entries
    let playbookQuery = `
      SELECT *, ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $2)) as rank
      FROM playbook_entries 
      WHERE user_id = $1 
      AND to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $2)
      ORDER BY rank DESC, created_at DESC 
      LIMIT 20
    `;

    const exerciseResponses = await this.executeQuery<any>(exerciseQuery, exerciseParams);
    const playbookEntries = await this.executeQuery<any>(playbookQuery, [userId, searchTerm]);

    return {
      exerciseResponses: exerciseResponses.map(this.mapExerciseResponse),
      playbookEntries: playbookEntries.map(this.mapPlaybookEntry)
    };
  }

  /**
   * Get AI-powered content recommendations
   */
  async getContentRecommendations(limit: number = 5): Promise<SimilaritySearchResult[]> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT * FROM get_content_recommendations($1, 'similar_insights', $2)
    `;

    const rows = await this.executeQuery<any>(query, [userId, limit]);
    
    return rows.map(row => ({
      id: row.content_id,
      content: row.title,
      similarity: row.similarity_score,
      metadata: row.metadata
    }));
  }

  /**
   * Save a playbook entry with content embedding
   */
  async savePlaybookEntry(data: {
    exerciseResponseId?: string;
    title: string;
    content: string;
    category: string;
    insights?: string[];
    mood?: string;
    tags?: string[];
    isHighlight?: boolean;
  }): Promise<PlaybookEntry> {
    const userId = await this.getCurrentUserId();
    const now = new Date();

    // Generate embedding for content
    const contentText = `${data.title} ${data.content}`;
    const contentEmbedding = await this.generateEmbedding(contentText);

    const query = `
      INSERT INTO playbook_entries (
        user_id, exercise_response_id, title, content, category, 
        insights, mood, tags, is_highlight, content_embedding, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const params = [
      userId,
      data.exerciseResponseId || null,
      data.title,
      data.content,
      data.category,
      data.insights || null,
      data.mood || null,
      data.tags || null,
      data.isHighlight || false,
      `[${contentEmbedding.join(',')}]`,
      now,
      now
    ];

    const rows = await this.executeQuery<any>(query, params);
    return this.mapPlaybookEntry(rows[0]);
  }

  /**
   * Get or create user insights with AI analysis
   */
  async getUserInsights(): Promise<UserInsights | null> {
    const userId = await this.getCurrentUserId();
    
    const query = `
      SELECT * FROM user_insights 
      WHERE user_id = $1
    `;

    const rows = await this.executeQuery<any>(query, [userId]);
    
    if (rows.length === 0) {
      // Create initial insights record
      return await this.createInitialUserInsights(userId);
    }

    return this.mapUserInsights(rows[0]);
  }

  /**
   * Create initial user insights record
   */
  private async createInitialUserInsights(userId: string): Promise<UserInsights> {
    const query = `
      INSERT INTO user_insights (
        user_id, total_exercises_completed, streak_days, last_updated
      ) VALUES ($1, 0, 0, $2)
      RETURNING *
    `;

    const rows = await this.executeQuery<any>(query, [userId, new Date()]);
    return this.mapUserInsights(rows[0]);
  }

  /**
   * Update user progress for an exercise
   */
  private async updateUserProgress(userId: string, exerciseId: string): Promise<void> {
    const query = `
      INSERT INTO user_progress (
        user_id, exercise_id, completion_count, last_completed_at, 
        current_streak, total_time_spent_seconds, created_at, updated_at
      ) VALUES ($1, $2, 1, NOW(), 1, 0, NOW(), NOW())
      ON CONFLICT (user_id, exercise_id) 
      DO UPDATE SET
        completion_count = user_progress.completion_count + 1,
        last_completed_at = NOW(),
        current_streak = user_progress.current_streak + 1,
        updated_at = NOW()
    `;

    await this.executeQuery(query, [userId, exerciseId]);
  }

  /**
   * Refresh materialized views for analytics
   */
  async refreshAnalyticsViews(): Promise<void> {
    await this.executeQuery('SELECT refresh_analytics_views()');
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
      imageS3Keys: row.image_s3_keys,
      s3Bucket: row.s3_bucket,
      analysisResult: row.analysis_result,
      insights: row.insights,
      mood: row.mood,
      tags: row.tags,
      completionTimeSeconds: row.completion_time_seconds,
      confidenceRating: row.confidence_rating,
      sentimentScore: row.sentiment_score,
      responseEmbedding: row.response_embedding,
      metadata: row.metadata,
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
      audioS3Keys: row.audio_s3_keys,
      videoS3Keys: row.video_s3_keys,
      imageS3Keys: row.image_s3_keys,
      documentS3Keys: row.document_s3_keys,
      s3Bucket: row.s3_bucket,
      mood: row.mood,
      tags: row.tags,
      isHighlight: row.is_highlight,
      viewCount: row.view_count,
      lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at) : undefined,
      contentEmbedding: row.content_embedding,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapUserInsights(row: any): UserInsights {
    return {
      id: row.id,
      userId: row.user_id,
      overallMood: row.overall_mood,
      growthAreas: row.growth_areas,
      strengths: row.strengths,
      recommendations: row.recommendations,
      progressMetrics: row.progress_metrics,
      totalExercisesCompleted: row.total_exercises_completed,
      streakDays: row.streak_days,
      lastExerciseDate: row.last_exercise_date ? new Date(row.last_exercise_date) : undefined,
      insightsEmbedding: row.insights_embedding,
      aiAnalysis: row.ai_analysis,
      personalityProfile: row.personality_profile,
      lastUpdated: new Date(row.last_updated)
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

export const postgreSQLService = new PostgreSQLService(); 