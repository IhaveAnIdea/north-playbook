'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserRole } from '@/hooks/useUserRole';
import ImageThumbnail from '@/components/ui/ImageThumbnail';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

interface Exercise {
  id: string;
  title: string;
  description?: string;
  category: string;
  question: string;
  instructions?: string;
  requireText: boolean;
  requireImage: boolean;
  requireAudio: boolean;
  requireVideo: boolean;
  requireDocument: boolean;
  textPrompt?: string;
  maxTextLength?: number;
  allowMultipleImages: boolean;
  allowMultipleDocuments: boolean;
  allowEditingCompleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



export default function ExerciseDetailPage() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const { isAdmin } = useUserRole();
  const params = useParams();
  const router = useRouter();
  const exerciseId = params?.id as string;
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'authenticated' && user && exerciseId) {
      loadExercise();
      loadRecentImages();
    }
  }, [authStatus, user, exerciseId]);

  const loadExercise = async () => {
    try {
      const { data } = await client.models.Exercise.get({ id: exerciseId });
      if (data) {
        setExercise({
          id: data.id,
          title: data.title || '',
          description: data.description || undefined,
          category: (data.category as string) || '',
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
          allowEditingCompleted: data.allowEditingCompleted ?? false,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        setError('Exercise not found');
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      setError('Failed to load exercise');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentImages = async () => {
    try {
      // Load user's recent responses with images for this exercise
      const { data: responses } = await client.models.ExerciseResponse.list({
        filter: {
          exerciseId: { eq: exerciseId },
          userId: { eq: user?.userId }
        }
      });

      if (responses) {
        const imagesFromResponses: string[] = [];
        const responsesWithImages = responses
          .filter(response => response.imageS3Keys && response.imageS3Keys.length > 0)
          .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        
        for (const response of responsesWithImages) {
          if (response.imageS3Keys) {
            imagesFromResponses.push(...response.imageS3Keys);
            if (imagesFromResponses.length >= 6) break; // Show up to 6 recent images
          }
        }
        
        setRecentImages(imagesFromResponses.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading recent images:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      mindset: 'bg-purple-100 text-purple-800',
      motivation: 'bg-blue-100 text-blue-800',
      goals: 'bg-green-100 text-green-800',
      reflection: 'bg-yellow-100 text-yellow-800',
      gratitude: 'bg-pink-100 text-pink-800',
      vision: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getRequiredResponseTypes = (exercise: Exercise) => {
    const types: string[] = [];
    if (exercise.requireText) types.push('📝 Text');
    if (exercise.requireImage) types.push('🖼️ Image');
    if (exercise.requireAudio) types.push('🎵 Audio');
    if (exercise.requireVideo) types.push('🎥 Video');
    if (exercise.requireDocument) types.push('📄 Document');
    return types;
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exercise Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The exercise you are looking for does not exist.'}</p>
          <Link
            href="/exercises"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Exercises
          </Link>
        </div>
      </div>
    );
  }

  const requiredTypes = getRequiredResponseTypes(exercise);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📋</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{exercise.title}</h1>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(exercise.category)}`}>
                      {exercise.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${exercise.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {exercise.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {isAdmin ? (
                <>
                  <Link
                    href={`/exercises/${exercise.id}/edit`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Edit Template
                  </Link>
                  <Link
                    href={`/exercises/${exercise.id}/responses`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    My Responses
                  </Link>
                  <Link
                    href={`/exercises/${exercise.id}/complete`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Complete Exercise
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={`/exercises/${exercise.id}/responses`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    My Responses
                  </Link>
                  <Link
                    href={`/exercises/${exercise.id}/complete`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Complete Exercise
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Exercise Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="space-y-6">
            {/* Question */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Exercise Question</h2>
              <p className="text-lg text-gray-700 bg-gray-50 p-4 rounded-md">
                {exercise.question}
              </p>
            </div>

            {/* Instructions */}
            {exercise.instructions && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Instructions</h2>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-blue-800 whitespace-pre-wrap">
                    {exercise.instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {exercise.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description & Narrative</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {exercise.description}
                  </p>
                </div>
              </div>
            )}

            {/* Required Response Types */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Required Response Types</h2>
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-yellow-800 text-sm mb-3">
                  To complete this exercise, you must provide the following types of responses:
                </p>
                <div className="flex flex-wrap gap-2">
                  {requiredTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                {exercise.requireText && exercise.textPrompt && (
                  <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
                    <p className="text-sm text-gray-700">
                      <strong>Text Prompt:</strong> {exercise.textPrompt}
                    </p>
                    {exercise.maxTextLength && (
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum {exercise.maxTextLength} characters
                      </p>
                    )}
                  </div>
                )}
                {exercise.requireImage && exercise.allowMultipleImages && (
                  <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
                    <p className="text-sm text-gray-700">
                      <strong>Image Upload:</strong> Multiple images allowed
                    </p>
                  </div>
                )}
                {exercise.requireDocument && exercise.allowMultipleDocuments && (
                  <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
                    <p className="text-sm text-gray-700">
                      <strong>Document Upload:</strong> Multiple documents allowed
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Exercise Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Exercise Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900">Created</h3>
                  <p className="text-gray-600">{new Date(exercise.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900">Last Updated</h3>
                  <p className="text-gray-600">{new Date(exercise.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Recent Response Images */}
            {recentImages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Recent Images</h2>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-blue-800 text-sm mb-3">
                    Images from your recent responses to this exercise:
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {recentImages.map((s3Key, index) => (
                      <ImageThumbnail 
                        key={index} 
                        s3Key={s3Key} 
                        alt={`Recent response image ${index + 1}`}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
} 