'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserRole } from '@/hooks/useUserRole';
import RichTextEditor from '@/components/ui/RichTextEditor';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

// Helper function to convert boolean values to enum values for backward compatibility
const convertBooleanToEnum = (value: any): RequirementType => {
  if (typeof value === 'boolean') {
    return value ? 'required' : 'not_required';
  }
  if (typeof value === 'string' && ['not_required', 'required', 'or'].includes(value)) {
    return value as RequirementType;
  }
  return 'not_required';
};

type RequirementType = 'not_required' | 'required' | 'or';

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
    category: string;
    question: string;
    instructions: string;
    // Required response types
    requireText: RequirementType;
    requireImage: RequirementType;
    requireAudio: RequirementType;
    requireVideo: RequirementType;
    requireDocument: RequirementType;
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
    category: 'achievement_based_identity',
    question: '',
    instructions: '',
    requireText: 'not_required',
    requireImage: 'not_required',
    requireAudio: 'not_required',
    requireVideo: 'not_required',
    requireDocument: 'not_required',
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
          category: data.category || 'achievement_based_identity',
          question: data.question || '',
          instructions: data.instructions || '',
          requireText: convertBooleanToEnum(data.requireText) ?? 'not_required',
          requireImage: convertBooleanToEnum(data.requireImage) ?? 'not_required',
          requireAudio: convertBooleanToEnum(data.requireAudio) ?? 'not_required',
          requireVideo: convertBooleanToEnum(data.requireVideo) ?? 'not_required',
          requireDocument: convertBooleanToEnum(data.requireDocument) ?? 'not_required',
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

      // Count OR and required types
      const orTypes = [
        exercise.requireText === 'or',
        exercise.requireImage === 'or', 
        exercise.requireAudio === 'or',
        exercise.requireVideo === 'or',
        exercise.requireDocument === 'or'
      ].filter(Boolean).length;

      const requiredTypes = [
        exercise.requireText === 'required',
        exercise.requireImage === 'required',
        exercise.requireAudio === 'required', 
        exercise.requireVideo === 'required',
        exercise.requireDocument === 'required'
      ].filter(Boolean).length;

      // If only one OR type is selected, treat it as required
      const finalExercise = { ...exercise };
      if (orTypes === 1 && requiredTypes === 0) {
        if (exercise.requireText === 'or') finalExercise.requireText = 'required';
        if (exercise.requireImage === 'or') finalExercise.requireImage = 'required';
        if (exercise.requireAudio === 'or') finalExercise.requireAudio = 'required';
        if (exercise.requireVideo === 'or') finalExercise.requireVideo = 'required';
        if (exercise.requireDocument === 'or') finalExercise.requireDocument = 'required';
      }

      // Validate that at least one response type is required or OR
      const hasRequiredType = finalExercise.requireText !== 'not_required' || 
                             finalExercise.requireImage !== 'not_required' || 
                             finalExercise.requireAudio !== 'not_required' || 
                             finalExercise.requireVideo !== 'not_required' || 
                             finalExercise.requireDocument !== 'not_required';
      
      if (!hasRequiredType) {
        setError('Please select at least one response type as required or OR.');
        setIsLoading(false);
        return;
      }

      if (isEditing) {
        // Update existing exercise with enum values
        const updateData = {
          title: finalExercise.title,
          description: finalExercise.description,
          category: finalExercise.category,
          question: finalExercise.question,
          instructions: finalExercise.instructions,
          requireText: finalExercise.requireText,
          requireImage: finalExercise.requireImage,
          requireAudio: finalExercise.requireAudio,
          requireVideo: finalExercise.requireVideo,
          requireDocument: finalExercise.requireDocument,
          textPrompt: finalExercise.textPrompt || null,
          maxTextLength: finalExercise.maxTextLength,
          allowMultipleImages: finalExercise.allowMultipleImages,
          allowMultipleDocuments: finalExercise.allowMultipleDocuments,
          allowEditingCompleted: finalExercise.allowEditingCompleted,
          isActive: finalExercise.isActive,
        };

        try {
          console.log('Updating exercise with data:', updateData);
          const updatedExercise = await client.models.Exercise.update({
            id: exerciseId,
            ...updateData,
          });
          console.log('Exercise updated:', updatedExercise);
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
        // Create new exercise with enum values
        try {
          const exerciseData = {
            title: finalExercise.title,
            description: finalExercise.description,
            category: finalExercise.category,
            question: finalExercise.question,
            instructions: finalExercise.instructions,
            requireText: finalExercise.requireText,
            requireImage: finalExercise.requireImage,
            requireAudio: finalExercise.requireAudio,
            requireVideo: finalExercise.requireVideo,
            requireDocument: finalExercise.requireDocument,
            textPrompt: finalExercise.textPrompt,
            maxTextLength: finalExercise.maxTextLength,
            allowMultipleImages: finalExercise.allowMultipleImages,
            allowMultipleDocuments: finalExercise.allowMultipleDocuments,
            allowEditingCompleted: finalExercise.allowEditingCompleted,
            isActive: finalExercise.isActive,
            createdBy: user?.userId || user?.username
          };
          console.log('Creating exercise with data:', exerciseData);
          const newExercise = await client.models.Exercise.create(exerciseData);
          console.log('Exercise created:', newExercise);
          onSave?.(newExercise);
        } catch (amplifyError) {
          console.warn('Amplify create failed, trying API route:', amplifyError);
          // Fallback to API route
          const response = await fetch('/api/exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalExercise),
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
              <option value="achievement_based_identity">Achievement-based identity</option>
              <option value="connection_and_belonging">Connection & Belonging</option>
              <option value="connection_to_nature">Connection to Nature</option>
              <option value="creative_expression">Creative Expression</option>
              <option value="diet_and_nutrition">Diet & Nutrition</option>
              <option value="emotional_re_appraisal">Emotional Re-Appraisal</option>
              <option value="exercise">Exercise</option>
              <option value="goal_attainment">Goal Attainment</option>
              <option value="goal_pursuit">Goal Pursuit</option>
              <option value="goal_resilience">Goal Resilience</option>
              <option value="gratitude">Gratitude</option>
              <option value="habit_formation">Habit Formation</option>
              <option value="high_standard_friends">High-Standard Friends</option>
              <option value="long_term_focus">Long-Term Focus</option>
              <option value="loving_relationships">Loving Relationships</option>
              <option value="meaning">Meaning</option>
              <option value="mindfulness_practice">Mindfulness Practice</option>
              <option value="perfectionism">Perfectionism</option>
              <option value="purpose">Purpose</option>
              <option value="purpose_based_identity">Purpose-based identity</option>
              <option value="purpose_beyond_self">Purpose Beyond Self</option>
              <option value="rumination">Rumination</option>
              <option value="self_auditing">Self-Auditing</option>
              <option value="self_awareness">Self-Awareness</option>
              <option value="self_compassion">Self-Compassion</option>
              <option value="self_talk">Self-Talk</option>
              <option value="self_worth">Self-Worth</option>
              <option value="sleep_and_rest">Sleep and Rest</option>
              <option value="substance_use">Substance Use</option>
              <option value="success_comparison">Success Comparison</option>
              <option value="tribe">Tribe</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="worry">Worry</option>
            </select>
          </div>
        </div>

        {/* Description/Narrative */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Narrative)
          </label>
          <RichTextEditor
            value={exercise.description}
            onChange={(content) => setExercise(prev => ({ ...prev, description: content }))}
            placeholder="Enter the exercise description and narrative..."
            id="exercise-description"
          />
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question
          </label>
          <RichTextEditor
            value={exercise.question}
            onChange={(content) => setExercise(prev => ({ ...prev, question: content }))}
            placeholder="Enter the exercise question"
            id="exercise-question"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions for Users
          </label>
          <RichTextEditor
            value={exercise.instructions}
            onChange={(content) => setExercise(prev => ({ ...prev, instructions: content }))}
            placeholder="Enter detailed instructions for users on how to complete this exercise..."
            id="exercise-instructions"
          />
          <p className="text-sm text-gray-500 mt-1">
            These instructions will be shown to users before they start the exercise
          </p>
        </div>

        {/* Required Response Types */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Required Response Types</h3>
                      <p className="text-sm text-gray-600 mb-4">
              Configure response requirements for each type. &quot;Required&quot; means always mandatory, &quot;OR&quot; means at least one OR response must be provided, &quot;Not Required&quot; means optional.
            </p>
          
          <div className="space-y-6">
            {/* Text Response */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-lg">📝</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Text Response</h4>
                  <p className="text-xs text-gray-500">Users can enter a written response</p>
                </div>
              </div>
              <div className="flex space-x-4 mb-3">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireText"
                    value="not_required"
                    checked={exercise.requireText === 'not_required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireText: e.target.value as RequirementType }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Not Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireText"
                    value="required"
                    checked={exercise.requireText === 'required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireText: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireText"
                    value="or"
                    checked={exercise.requireText === 'or'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireText: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">OR</span>
                </label>
              </div>
              {exercise.requireText !== 'not_required' && (
                <div className="space-y-2">
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

            {/* Image Response */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-lg">🖼️</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Image Upload</h4>
                  <p className="text-xs text-gray-500">Users can upload images</p>
                </div>
              </div>
              <div className="flex space-x-4 mb-3">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireImage"
                    value="not_required"
                    checked={exercise.requireImage === 'not_required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireImage: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Not Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireImage"
                    value="required"
                    checked={exercise.requireImage === 'required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireImage: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireImage"
                    value="or"
                    checked={exercise.requireImage === 'or'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireImage: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">OR</span>
                </label>
              </div>
              {exercise.requireImage !== 'not_required' && (
                <div>
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

            {/* Audio Response */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-lg">🎵</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Audio Recording</h4>
                  <p className="text-xs text-gray-500">Users can record or upload audio</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireAudio"
                    value="not_required"
                    checked={exercise.requireAudio === 'not_required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireAudio: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Not Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireAudio"
                    value="required"
                    checked={exercise.requireAudio === 'required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireAudio: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireAudio"
                    value="or"
                    checked={exercise.requireAudio === 'or'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireAudio: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">OR</span>
                </label>
              </div>
            </div>

            {/* Video Response */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-lg">🎥</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Video Recording</h4>
                  <p className="text-xs text-gray-500">Users can record or upload video</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireVideo"
                    value="not_required"
                    checked={exercise.requireVideo === 'not_required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireVideo: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Not Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireVideo"
                    value="required"
                    checked={exercise.requireVideo === 'required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireVideo: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireVideo"
                    value="or"
                    checked={exercise.requireVideo === 'or'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireVideo: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">OR</span>
                </label>
              </div>
            </div>

            {/* Document Response */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-lg">📄</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Document Upload</h4>
                  <p className="text-xs text-gray-500">Users can upload documents</p>
                </div>
              </div>
              <div className="flex space-x-4 mb-3">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireDocument"
                    value="not_required"
                    checked={exercise.requireDocument === 'not_required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireDocument: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Not Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireDocument"
                    value="required"
                    checked={exercise.requireDocument === 'required'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireDocument: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="requireDocument"
                    value="or"
                    checked={exercise.requireDocument === 'or'}
                    onChange={(e) => setExercise(prev => ({ ...prev, requireDocument: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">OR</span>
                </label>
              </div>
              {exercise.requireDocument !== 'not_required' && (
                <div>
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

          {/* Helper text for OR logic */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>💡 How it works:</strong> Users must provide all "Required" responses. For "OR" responses, they must provide at least one from the OR group. For example, if Text and Image are both set to "OR", users can provide either text OR image (or both).
            </p>
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