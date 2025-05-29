import { uploadData, downloadData, remove, list } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { devStorageService } from './dev-storage-service';

// Check if we're in development mode and Amplify is not configured
const isDevelopment = process.env.NODE_ENV === 'development';
const isAmplifyConfigured = () => {
  try {
    // Check if we have a real bucket name (not placeholder)
    if (typeof window !== 'undefined') {
      const amplifyConfig = (window as any).aws_amplify_config;
      return amplifyConfig && 
             amplifyConfig.storage && 
             amplifyConfig.storage.bucket_name && 
             amplifyConfig.storage.bucket_name !== 'placeholder';
    }
    return false;
  } catch {
    return false;
  }
};

// Mock storage for development
class MockStorageService {
  private mockFiles = new Map<string, { file: File; metadata: any }>();

  async uploadFile(key: string, file: File, metadata: any): Promise<{ key: string; url: string }> {
    // Create a blob URL for the file
    const url = URL.createObjectURL(file);
    this.mockFiles.set(key, { file, metadata });
    
    console.log(`[MOCK STORAGE] Uploaded file: ${key}`, { metadata });
    
    return { key, url };
  }

  async deleteFile(key: string): Promise<void> {
    const fileData = this.mockFiles.get(key);
    if (fileData) {
      URL.revokeObjectURL(fileData.file.name);
      this.mockFiles.delete(key);
      console.log(`[MOCK STORAGE] Deleted file: ${key}`);
    }
  }

  async listFiles(): Promise<Array<{ key: string; metadata?: any }>> {
    return Array.from(this.mockFiles.entries()).map(([key, data]) => ({
      key,
      metadata: data.metadata
    }));
  }
}

const mockStorage = new MockStorageService();

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
  MINDSET: 'mindset',
  MOTIVATION: 'motivation',
  GOALS: 'goals',
  REFLECTION: 'reflection',
  GRATITUDE: 'gratitude',
  VISION: 'vision'
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
  private async getCurrentUserId(): Promise<string> {
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch {
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
   * Generate comprehensive metadata for the file
   */
  private generateMetadata(
    userId: string,
    originalName: string,
    fileType: string,
    options?: UploadOptions
  ): Record<string, string> {
    const metadata: Record<string, string> = {
      userId,
      uploadDate: new Date().toISOString(),
      fileType,
      originalName,
      // Add searchable tags
      searchTags: [
        userId,
        fileType,
        options?.category || '',
        options?.exerciseId || '',
        options?.responseType || '',
        ...(options?.tags || [])
      ].filter(Boolean).join(',')
    };

    if (options?.exerciseId) metadata.exerciseId = options.exerciseId;
    if (options?.exerciseTitle) metadata.exerciseTitle = options.exerciseTitle;
    if (options?.category) metadata.category = options.category;
    if (options?.responseType) metadata.responseType = options.responseType;
    if (options?.mood) metadata.mood = options.mood;
    if (options?.description) metadata.description = options.description;
    if (options?.tags?.length) metadata.tags = options.tags.join(',');

    return metadata;
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
      // Use mock storage in development when Amplify is not configured
      if (isDevelopment && !isAmplifyConfigured()) {
        console.log('[DEV MODE] Using mock storage for file upload');
        
        const userId = 'dev-user-id'; // Mock user ID for development
        const fileType = this.getFileType(file);
        const filePath = this.generateFilePath(userId, STORAGE_PATHS.PLAYBOOK, file.name, options);
        const metadata = this.generateMetadata(userId, file.name, fileType, options);

        const result = await devStorageService.uploadFile(filePath, file, metadata);
        
        return {
          key: result.key,
          url: result.url,
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
      }

      // Production Amplify storage
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
      // Use mock storage in development when Amplify is not configured
      if (isDevelopment && !isAmplifyConfigured()) {
        console.log('[DEV MODE] Using mock storage for file deletion');
        await devStorageService.deleteFile(key);
        return;
      }

      // Production Amplify storage
      await remove({ key });
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw new Error(`Failed to delete asset: ${error}`);
    }
  }

  /**
   * Search assets by metadata tags
   */
  async searchAssets(searchTerm: string): Promise<Array<{ key: string; metadata?: StorageMetadata }>> {
    try {
      const allAssets = await this.listPlaybookAssets();
      
      const searchTermLower = searchTerm.toLowerCase();
      
      return allAssets.filter(asset => {
        if (!asset.metadata) return false;
        
        const searchableText = [
          asset.metadata.exerciseTitle,
          asset.metadata.category,
          asset.metadata.mood,
          asset.metadata.description,
          asset.metadata.originalName,
          ...(asset.metadata.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTermLower);
      });
    } catch (error) {
      console.error('Error searching assets:', error);
      throw new Error(`Failed to search assets: ${error}`);
    }
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
}

export const storageService = new StorageService(); 