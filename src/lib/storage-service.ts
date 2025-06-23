import { uploadData, downloadData, remove, list } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';

// Always use real Amplify storage and database

// Enhanced types for better semantic search
export interface AssetSearchResult {
  key: string;
  url: string;
  metadata: StorageMetadata;
  score: number; // Relevance score
  matchedFields: string[]; // Which fields matched the search
}

export interface SemanticSearchOptions {
  categories?: string[];
  exerciseIds?: string[];
  fileTypes?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  mood?: string;
  sortBy?: 'relevance' | 'date' | 'category' | 'type';
  limit?: number;
}

// Real Amplify storage only - no mock data

// Storage path constants
export const STORAGE_PATHS = {
  PLAYBOOK: 'playbook',
  PROFILE: 'profile',
  TEMP: 'temp'
} as const;

// File type constants
export const FILE_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  DOCUMENT: 'document'
} as const;

// Exercise categories for metadata
export const EXERCISE_CATEGORIES = {
  CONNECTION_TO_NATURE: 'connection_to_nature',
  HABIT_FORMATION: 'habit_formation',
  GOAL_RESILIENCE: 'goal_resilience',
  SUBSTANCE_USE: 'substance_use',
  SELF_COMPASSION: 'self_compassion',
  GOAL_ATTAINMENT: 'goal_attainment',
  WORRY: 'worry',
  HIGH_STANDARD_FRIENDS: 'high_standard_friends',
  MINDFULNESS_PRACTICE: 'mindfulness_practice',
  SLEEP_AND_REST: 'sleep_and_rest',
  PURPOSE: 'purpose',
  SELF_WORTH: 'self_worth',
  EMOTIONAL_RE_APPRAISAL: 'emotional_re_appraisal',
  PERFECTIONISM: 'perfectionism',
  ACHIEVEMENT_BASED_IDENTITY: 'achievement_based_identity',
  SELF_AUDITING: 'self_auditing',
  PURPOSE_BASED_IDENTITY: 'purpose_based_identity',
  CONNECTION_AND_BELONGING: 'connection_and_belonging',
  TRIBE: 'tribe',
  PURPOSE_BEYOND_SELF: 'purpose_beyond_self',
  DIET_AND_NUTRITION: 'diet_and_nutrition',
  GOAL_PURSUIT: 'goal_pursuit',
  SELF_TALK: 'self_talk',
  LOVING_RELATIONSHIPS: 'loving_relationships',
  GRATITUDE: 'gratitude',
  MEANING: 'meaning',
  EXERCISE: 'exercise',
  SELF_AWARENESS: 'self_awareness',
  VULNERABILITY: 'vulnerability',
  RUMINATION: 'rumination',
  CREATIVE_EXPRESSION: 'creative_expression',
  SUCCESS_COMPARISON: 'success_comparison',
  LONG_TERM_FOCUS: 'long_term_focus'
} as const;

export interface StorageMetadata {
  userId: string;
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  responseType?: 'text' | 'audio' | 'video';
  mood?: string;
  tags?: string[];
  uploadDate: string;
  fileType: string;
  originalName: string;
  description?: string;
}

export interface UploadOptions {
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  responseType?: 'text' | 'audio' | 'video';
  mood?: string;
  tags?: string[];
  description?: string;
}

class StorageService {

  constructor() {
    // Real Amplify storage - no mock data initialization
  }



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
   * Generate a standardized file path with naming convention
   * Format: users/{userId}/{pathType}/{category}/{exerciseId}/{timestamp}_{originalName}
   */
  private generateFilePath(
    userId: string,
    pathType: string,
    originalName: string,
    options?: UploadOptions
  ): string {
    // Use a more predictable timestamp format
    const now = new Date();
    const timestamp = now.getFullYear() + 
      '-' + String(now.getMonth() + 1).padStart(2, '0') + 
      '-' + String(now.getDate()).padStart(2, '0') + 
      'T' + String(now.getHours()).padStart(2, '0') + 
      '-' + String(now.getMinutes()).padStart(2, '0') + 
      '-' + String(now.getSeconds()).padStart(2, '0') + 
      '-' + String(now.getMilliseconds()).padStart(3, '0') + 'Z';
    
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    let path = `users/${userId}/${pathType}`;
    
    if (options?.category) {
      path += `/${options.category}`;
    }
    
    if (options?.exerciseId) {
      path += `/${options.exerciseId}`;
    }
    
    path += `/${timestamp}_${sanitizedName}`;
    
    return path;
  }

  /**
   * Generate comprehensive metadata for semantic search
   */
  private generateMetadata(
    userId: string,
    originalName: string,
    fileType: string,
    options?: UploadOptions
  ): Record<string, string> {
    const tags = [
      userId,
      fileType,
      options?.category || '',
      options?.exerciseId || '',
      options?.responseType || '',
      ...(options?.tags || [])
    ].filter(Boolean);

    return {
      userId,
      exerciseId: options?.exerciseId || '',
      exerciseTitle: options?.exerciseTitle || '',
      category: options?.category || '',
      responseType: options?.responseType || '',
      mood: options?.mood || '',
      tags: (options?.tags || []).join(','),
      uploadDate: new Date().toISOString(),
      fileType,
      originalName,
      description: options?.description || '',
      searchTags: tags.join(',')
    };
  }

  /**
   * Determine file type from MIME type or extension
   */
  private getFileType(file: File): string {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) return FILE_TYPES.IMAGE;
    if (mimeType.startsWith('audio/')) return FILE_TYPES.AUDIO;
    if (mimeType.startsWith('video/')) return FILE_TYPES.VIDEO;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FILE_TYPES.DOCUMENT;
    
    // Fallback to extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return FILE_TYPES.IMAGE;
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension || '')) return FILE_TYPES.AUDIO;
    if (['mp4', 'webm', 'avi', 'mov', 'wmv'].includes(extension || '')) return FILE_TYPES.VIDEO;
    
    return FILE_TYPES.DOCUMENT;
  }

  /**
   * Upload a file to user's playbook storage
   */
  async uploadPlaybookAsset(
    file: File,
    options?: UploadOptions
  ): Promise<{ key: string; url: string; metadata: StorageMetadata }> {
    try {
      // Always use Amplify storage (real database and S3)
      const userId = await this.getCurrentUserId();
      const fileType = this.getFileType(file);
      const filePath = this.generateFilePath(userId, STORAGE_PATHS.PLAYBOOK, file.name, options);
      const metadata = this.generateMetadata(userId, file.name, fileType, options);

      await uploadData({
        key: filePath,
        data: file,
        options: {
          metadata,
          contentType: file.type
        }
      }).result;

      // Generate a download URL (this would typically be done when retrieving)
      const downloadResult = await downloadData({
        key: filePath
      }).result;

      return {
        key: filePath,
        url: URL.createObjectURL(await downloadResult.body.blob()),
        metadata: {
          userId,
          exerciseId: options?.exerciseId,
          exerciseTitle: options?.exerciseTitle,
          category: options?.category,
          responseType: options?.responseType,
          mood: options?.mood,
          tags: options?.tags,
          uploadDate: new Date().toISOString(),
          fileType,
          originalName: file.name,
          description: options?.description
        }
      };
    } catch (error) {
      console.error('Error uploading playbook asset:', error);
      throw new Error(`Failed to upload ${file.name}: ${error}`);
    }
  }

  /**
   * Upload a profile asset (avatar, etc.)
   */
  async uploadProfileAsset(file: File): Promise<{ key: string; url: string }> {
    try {
      const userId = await this.getCurrentUserId();
      const fileType = this.getFileType(file);
      const filePath = this.generateFilePath(userId, STORAGE_PATHS.PROFILE, file.name);
      const metadata = this.generateMetadata(userId, file.name, fileType);

      await uploadData({
        key: filePath,
        data: file,
        options: {
          metadata,
          contentType: file.type
        }
      }).result;

      const downloadResult = await downloadData({
        key: filePath
      }).result;

      return {
        key: filePath,
        url: URL.createObjectURL(await downloadResult.body.blob())
      };
    } catch (error) {
      console.error('Error uploading profile asset:', error);
      throw new Error(`Failed to upload profile asset: ${error}`);
    }
  }

  /**
   * List user's playbook assets with filtering
   */
  async listPlaybookAssets(filters?: {
    category?: string;
    exerciseId?: string;
    fileType?: string;
    limit?: number;
  }): Promise<Array<{ key: string; metadata?: StorageMetadata }>> {
    try {
      // Always use Amplify storage
      const userId = await this.getCurrentUserId();
      let prefix = `users/${userId}/${STORAGE_PATHS.PLAYBOOK}/`;
      
      if (filters?.category) {
        prefix += `${filters.category}/`;
      }
      
      if (filters?.exerciseId) {
        prefix += `${filters.exerciseId}/`;
      }

      const result = await list({
        prefix,
        options: {
          listAll: true
        }
      });

      return result.items.map(item => ({
        key: item.key || '',
        metadata: undefined // Metadata would need to be fetched separately
      }));
    } catch (error) {
      console.error('Error listing playbook assets:', error);
      throw new Error(`Failed to list assets: ${error}`);
    }
  }

  /**
   * Get a download URL for an asset
   */
  async getAssetUrl(key: string): Promise<string> {
    try {
      // Always use Amplify storage
      const result = await downloadData({
        key
      }).result;

      return URL.createObjectURL(await result.body.blob());
    } catch (error) {
      console.error('Error getting asset URL:', error);
      throw new Error(`Failed to get asset URL: ${error}`);
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteAsset(key: string): Promise<void> {
    try {
      // Always use Amplify storage

      // Production Amplify storage
      await remove({ key });
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw new Error(`Failed to delete asset: ${error}`);
    }
  }

  /**
   * Enhanced semantic search with scoring and advanced filtering
   */
  async semanticSearch(
    searchTerm: string, 
    options: SemanticSearchOptions = {}
  ): Promise<AssetSearchResult[]> {
    try {
      const allAssets = await this.listPlaybookAssets();
      const searchTermLower = searchTerm.toLowerCase();
      const results: AssetSearchResult[] = [];

      for (const asset of allAssets) {
        if (!asset.metadata) continue;

        // Apply filters first
        if (options.categories && !options.categories.includes(asset.metadata.category || '')) continue;
        if (options.exerciseIds && !options.exerciseIds.includes(asset.metadata.exerciseId || '')) continue;
        if (options.fileTypes && !options.fileTypes.includes(asset.metadata.fileType || '')) continue;
        if (options.mood && asset.metadata.mood !== options.mood) continue;
        if (options.tags && !options.tags.some(tag => {
          if (Array.isArray(asset.metadata.tags)) {
            return asset.metadata.tags.includes(tag);
          } else if (typeof asset.metadata.tags === 'string') {
            return asset.metadata.tags.includes(tag);
          }
          return false;
        })) continue;

        // Date range filter
        if (options.dateRange) {
          const uploadDate = new Date(asset.metadata.uploadDate);
          if (uploadDate < options.dateRange.start || uploadDate > options.dateRange.end) continue;
        }

        // Calculate relevance score
        let score = 0;
        const matchedFields: string[] = [];

        // Search in different fields with different weights
        const searchableFields = [
          { field: 'exerciseTitle', weight: 3, value: asset.metadata.exerciseTitle },
          { field: 'description', weight: 2.5, value: asset.metadata.description },
          { field: 'category', weight: 2, value: asset.metadata.category },
          { field: 'originalName', weight: 2, value: asset.metadata.originalName },
          { field: 'mood', weight: 1.5, value: asset.metadata.mood },
          { field: 'tags', weight: 1.5, value: Array.isArray(asset.metadata.tags) 
            ? asset.metadata.tags.join(' ') 
            : (typeof asset.metadata.tags === 'string' ? asset.metadata.tags : '') }
        ];

        for (const { field, weight, value } of searchableFields) {
          if (value && value.toLowerCase().includes(searchTermLower)) {
            score += weight;
            matchedFields.push(field);
            
            // Boost score for exact matches
            if (value.toLowerCase() === searchTermLower) {
              score += weight * 0.5;
            }
            
            // Boost score for word boundary matches
            if (new RegExp(`\\b${searchTermLower}\\b`).test(value.toLowerCase())) {
              score += weight * 0.3;
            }
          }
        }

        if (score > 0) {
          const url = await this.getAssetUrl(asset.key);
          results.push({
            key: asset.key,
            url,
            metadata: asset.metadata,
            score,
            matchedFields
          });
        }
      }

      // Sort results
      const sortBy = options.sortBy || 'relevance';
      results.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.metadata.uploadDate).getTime() - new Date(a.metadata.uploadDate).getTime();
          case 'category':
            return (a.metadata.category || '').localeCompare(b.metadata.category || '');
          case 'type':
            return (a.metadata.fileType || '').localeCompare(b.metadata.fileType || '');
          case 'relevance':
          default:
            return b.score - a.score;
        }
      });

      // Apply limit
      if (options.limit) {
        return results.slice(0, options.limit);
      }

      return results;
    } catch (error) {
      console.error('Error in semantic search:', error);
      throw new Error(`Failed to search assets: ${error}`);
    }
  }

  /**
   * Search assets by metadata tags (legacy method for backward compatibility)
   */
  async searchAssets(searchTerm: string): Promise<Array<{ key: string; metadata?: StorageMetadata }>> {
    const results = await this.semanticSearch(searchTerm);
    return results.map(result => ({
      key: result.key,
      metadata: result.metadata
    }));
  }

  /**
   * Get assets by exercise ID
   */
  async getExerciseAssets(exerciseId: string): Promise<Array<{ key: string; url: string; metadata?: StorageMetadata }>> {
    try {
      const assets = await this.listPlaybookAssets({ exerciseId });
      
      const assetsWithUrls = await Promise.all(
        assets.map(async (asset) => ({
          ...asset,
          url: await this.getAssetUrl(asset.key)
        }))
      );
      
      return assetsWithUrls;
    } catch (error) {
      console.error('Error getting exercise assets:', error);
      throw new Error(`Failed to get exercise assets: ${error}`);
    }
  }

  /**
   * Get assets by category
   */
  async getCategoryAssets(category: string): Promise<Array<{ key: string; url: string; metadata?: StorageMetadata }>> {
    try {
      const assets = await this.listPlaybookAssets({ category });
      
      const assetsWithUrls = await Promise.all(
        assets.map(async (asset) => ({
          ...asset,
          url: await this.getAssetUrl(asset.key)
        }))
      );
      
      return assetsWithUrls;
    } catch (error) {
      console.error('Error getting category assets:', error);
      throw new Error(`Failed to get category assets: ${error}`);
    }
  }

  /**
   * Get asset statistics for dashboard/insights
   */
  async getAssetStats(): Promise<{
    totalAssets: number;
    assetsByType: Record<string, number>;
    assetsByCategory: Record<string, number>;
    recentAssets: Array<{ key: string; url: string; metadata: StorageMetadata }>;
  }> {
    try {
      const allAssets = await this.listPlaybookAssets();
      const stats = {
        totalAssets: allAssets.length,
        assetsByType: {} as Record<string, number>,
        assetsByCategory: {} as Record<string, number>,
        recentAssets: [] as Array<{ key: string; url: string; metadata: StorageMetadata }>
      };

      const assetsWithMetadata = await Promise.all(
        allAssets.slice(0, 20).map(async (asset) => {
          const url = await this.getAssetUrl(asset.key);
          return { ...asset, url };
        })
      );

      // Calculate statistics
      for (const asset of assetsWithMetadata) {
        if (asset.metadata) {
          // Count by type
          const type = asset.metadata.fileType || 'unknown';
          stats.assetsByType[type] = (stats.assetsByType[type] || 0) + 1;

          // Count by category
          const category = asset.metadata.category || 'uncategorized';
          stats.assetsByCategory[category] = (stats.assetsByCategory[category] || 0) + 1;
        }
      }

      // Get recent assets (sorted by upload date)
      stats.recentAssets = assetsWithMetadata
        .filter(asset => asset.metadata)
        .sort((a, b) => new Date(b.metadata!.uploadDate).getTime() - new Date(a.metadata!.uploadDate).getTime())
        .slice(0, 10) as Array<{ key: string; url: string; metadata: StorageMetadata }>;

      return stats;
    } catch (error) {
      console.error('Error getting asset stats:', error);
      throw new Error(`Failed to get asset statistics: ${error}`);
    }
  }

  /**
   * Bulk operations for asset management
   */
  async bulkDeleteAssets(keys: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      try {
        await this.deleteAsset(key);
        succeeded.push(key);
      } catch (error) {
        console.error(`Failed to delete asset ${key}:`, error);
        failed.push(key);
      }
    }

    return { succeeded, failed };
  }

  /**
   * Update asset metadata (tags, description, etc.)
   */
  async updateAssetMetadata(key: string, updates: Partial<StorageMetadata>): Promise<void> {
    try {
      // Note: S3 doesn't support metadata updates directly
      // This would require re-uploading the file with new metadata
      // For now, we'll just log the intent
      console.log(`[STORAGE] Update metadata for ${key}:`, updates);
      
      // In a real implementation, you might:
      // 1. Download the current file
      // 2. Re-upload with new metadata
      // 3. Delete the old file
      
      throw new Error('Metadata updates not implemented yet - requires file re-upload');
    } catch (error) {
      console.error('Error updating asset metadata:', error);
      throw new Error(`Failed to update metadata: ${error}`);
    }
  }
}

export const storageService = new StorageService(); 