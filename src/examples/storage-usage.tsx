/**
 * Example usage of the S3 Storage Service for North Playbook
 * 
 * This file demonstrates how to use the storage service to:
 * 1. Upload files with proper metadata and folder structure
 * 2. Retrieve files by category, exercise, or search terms
 * 3. Manage user assets with proper naming conventions
 */

import React, { useState } from 'react';
import { storageService, EXERCISE_CATEGORIES } from '@/lib/storage-service';
import ImageUpload from '@/components/media/ImageUpload';

export default function StorageUsageExample() {
  const [images, setImages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Example 1: Upload an image for a specific exercise
  const handleExerciseImageUpload = async (file: File) => {
    try {
      const result = await storageService.uploadPlaybookAsset(file, {
        exerciseId: 'mindset-001',
        exerciseTitle: 'Daily Affirmations',
        category: EXERCISE_CATEGORIES.MINDSET,
        responseType: 'text',
        mood: 'positive',
        tags: ['affirmations', 'morning-routine', 'self-love'],
        description: 'Visual representation of my daily affirmations'
      });

      console.log('Upload successful:', result);
      // File will be stored at: users/{userId}/playbook/mindset/mindset-001/{timestamp}_{filename}
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Example 2: Search for assets by keyword
  const searchAssets = async (searchTerm: string) => {
    try {
      const results = await storageService.searchAssets(searchTerm);
      setSearchResults(results);
      console.log('Search results:', results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Example 3: Get all assets for a specific category
  const getCategoryAssets = async (category: string) => {
    try {
      const assets = await storageService.getCategoryAssets(category);
      console.log(`Assets for ${category}:`, assets);
      return assets;
    } catch (error) {
      console.error('Failed to get category assets:', error);
    }
  };

  // Example 4: Get all assets for a specific exercise
  const getExerciseAssets = async (exerciseId: string) => {
    try {
      const assets = await storageService.getExerciseAssets(exerciseId);
      console.log(`Assets for exercise ${exerciseId}:`, assets);
      return assets;
    } catch (error) {
      console.error('Failed to get exercise assets:', error);
    }
  };

  return (
    <div>
      <h2>S3 Storage Service Usage Examples</h2>
      
      {/* Example of using ImageUpload with storage service */}
      <ImageUpload
        images={images}
        onImagesChange={setImages}
        exerciseId="mindset-001"
        exerciseTitle="Daily Affirmations"
        category={EXERCISE_CATEGORIES.MINDSET}
        responseType="text"
        mood="positive"
        tags={['affirmations', 'morning-routine']}
      />
    </div>
  );
}

/**
 * FOLDER STRUCTURE EXAMPLES:
 * 
 * users/
 * ├── {userId}/
 * │   ├── playbook/
 * │   │   ├── mindset/
 * │   │   │   ├── mindset-001/
 * │   │   │   │   ├── 2024-01-15T10-30-00-000Z_affirmation_photo.jpg
 * │   │   │   │   └── 2024-01-15T14-20-00-000Z_vision_board.png
 * │   │   │   └── mindset-002/
 * │   │   │       └── 2024-01-16T09-15-00-000Z_meditation_space.jpg
 * │   │   ├── goals/
 * │   │   │   ├── goals-001/
 * │   │   │   │   └── 2024-01-15T16-45-00-000Z_goal_chart.pdf
 * │   │   │   └── goals-002/
 * │   │   │       └── 2024-01-17T11-30-00-000Z_progress_photo.jpg
 * │   │   └── gratitude/
 * │   │       └── gratitude-001/
 * │   │           └── 2024-01-18T08-00-00-000Z_gratitude_journal.jpg
 * │   ├── profile/
 * │   │   ├── 2024-01-15T12-00-00-000Z_avatar.jpg
 * │   │   └── 2024-01-20T14-30-00-000Z_cover_photo.jpg
 * │   └── temp/
 * │       └── 2024-01-21T10-15-00-000Z_processing_image.jpg
 * 
 * METADATA STRUCTURE:
 * Each file includes comprehensive metadata for fast retrieval:
 * {
 *   userId: "user123",
 *   exerciseId: "mindset-001",
 *   exerciseTitle: "Daily Affirmations",
 *   category: "mindset",
 *   responseType: "text",
 *   mood: "positive",
 *   tags: "affirmations,morning-routine,self-love",
 *   uploadDate: "2024-01-15T10:30:00.000Z",
 *   fileType: "image",
 *   originalName: "affirmation_photo.jpg",
 *   description: "Visual representation of my daily affirmations",
 *   searchTags: "user123,image,mindset,mindset-001,text,affirmations,morning-routine,self-love"
 * }
 * 
 * NAMING CONVENTION:
 * Format: {timestamp}_{sanitized_original_name}
 * - timestamp: ISO string with special characters replaced (2024-01-15T10-30-00-000Z)
 * - sanitized_name: Original filename with special characters replaced by underscores
 * 
 * BENEFITS:
 * 1. Fast retrieval by category, exercise, or user
 * 2. Searchable metadata for content discovery
 * 3. Organized folder structure for easy management
 * 4. Unique naming prevents conflicts
 * 5. Comprehensive tagging for filtering
 * 6. User isolation for security and privacy
 */ 