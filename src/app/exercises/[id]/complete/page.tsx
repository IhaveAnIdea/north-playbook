'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserRole } from '@/hooks/useUserRole';
import ExerciseResponseFormEnhanced from '@/components/exercises/ExerciseResponseFormEnhanced';
import type { Schema } from '../../../../../amplify/data/resource';

const client = generateClient<Schema>();

interface Exercise {
  id: string;
  title: string;
  description: string;
  question: string;
  instructions?: string;
  requireText: 'not_required' | 'required' | 'or' | boolean;
  requireImage: 'not_required' | 'required' | 'or' | boolean;
  requireAudio: 'not_required' | 'required' | 'or' | boolean;
  requireVideo: 'not_required' | 'required' | 'or' | boolean;
  requireDocument: 'not_required' | 'required' | 'or' | boolean;
  textPrompt?: string;
  maxTextLength?: number;
  allowMultipleImages: boolean;
  allowMultipleDocuments: boolean;
  isActive: boolean;
}

export default function CompleteExercisePage() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const { isAdmin } = useUserRole();
  const params = useParams();
  const router = useRouter();
  const exerciseId = params?.id as string;
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [existingResponse, setExistingResponse] = useState<{
    id: string;
    status: 'draft' | 'completed';
    responseText?: string;
    imageS3Keys?: string[];
    audioS3Key?: string;
    videoS3Key?: string;
    videoS3Keys?: string[];
    documentS3Keys?: string[];
    createdAt?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'authenticated' && user && exerciseId) {
      loadExercise();
      loadExistingResponse();
    }
  }, [authStatus, user, exerciseId]);

  const loadExercise = async () => {
    try {
      const { data } = await client.models.Exercise.get({ id: exerciseId });
      if (data) {
        if (!data.isActive) {
          setError('This exercise is not currently active');
          return;
        }

        setExercise({
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          question: data.question || '',
          instructions: data.instructions || undefined,
          requireText: data.requireText ?? false,
          requireImage: data.requireImage ?? false,
          requireAudio: data.requireAudio ?? false,
          requireVideo: data.requireVideo ?? false,
          requireDocument: data.requireDocument ?? false,
          textPrompt: data.textPrompt || undefined,
          maxTextLength: data.maxTextLength || undefined,
          allowMultipleImages: data.allowMultipleImages ?? false,
          allowMultipleDocuments: data.allowMultipleDocuments ?? false,

          isActive: data.isActive ?? true,
        });
      } else {
        setError('Exercise not found');
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      setError('Failed to load exercise');
    }
  };

  const loadExistingResponse = async () => {
    try {
      console.log('Loading existing responses for exercise:', exerciseId, 'user:', user?.userId);
      console.log('Query filter:', {
        exerciseId: { eq: exerciseId },
        userId: { eq: user?.userId }
      });
      
      const { data: responses } = await client.models.ExerciseResponse.list({
        filter: {
          exerciseId: { eq: exerciseId },
          userId: { eq: user?.userId }
        }
      });

      console.log('Found responses:', responses?.length || 0, responses);
      console.log('Response query result details:', JSON.stringify(responses, null, 2));

      // Find the latest response (draft or completed)
      if (responses && responses.length > 0) {
        const latestResponse = responses
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
        
        // Map the response to our expected type
        console.log('Raw response from database:', latestResponse);
        
        setExistingResponse({
          id: latestResponse.id,
          status: (latestResponse.status as 'draft' | 'completed') || 'draft',
          responseText: latestResponse.responseText || undefined,
          imageS3Keys: latestResponse.imageS3Keys?.filter((key): key is string => key !== null) || undefined,
          audioS3Key: latestResponse.audioS3Key || undefined,
          videoS3Key: latestResponse.videoS3Key || undefined,
          videoS3Keys: latestResponse.videoS3Keys?.filter((key): key is string => key !== null) || undefined,
          documentS3Keys: latestResponse.documentS3Keys?.filter((key): key is string => key !== null) || undefined,
          createdAt: latestResponse.createdAt || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading existing response:', error);
      // Not a critical error, user can still create new response
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (response: unknown) => {
    console.log('Response saved as draft:', response);
    // Reload the existing response to show the saved data
    await loadExistingResponse();
    // Optionally show a success message
    // router.push(`/exercises/${exerciseId}`);
  };

  const handleComplete = (response: unknown) => {
    console.log('Exercise completed:', response);
    
    // Check if there was an error
    if (response && typeof response === 'object' && 'errors' in response) {
      console.error('Exercise completion errors:', response.errors);
      // Don't redirect if there were errors, stay on page to show error
      return;
    }
    
    // Show success message and redirect only if successful
    router.push(`/exercises/${exerciseId}/responses`);
  };

  const handleCancel = () => {
    router.push(`/exercises/${exerciseId}`);
  };

  if (authStatus === 'configuring' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Complete Exercise</h2>
          <p className="text-gray-600 mb-6">{error || 'The exercise could not be loaded.'}</p>
          <button
            onClick={() => router.push('/exercises')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Exercises
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/exercises/${exerciseId}`)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Exercise
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Exercise</h1>
              {isAdmin && (
                <p className="text-sm text-amber-600 mt-1">
                  👨‍💼 Admin Note: You can complete exercises just like regular users. Your responses are tracked separately from template management.
                </p>
              )}
              {existingResponse && (
                <p className="text-sm text-gray-600 mt-1">
                  {existingResponse.status === 'completed' 
                    ? 'You have completed this exercise. View only mode.'
                    : 'You have a draft response for this exercise. Continue editing below.'
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Exercise Response Form */}
        <ExerciseResponseFormEnhanced
          exercise={exercise}
          existingResponse={existingResponse || undefined}
          onSave={handleSave}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 