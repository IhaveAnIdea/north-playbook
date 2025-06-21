'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ImageThumbnail from '@/components/ui/ImageThumbnail';
import type { Schema } from '../../../../../amplify/data/resource';

const client = generateClient<Schema>();

interface Exercise {
  id: string;
  title: string;
  description?: string;
  question: string;
  category: string;
  promptType: string;
}

interface ExerciseResponse {
  id: string;
  exerciseId: string;
  responseText?: string;
  imageS3Keys?: string[];
  audioS3Key?: string;
  videoS3Key?: string;
  documentS3Keys?: string[];
  mood?: string;
  tags?: string[];
  insights?: string;
  confidence?: number;
  status?: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function ExerciseResponsesPage() {
  const params = useParams();
  const exerciseId = params?.id as string;
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [responses, setResponses] = useState<ExerciseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'authenticated' && user && exerciseId) {
      loadExerciseAndResponses();
    }
  }, [authStatus, user, exerciseId]);

  const loadExerciseAndResponses = async () => {
    try {
      setIsLoading(true);
      
      // Load exercise details
      const { data: exerciseData } = await client.models.Exercise.get({ id: exerciseId });
      if (exerciseData) {
        setExercise(exerciseData as Exercise);
      }

      // Load user's responses to this exercise
      const { data: responsesData } = await client.models.ExerciseResponse.list({
        filter: {
          exerciseId: { eq: exerciseId },
          userId: { eq: user.userId }
        }
      });

      // Sort by most recent first
      const sortedResponses = responsesData.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setResponses(sortedResponses as ExerciseResponse[]);
    } catch (error) {
      console.error('Error loading exercise and responses:', error);
      setError('Failed to load exercise responses');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      return;
    }

    try {
      await client.models.ExerciseResponse.delete({ id: responseId });
      setResponses(prev => prev.filter(response => response.id !== responseId));
    } catch (error) {
      console.error('Error deleting response:', error);
      setError('Failed to delete response');
    }
  };

  if (authStatus === 'configuring' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exercise Not Found</h2>
          <p className="text-gray-600 mb-6">The exercise you're looking for doesn't exist.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Exercise Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exercise.title}</h1>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-2">
                {exercise.category}
              </span>
              <p className="text-gray-600 mt-3">{exercise.description}</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">Exercise Question:</h3>
                <p className="text-blue-800">{exercise.question}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Responses ({responses.length})
          </h2>
          <div className="flex space-x-3">
            <Link
              href={`/exercises/${exerciseId}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Complete Again
            </Link>
            <Link
              href="/exercises"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Back to Exercises
            </Link>
          </div>
        </div>

        {/* Responses List */}
        {responses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600 mb-6">You haven't completed this exercise yet</p>
            <Link
              href={`/exercises/${exerciseId}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Complete Exercise
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={response.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Response #{responses.length - index}
                    </h3>
                    {response.mood && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {response.mood}
                      </span>
                    )}
                    {response.confidence && (
                      <span className="text-sm text-gray-600">
                        Confidence: {response.confidence}/10
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(response.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Response Content */}
                {response.responseText && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Response:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {response.responseText}
                    </p>
                  </div>
                )}

                {/* Insights */}
                {response.insights && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Personal Insights:</h4>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded-md whitespace-pre-wrap">
                      {response.insights}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {response.tags && response.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {response.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Thumbnails */}
                {response.imageS3Keys && response.imageS3Keys.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Images ({response.imageS3Keys.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {response.imageS3Keys.map((s3Key, index) => (
                        <ImageThumbnail 
                          key={index} 
                          s3Key={s3Key} 
                          alt={`Response image ${index + 1}`}
                          size="md"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <Link
                      href={`/exercises/${exerciseId}/response/${response.id}/edit`}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Edit Response
                    </Link>
                  </div>
                  <button
                    onClick={() => deleteResponse(response.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 