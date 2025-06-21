'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserRole } from '@/hooks/useUserRole';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

interface ExerciseEditorProps {
  exerciseId?: string;
  onSave?: (exercise: unknown) => void;
  onCancel?: () => void;
}

interface MediaAsset {
  id: string;
  fileName: string;
  fileType: string;
  s3Key: string;
  description?: string;
}

export default function ExerciseEditor({ exerciseId, onSave, onCancel }: ExerciseEditorProps) {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const { isAdmin } = useUserRole();
  const [exercise, setExercise] = useState<{
    title: string;
    description: string;
    category: 'mindset' | 'motivation' | 'goals' | 'reflection' | 'gratitude' | 'vision';
    question: string;
    instructions: string;
    // Required response types
    requireText: boolean;
    requireImage: boolean;
    requireAudio: boolean;
    requireVideo: boolean;
    requireDocument: boolean;
    // Optional configurations
    textPrompt: string;
    maxTextLength: number | null;
    allowMultipleImages: boolean;
    allowMultipleDocuments: boolean;
    allowEditingCompleted: boolean;
    isActive: boolean;
  }>({
    title: '',
    description: '',
    category: 'mindset',
    question: '',
    instructions: '',
    requireText: false,
    requireImage: false,
    requireAudio: false,
    requireVideo: false,
    requireDocument: false,
    textPrompt: '',
    maxTextLength: null,
    allowMultipleImages: false,
    allowMultipleDocuments: false,
    allowEditingCompleted: false,
    isActive: true,
  });
  
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!exerciseId;

  const loadExercise = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await client.models.Exercise.get({ id: exerciseId });
      if (data) {
        setExercise({
          title: data.title || '',
          description: data.description || '',
          category: (data.category as 'mindset' | 'motivation' | 'goals' | 'reflection' | 'gratitude' | 'vision') || 'mindset',
          question: data.question || '',
          instructions: data.instructions || '',
          requireText: data.requireText ?? false,
          requireImage: data.requireImage ?? false,
          requireAudio: data.requireAudio ?? false,
          requireVideo: data.requireVideo ?? false,
          requireDocument: data.requireDocument ?? false,
          textPrompt: data.textPrompt ?? '',
          maxTextLength: data.maxTextLength || null,
          allowMultipleImages: data.allowMultipleImages ?? false,
          allowMultipleDocuments: data.allowMultipleDocuments ?? false,
          allowEditingCompleted: data.allowEditingCompleted ?? false,
          isActive: data.isActive ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      setError('Failed to load exercise');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  const loadMediaAssets = useCallback(async () => {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/media`);
      if (response.ok) {
        const assets = await response.json();
        setMediaAssets(assets);
      }
    } catch (error) {
      console.error('Error loading media assets:', error);
    }
  }, [exerciseId]);

  // Load exercise data if editing
  useEffect(() => {
    if (exerciseId) {
      loadExercise();
      loadMediaAssets();
    }
  }, [exerciseId, loadExercise, loadMediaAssets]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate that at least one response type is required
      const hasRequiredType = exercise.requireText || exercise.requireImage || 
                             exercise.requireAudio || exercise.requireVideo || 
                             exercise.requireDocument;
      
      if (!hasRequiredType) {
        setError('Please select at least one required response type.');
        setIsLoading(false);
        return;
      }

      if (isEditing) {
        // Update existing exercise
        const updateData = {
          title: exercise.title,
          description: exercise.description,
          category: exercise.category,
          question: exercise.question,
          instructions: exercise.instructions,
          requireText: exercise.requireText,
          requireImage: exercise.requireImage,
          requireAudio: exercise.requireAudio,
          requireVideo: exercise.requireVideo,
          requireDocument: exercise.requireDocument,
          textPrompt: exercise.textPrompt || null,
          maxTextLength: exercise.maxTextLength,
          allowMultipleImages: exercise.allowMultipleImages,
          allowMultipleDocuments: exercise.allowMultipleDocuments,
          allowEditingCompleted: exercise.allowEditingCompleted,
          isActive: exercise.isActive,
        };

        try {
          const updatedExercise = await client.models.Exercise.update({
            id: exerciseId,
            ...updateData,
          });
          onSave?.(updatedExercise);
        } catch (amplifyError) {
          console.warn('Amplify update failed, trying API route:', amplifyError);
          // Fallback to API route
          const response = await fetch(`/api/exercises/${exerciseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });
          
          if (!response.ok) {
            throw new Error(`API update failed: ${response.status}`);
          }
          
          const updatedExercise = await response.json();
          onSave?.(updatedExercise);
        }
      } else {
        // Create new exercise
        try {
          // Only send fields that exist in the current deployed schema
          const exerciseData = {
            title: exercise.title,
            description: exercise.description,
            category: exercise.category,
            question: exercise.question,
            instructions: exercise.instructions,
            requireText: exercise.requireText,
            requireImage: exercise.requireImage,
            requireAudio: exercise.requireAudio,
            requireVideo: exercise.requireVideo,
            requireDocument: exercise.requireDocument,
            textPrompt: exercise.textPrompt,
            maxTextLength: exercise.maxTextLength,
            allowMultipleImages: exercise.allowMultipleImages,
            allowMultipleDocuments: exercise.allowMultipleDocuments,
            allowEditingCompleted: exercise.allowEditingCompleted,
            isActive: exercise.isActive,
            createdBy: user?.userId || user?.username
          };
          const newExercise = await client.models.Exercise.create(exerciseData);
          onSave?.(newExercise);
        } catch (amplifyError) {
          console.warn('Amplify create failed, trying API route:', amplifyError);
          // Fallback to API route
          const response = await fetch('/api/exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exercise),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API create failed: ${response.status} - ${errorText}`);
          }
          
          const newExercise = await response.json();
          onSave?.(newExercise);
        }
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      setError(`Failed to save exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (authStatus !== 'authenticated' || !user || !exerciseId) return;

    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${file.name}`;
      setUploadingFiles(prev => [...prev, fileId]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/exercises/${exerciseId}/media`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newAsset = await response.json();
          // Handle both direct response and nested data response
          const assetData = newAsset.data || newAsset;
          if (assetData.id && assetData.s3Key) {
            setMediaAssets(prev => [...prev, {
              id: assetData.id,
              fileName: assetData.fileName || file.name,
              fileType: assetData.fileType || file.type,
              s3Key: assetData.s3Key,
              description: assetData.description || '',
            }]);
          } else {
            throw new Error('Invalid response data from server');
          }
        } else {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setError(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(id => id !== fileId));
      }
    }
  };

  const handleDeleteMedia = async (assetId: string) => {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/media/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMediaAssets(prev => prev.filter(asset => asset.id !== assetId));
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      setError('Failed to delete media');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.startsWith('text/') || fileType.includes('txt')) return '📝';
    if (fileType.includes('csv') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('doc') || fileType.includes('word')) return '📄';
    return '📎';
  };

  // Check admin permissions for creating/editing exercise templates
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">
            Only administrators can {isEditing ? 'edit exercise templates' : 'create new exercises'}.
          </p>
          <p className="text-gray-500 mb-6 text-sm">
            Looking to complete an exercise? Visit the exercises page to find available exercises.
          </p>
          <button
            onClick={onCancel}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Exercises
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Exercise Template' : 'Create New Exercise Template'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing 
            ? 'Update the exercise template that all users will see and complete' 
            : 'Create a new exercise template with questions, instructions, and required response types'
          }
        </p>
        <div className="mt-3 p-3 bg-blue-50 rounded-md">
          <p className="text-blue-800 text-sm">
            <strong>Admin Note:</strong> Configure what response types users must provide when completing this exercise.
            Users will only see the fields you mark as required.
          </p>
          {isEditing && (
            <p className="text-amber-700 text-sm mt-2">
              <strong>⚠️ Editing Warning:</strong> Changes to required response types may affect users who have already started this exercise.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Exercise Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={exercise.title}
              onChange={(e) => setExercise(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter exercise title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={exercise.category}
              onChange={(e) => setExercise(prev => ({ ...prev, category: e.target.value as typeof exercise.category }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mindset">Mindset</option>
              <option value="motivation">Motivation</option>
              <option value="goals">Goals</option>
              <option value="reflection">Reflection</option>
              <option value="gratitude">Gratitude</option>
              <option value="vision">Vision</option>
            </select>
          </div>
        </div>

        {/* Description/Narrative */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Narrative)
          </label>
          <textarea
            value={exercise.description}
            onChange={(e) => setExercise(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the exercise description and narrative..."
          />
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question
          </label>
          <input
            type="text"
            value={exercise.question}
            onChange={(e) => setExercise(prev => ({ ...prev, question: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the exercise question"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions for Users
          </label>
          <textarea
            value={exercise.instructions}
            onChange={(e) => setExercise(prev => ({ ...prev, instructions: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter detailed instructions for users on how to complete this exercise..."
          />
          <p className="text-sm text-gray-500 mt-1">
            These instructions will be shown to users before they start the exercise
          </p>
        </div>

        {/* Required Response Types */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Required Response Types</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select what types of responses users must provide to complete this exercise. Users will only see the fields you mark as required.
          </p>
          
          <div className="space-y-4">
            {/* Text Response */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="requireText"
                checked={exercise.requireText}
                onChange={(e) => setExercise(prev => ({ ...prev, requireText: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="requireText" className="text-sm font-medium text-gray-700">
                  📝 Text Response
                </label>
                <p className="text-sm text-gray-500">Users must enter a text response</p>
                {exercise.requireText && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={exercise.textPrompt}
                      onChange={(e) => setExercise(prev => ({ ...prev, textPrompt: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Custom prompt for text input (optional)"
                    />
                    <input
                      type="number"
                      value={exercise.maxTextLength || ''}
                      onChange={(e) => setExercise(prev => ({ ...prev, maxTextLength: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Max characters"
                      min="1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Image Response */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="requireImage"
                checked={exercise.requireImage}
                onChange={(e) => setExercise(prev => ({ ...prev, requireImage: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="requireImage" className="text-sm font-medium text-gray-700">
                  🖼️ Image Upload
                </label>
                <p className="text-sm text-gray-500">Users must upload at least one image</p>
                {exercise.requireImage && (
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={exercise.allowMultipleImages}
                        onChange={(e) => setExercise(prev => ({ ...prev, allowMultipleImages: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow multiple images</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Response */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="requireAudio"
                checked={exercise.requireAudio}
                onChange={(e) => setExercise(prev => ({ ...prev, requireAudio: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="requireAudio" className="text-sm font-medium text-gray-700">
                  🎵 Audio Recording
                </label>
                <p className="text-sm text-gray-500">Users must record or upload an audio file</p>
              </div>
            </div>

            {/* Video Response */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="requireVideo"
                checked={exercise.requireVideo}
                onChange={(e) => setExercise(prev => ({ ...prev, requireVideo: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="requireVideo" className="text-sm font-medium text-gray-700">
                  🎥 Video Recording
                </label>
                <p className="text-sm text-gray-500">Users must record or upload a video file</p>
              </div>
            </div>

            {/* Document Response */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="requireDocument"
                checked={exercise.requireDocument}
                onChange={(e) => setExercise(prev => ({ ...prev, requireDocument: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="requireDocument" className="text-sm font-medium text-gray-700">
                  📄 Document Upload
                </label>
                <p className="text-sm text-gray-500">Users must upload a document (PDF, DOC, TXT, etc.)</p>
                {exercise.requireDocument && (
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={exercise.allowMultipleDocuments}
                        onChange={(e) => setExercise(prev => ({ ...prev, allowMultipleDocuments: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow multiple documents</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={exercise.isActive ? 'active' : 'inactive'}
            onChange={(e) => setExercise(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Inactive exercises are hidden from users
          </p>
        </div>

        {/* Allow Editing Completed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Editing Permissions
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={exercise.allowEditingCompleted}
              onChange={(e) => setExercise(prev => ({ ...prev, allowEditingCompleted: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Allow users to edit completed exercises</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, users can continue editing their responses even after completing the exercise
          </p>
        </div>

        {/* Media Assets (only show if editing) */}
        {isEditing && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Template Media Assets</h3>
            <p className="text-sm text-gray-600 mb-4">
              These are template assets shown to users as part of the exercise instructions (not user responses).
            </p>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Template Media Files
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept="image/*,audio/*,video/*,.txt,.csv,.pdf,.doc,.docx"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported: Images (PNG, JPG, GIF), Audio (MP3, WAV), Video (MP4, MOV), Text files (TXT), CSV, PDF, Documents (DOC, DOCX)
              </p>
            </div>

            {/* Uploading Files */}
            {uploadingFiles.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploading...</h4>
                {uploadingFiles.map(fileId => (
                  <div key={fileId} className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading file...</span>
                  </div>
                ))}
              </div>
            )}

            {/* Media Assets List */}
            {mediaAssets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Current Template Media Assets</h4>
                {mediaAssets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(asset.fileType)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{asset.fileName}</p>
                        <p className="text-xs text-gray-500">{asset.fileType}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(asset.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Exercise' : 'Create Exercise')}
          </button>
        </div>
      </div>
    </div>
  );
} 