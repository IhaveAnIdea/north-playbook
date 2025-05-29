# S3 Storage Service for North Playbook

This guide explains how to use the S3 storage service to store and manage user playbook assets with proper folder structure, naming conventions, and metadata tagging for fast retrieval.

## Overview

The storage service provides a comprehensive solution for managing user assets in AWS S3 with:
- **User-specific folders** for privacy and organization
- **Standardized naming conventions** to prevent conflicts
- **Rich metadata tagging** for fast search and retrieval
- **Category-based organization** for easy browsing
- **Exercise-specific grouping** for contextual access

## Folder Structure

```
users/
├── {userId}/
│   ├── playbook/                    # User's playbook assets
│   │   ├── mindset/                 # Category-based folders
│   │   │   ├── mindset-001/         # Exercise-specific folders
│   │   │   │   ├── 2024-01-15T10-30-00-000Z_affirmation_photo.jpg
│   │   │   │   └── 2024-01-15T14-20-00-000Z_vision_board.png
│   │   │   └── mindset-002/
│   │   │       └── 2024-01-16T09-15-00-000Z_meditation_space.jpg
│   │   ├── goals/
│   │   │   ├── goals-001/
│   │   │   │   └── 2024-01-15T16-45-00-000Z_goal_chart.pdf
│   │   │   └── goals-002/
│   │   │       └── 2024-01-17T11-30-00-000Z_progress_photo.jpg
│   │   ├── motivation/
│   │   ├── reflection/
│   │   ├── gratitude/
│   │   └── vision/
│   ├── profile/                     # User profile assets
│   │   ├── 2024-01-15T12-00-00-000Z_avatar.jpg
│   │   └── 2024-01-20T14-30-00-000Z_cover_photo.jpg
│   └── temp/                        # Temporary uploads
│       └── 2024-01-21T10-15-00-000Z_processing_image.jpg
```

## Naming Convention

**Format:** `{timestamp}_{sanitized_original_name}`

- **Timestamp:** ISO string with special characters replaced (e.g., `2024-01-15T10-30-00-000Z`)
- **Sanitized Name:** Original filename with special characters replaced by underscores

**Examples:**
- `my photo.jpg` → `2024-01-15T10-30-00-000Z_my_photo.jpg`
- `goal-chart (v2).pdf` → `2024-01-15T16-45-00-000Z_goal-chart__v2_.pdf`

## Metadata Structure

Each file includes comprehensive metadata for fast retrieval:

```json
{
  "userId": "user123",
  "exerciseId": "mindset-001",
  "exerciseTitle": "Daily Affirmations",
  "category": "mindset",
  "responseType": "text",
  "mood": "positive",
  "tags": "affirmations,morning-routine,self-love",
  "uploadDate": "2024-01-15T10:30:00.000Z",
  "fileType": "image",
  "originalName": "affirmation_photo.jpg",
  "description": "Visual representation of my daily affirmations",
  "searchTags": "user123,image,mindset,mindset-001,text,affirmations,morning-routine,self-love"
}
```

## Usage Examples

### 1. Upload a Playbook Asset

```typescript
import { storageService, EXERCISE_CATEGORIES } from '@/lib/storage-service';

const uploadImage = async (file: File) => {
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
    // File stored at: users/{userId}/playbook/mindset/mindset-001/{timestamp}_{filename}
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### 2. Search Assets by Keyword

```typescript
const searchAssets = async (searchTerm: string) => {
  try {
    const results = await storageService.searchAssets(searchTerm);
    console.log('Search results:', results);
  } catch (error) {
    console.error('Search failed:', error);
  }
};

// Search for all assets containing "affirmations"
await searchAssets('affirmations');
```

### 3. Get Assets by Category

```typescript
const getCategoryAssets = async () => {
  try {
    const mindsetAssets = await storageService.getCategoryAssets('mindset');
    console.log('Mindset assets:', mindsetAssets);
  } catch (error) {
    console.error('Failed to get category assets:', error);
  }
};
```

### 4. Get Assets by Exercise

```typescript
const getExerciseAssets = async () => {
  try {
    const exerciseAssets = await storageService.getExerciseAssets('mindset-001');
    console.log('Exercise assets:', exerciseAssets);
  } catch (error) {
    console.error('Failed to get exercise assets:', error);
  }
};
```

### 5. Using with ImageUpload Component

```typescript
import ImageUpload from '@/components/media/ImageUpload';

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
```

## Storage Service API

### Core Methods

#### `uploadPlaybookAsset(file: File, options?: UploadOptions)`
Uploads a file to the user's playbook storage with metadata.

**Parameters:**
- `file`: The file to upload
- `options`: Upload options including exercise info, category, tags, etc.

**Returns:** `{ key: string; url: string; metadata: StorageMetadata }`

#### `uploadProfileAsset(file: File)`
Uploads a profile asset (avatar, cover photo, etc.).

#### `listPlaybookAssets(filters?: FilterOptions)`
Lists user's playbook assets with optional filtering.

#### `searchAssets(searchTerm: string)`
Searches assets by metadata tags and content.

#### `getExerciseAssets(exerciseId: string)`
Gets all assets for a specific exercise.

#### `getCategoryAssets(category: string)`
Gets all assets for a specific category.

#### `deleteAsset(key: string)`
Deletes an asset from storage.

### Types

```typescript
interface UploadOptions {
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  responseType?: 'text' | 'audio' | 'video';
  mood?: string;
  tags?: string[];
  description?: string;
}

interface StorageMetadata {
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
```

## Benefits

1. **Fast Retrieval**: Organized folder structure and metadata enable quick asset discovery
2. **Searchable Content**: Rich metadata makes assets searchable by multiple criteria
3. **User Privacy**: User-specific folders ensure data isolation
4. **Conflict Prevention**: Timestamp-based naming prevents filename conflicts
5. **Contextual Organization**: Category and exercise-based grouping for logical access
6. **Scalable Architecture**: Structure supports growth and additional asset types

## Security Features

- **User Isolation**: Each user's assets are stored in separate folders
- **Access Control**: Amplify storage rules ensure users can only access their own assets
- **Metadata Validation**: Server-side validation of metadata fields
- **File Type Validation**: Automatic file type detection and validation

## Performance Optimizations

- **Prefix-based Listing**: Efficient S3 prefix queries for category/exercise filtering
- **Metadata Caching**: Client-side caching of frequently accessed metadata
- **Lazy Loading**: Assets loaded on-demand to reduce initial load times
- **Batch Operations**: Support for bulk uploads and deletions

## Deployment Notes

1. **Amplify Storage**: Ensure storage is properly configured in `amplify/storage/resource.ts`
2. **IAM Permissions**: Verify user permissions for S3 operations
3. **CORS Configuration**: Configure CORS for web uploads
4. **Monitoring**: Set up CloudWatch monitoring for storage operations

## Future Enhancements

- **Image Optimization**: Automatic image resizing and format optimization
- **CDN Integration**: CloudFront distribution for faster asset delivery
- **Backup Strategy**: Automated backups and versioning
- **Analytics**: Usage analytics and storage metrics
- **Bulk Operations**: Enhanced bulk upload/download capabilities 