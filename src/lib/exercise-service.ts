import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

// Generate the typed GraphQL client
const client = generateClient<Schema>();

// Check if we're in development mode without Amplify
const isDevelopment = process.env.NODE_ENV === 'development';
const isAmplifyConfigured = () => {
  try {
    return typeof window !== 'undefined' && (window as any).aws_config !== undefined;
  } catch {
    return false;
  }
};

export interface ExerciseResponseData {
  exerciseId: string;
  responseText?: string;
  audioUrl?: string;
  videoUrl?: string;
  s3Key?: string;
  mood?: string;
  tags?: string[];
  insights?: string;
  analysisResult?: Record<string, unknown>;
  imageS3Keys?: string[];
}

export interface SavedExerciseResponse {
  id: string;
  exerciseId: string;
  userId: string;
  responseText?: string;
  audioUrl?: string;
  videoUrl?: string;
  s3Key?: string;
  mood?: string;
  tags?: string[];
  insights?: string;
  analysisResult?: Record<string, unknown>;
  imageS3Keys?: string[];
  createdAt: string;
  updatedAt: string;
}

class ExerciseService {
  /**
   * Get current user ID from Amplify Auth
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw new Error('User not authenticated');
    }
  }

  /**
   * Save an exercise response to the database
   */
  async saveExerciseResponse(data: ExerciseResponseData): Promise<SavedExerciseResponse> {
    try {
      // In development mode without Amplify, call the API to save the response
      if (isDevelopment && !isAmplifyConfigured()) {
        console.log('[EXERCISE SERVICE] [DEV MODE] Saving exercise response via API');
        
        const response = await fetch('/api/exercise/save-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save exercise response');
        }
        
        const result = await response.json();
        return result.data;
      }

      const userId = await this.getCurrentUserId();
      
      console.log('[EXERCISE SERVICE] Saving exercise response:', { exerciseId: data.exerciseId, userId });

      if (!client?.models?.ExerciseResponse) {
        throw new Error('ExerciseResponse model not available');
      }

      const response = await client.models.ExerciseResponse.create({
        exerciseId: data.exerciseId,
        userId: userId,
        responseText: data.responseText,
        audioUrl: data.audioUrl,
        videoUrl: data.videoUrl,
        s3Key: data.s3Key,
        mood: data.mood,
        tags: data.tags,
        insights: data.insights,
        analysisResult: data.analysisResult,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (!response.data) {
        throw new Error('Failed to save exercise response');
      }

      console.log('[EXERCISE SERVICE] Exercise response saved successfully:', response.data.id);

      return {
        id: response.data.id,
        exerciseId: response.data.exerciseId,
        userId: response.data.userId,
        responseText: response.data.responseText || undefined,
        audioUrl: response.data.audioUrl || undefined,
        videoUrl: response.data.videoUrl || undefined,
        s3Key: response.data.s3Key || undefined,
        mood: response.data.mood || undefined,
        tags: (response.data.tags || []).filter((tag): tag is string => tag !== null),
        insights: response.data.insights || undefined,
        analysisResult: response.data.analysisResult ? response.data.analysisResult as Record<string, unknown> : undefined,
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error saving exercise response:', error);
      throw new Error(`Failed to save exercise response: ${error}`);
    }
  }

  /**
   * Get all exercise responses for the current user
   */
  async getUserExerciseResponses(): Promise<SavedExerciseResponse[]> {
    try {
      // In development mode without Amplify, return mock data
      if (isDevelopment && !isAmplifyConfigured()) {
        console.log('[EXERCISE SERVICE] [DEV MODE] Using mock exercise responses');
        return [
          {
            id: 'mock-1',
            exerciseId: '1',
            userId: 'dev-user',
            responseText: 'Mock gratitude response',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mood: 'grateful',
            tags: ['gratitude', 'mindfulness']
          },
          {
            id: 'mock-2',
            exerciseId: '3',
            userId: 'dev-user',
            responseText: 'Mock mindset response',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mood: 'reflective',
            tags: ['mindset', 'growth']
          }
        ];
      }

      const userId = await this.getCurrentUserId();
      
      console.log('[EXERCISE SERVICE] Fetching user exercise responses for:', userId);

      if (!client?.models?.ExerciseResponse) {
        console.error('[EXERCISE SERVICE] ExerciseResponse model not available');
        return [];
      }

      const response = await client.models.ExerciseResponse.list({
        filter: {
          userId: {
            eq: userId
          }
        }
      });

      if (!response.data) {
        return [];
      }

      console.log('[EXERCISE SERVICE] Found', response.data.length, 'exercise responses');

      return response.data.map(item => ({
        id: item.id,
        exerciseId: item.exerciseId,
        userId: item.userId,
        responseText: item.responseText || undefined,
        audioUrl: item.audioUrl || undefined,
        videoUrl: item.videoUrl || undefined,
        s3Key: item.s3Key || undefined,
        mood: item.mood || undefined,
        tags: (item.tags || []).filter((tag): tag is string => tag !== null),
        insights: item.insights || undefined,
        analysisResult: item.analysisResult ? item.analysisResult as Record<string, unknown> : undefined,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching user exercise responses:', error);
      // Return empty array instead of throwing in case of errors
      return [];
    }
  }

  /**
   * Get completed exercise IDs for progress tracking
   */
  async getCompletedExerciseIds(): Promise<string[]> {
    try {
      const responses = await this.getUserExerciseResponses();
      const completedIds = [...new Set(responses.map(response => response.exerciseId))];
      
      console.log('[EXERCISE SERVICE] User has completed exercises:', completedIds);
      
      return completedIds;
    } catch (error) {
      console.error('Error getting completed exercise IDs:', error);
      return [];
    }
  }

  /**
   * Check if a specific exercise has been completed
   */
  async isExerciseCompleted(exerciseId: string): Promise<boolean> {
    try {
      const completedIds = await this.getCompletedExerciseIds();
      return completedIds.includes(exerciseId);
    } catch (error) {
      console.error('Error checking exercise completion:', error);
      return false;
    }
  }

  /**
   * Get the most recent response for a specific exercise
   */
  async getExerciseResponse(exerciseId: string): Promise<SavedExerciseResponse | null> {
    try {
      const userId = await this.getCurrentUserId();
      
      const response = await client.models.ExerciseResponse.list({
        filter: {
          exerciseId: {
            eq: exerciseId
          },
          userId: {
            eq: userId
          }
        }
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      // Return the most recent response
      const sortedResponses = response.data.sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );

      const latestResponse = sortedResponses[0];
      
      return {
        id: latestResponse.id,
        exerciseId: latestResponse.exerciseId,
        userId: latestResponse.userId,
        responseText: latestResponse.responseText || undefined,
        audioUrl: latestResponse.audioUrl || undefined,
        videoUrl: latestResponse.videoUrl || undefined,
        s3Key: latestResponse.s3Key || undefined,
        mood: latestResponse.mood || undefined,
        tags: latestResponse.tags || undefined,
        insights: latestResponse.insights || undefined,
        analysisResult: latestResponse.analysisResult || undefined,
        createdAt: latestResponse.createdAt || new Date().toISOString(),
        updatedAt: latestResponse.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting exercise response:', error);
      return null;
    }
  }

  /**
   * Update an existing exercise response
   */
  async updateExerciseResponse(responseId: string, updates: Partial<ExerciseResponseData>): Promise<SavedExerciseResponse> {
    try {
      console.log('[EXERCISE SERVICE] Updating exercise response:', responseId);

      const response = await client.models.ExerciseResponse.update({
        id: responseId,
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      if (!response.data) {
        throw new Error('Failed to update exercise response');
      }

      console.log('[EXERCISE SERVICE] Exercise response updated successfully');

      return {
        id: response.data.id,
        exerciseId: response.data.exerciseId,
        userId: response.data.userId,
        responseText: response.data.responseText || undefined,
        audioUrl: response.data.audioUrl || undefined,
        videoUrl: response.data.videoUrl || undefined,
        s3Key: response.data.s3Key || undefined,
        mood: response.data.mood || undefined,
        tags: response.data.tags || undefined,
        insights: response.data.insights || undefined,
        analysisResult: response.data.analysisResult || undefined,
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error updating exercise response:', error);
      throw new Error(`Failed to update exercise response: ${error}`);
    }
  }

  /**
   * Delete an exercise response
   */
  async deleteExerciseResponse(responseId: string): Promise<void> {
    try {
      console.log('[EXERCISE SERVICE] Deleting exercise response:', responseId);

      await client.models.ExerciseResponse.delete({
        id: responseId
      });

      console.log('[EXERCISE SERVICE] Exercise response deleted successfully');
    } catch (error) {
      console.error('Error deleting exercise response:', error);
      throw new Error(`Failed to delete exercise response: ${error}`);
    }
  }
}

export const exerciseService = new ExerciseService(); 