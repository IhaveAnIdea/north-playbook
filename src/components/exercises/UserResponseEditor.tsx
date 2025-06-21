'use client';

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

interface UserResponseEditorProps {
  exerciseId: string;
  responseId?: string;
  onSave?: (response: unknown) => void;
  onCancel?: () => void;
}

interface ExerciseResponse {
  id?: string;
  exerciseId: string;
  responseText?: string;
  audioS3Key?: string;
  videoS3Key?: string;
  imageS3Keys?: string[];
  mood?: string;
  tags?: string[];
  insights?: string;
  completionTime?: number;
  confidence?: number;
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  question: string;
  promptType: string;
  category: string;
}

export default function UserResponseEditor({ exerciseId, responseId, onSave, onCancel }: UserResponseEditorProps) {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [response, setResponse] = useState<ExerciseResponse>({
    exerciseId,
    responseText: '',
    mood: '',
    tags: [],
    insights: '',
    completionTime: 0,
    confidence: 5,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!responseId;

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      loadExercise();
      if (responseId) {
        loadResponse();
      }
    }
  }, [authStatus, user, exerciseId, responseId]);

  const loadExercise = async () => {
    try {
      const { data } = await client.models.Exercise.get({ id: exerciseId });
      if (data) {
        setExercise(data as Exercise);
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      setError('Failed to load exercise');
    }
  };

  const loadResponse = async () => {
    try {
      setIsLoading(true);
      const { data } = await client.models.ExerciseResponse.get({ id: responseId! });
      if (data) {
        setResponse({
          id: data.id,
          exerciseId: data.exerciseId,
          responseText: data.responseText || '',
          audioS3Key: data.audioS3Key || '',
          videoS3Key: data.videoS3Key || '',
          imageS3Keys: data.imageS3Keys || [],
          mood: data.mood || '',
          tags: data.tags || [],
          insights: data.insights || '',
          completionTime: data.completionTime || 0,
          confidence: data.confidence || 5,
        });
      }
    } catch (error) {
      console.error('Error loading response:', error);
      setError('Failed to load your response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isEditing && responseId) {
        // Update existing response
        const updatedResponse = await client.models.ExerciseResponse.update({
          id: responseId,
          responseText: response.responseText,
          mood: response.mood,
          tags: response.tags,
          insights: response.insights,
          confidence: response.confidence,
        });
        onSave?.(updatedResponse);
      } else {
        // Create new response
        const newResponse = await client.models.ExerciseResponse.create({
          exerciseId: response.exerciseId,
          userId: user.userId,
          responseText: response.responseText,
          mood: response.mood,
          tags: response.tags,
          insights: response.insights,
          confidence: response.confidence,
          completionTime: response.completionTime,
        });
        onSave?.(newResponse);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      setError('Failed to save your response');
    } finally {
      setIsLoading(false);
    }
  };

  if (!exercise) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Your Response' : 'Complete Exercise'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update your response to this exercise' : 'Share your thoughts and reflections'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Exercise Context */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">{exercise.title}</h2>
        <p className="text-blue-800 mb-4">{exercise.description}</p>
        <div className="p-4 bg-blue-100 rounded-md">
          <h3 className="font-medium text-blue-900 mb-2">Question:</h3>
          <p className="text-blue-800 text-lg">{exercise.question}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Response Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Response
          </label>
          <textarea
            value={response.responseText}
            onChange={(e) => setResponse(prev => ({ ...prev, responseText: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your thoughts, reflections, and insights..."
          />
        </div>

        {/* Mood */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling?
          </label>
          <select
            value={response.mood}
            onChange={(e) => setResponse(prev => ({ ...prev, mood: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select your mood</option>
            <option value="excited">Excited</option>
            <option value="motivated">Motivated</option>
            <option value="reflective">Reflective</option>
            <option value="peaceful">Peaceful</option>
            <option value="challenged">Challenged</option>
            <option value="grateful">Grateful</option>
            <option value="uncertain">Uncertain</option>
            <option value="hopeful">Hopeful</option>
          </select>
        </div>

        {/* Confidence Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confidence Level (1-10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={response.confidence}
            onChange={(e) => setResponse(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>1 - Not confident</span>
            <span className="font-medium">{response.confidence}</span>
            <span>10 - Very confident</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={response.tags?.join(', ') || ''}
            onChange={(e) => setResponse(prev => ({ 
              ...prev, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="growth, mindset, goals, reflection..."
          />
        </div>

        {/* Personal Insights */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Insights
          </label>
          <textarea
            value={response.insights}
            onChange={(e) => setResponse(prev => ({ ...prev, insights: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What did you learn about yourself? Any key realizations or next steps?"
          />
        </div>

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
            disabled={isLoading || !response.responseText?.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Response' : 'Save Response')}
          </button>
        </div>
      </div>
    </div>
  );
} 