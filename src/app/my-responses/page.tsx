'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

interface ExerciseResponse {
  id: string;
  exerciseId: string;
  responseText?: string;
  mood?: string;
  tags?: string[];
  insights?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
  exercise?: {
    id: string;
    title: string;
    category: string;
  };
}

export default function MyResponsesPage() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [responses, setResponses] = useState<ExerciseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      loadMyResponses();
    }
  }, [authStatus, user]);

  const loadMyResponses = async () => {
    try {
      setIsLoading(true);
      const { data } = await client.models.ExerciseResponse.list({
        filter: {
          userId: {
            eq: user.userId
          }
        }
      });
      
      // Load exercise details for each response
      const responsesWithExercises = await Promise.all(
        data.map(async (response) => {
          try {
            const { data: exercise } = await client.models.Exercise.get({ id: response.exerciseId });
            return {
              ...response,
              exercise: exercise ? {
                id: exercise.id,
                title: exercise.title,
                category: exercise.category,
              } : undefined
            } as ExerciseResponse;
          } catch (error) {
            console.error('Error loading exercise for response:', error);
            return response as ExerciseResponse;
          }
        })
      );

      // Sort by most recent first
      responsesWithExercises.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setResponses(responsesWithExercises);
    } catch (error) {
      console.error('Error loading responses:', error);
      setError('Failed to load your responses');
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

  if (authStatus === 'configuring') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Exercise Responses</h1>
          <p className="text-gray-600 mt-2">
            View and manage your personal exercise responses and reflections
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Responses List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading your responses...</p>
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600 mb-6">Start completing exercises to see your responses here</p>
            <Link
              href="/exercises"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Browse Exercises
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response) => (
              <div key={response.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {response.exercise?.title || 'Unknown Exercise'}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      {response.exercise?.category && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {response.exercise.category}
                        </span>
                      )}
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
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(response.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Response Content */}
                {response.responseText && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                      {response.responseText.length > 200 
                        ? `${response.responseText.substring(0, 200)}...` 
                        : response.responseText
                      }
                    </p>
                  </div>
                )}

                {/* Insights */}
                {response.insights && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Personal Insights:</h4>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                      {response.insights.length > 150 
                        ? `${response.insights.substring(0, 150)}...` 
                        : response.insights
                      }
                    </p>
                  </div>
                )}

                {/* Tags */}
                {response.tags && response.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {response.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <Link
                      href={`/exercises/${response.exerciseId}/response/${response.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Full Response
                    </Link>
                    <Link
                      href={`/exercises/${response.exerciseId}/response/${response.id}/edit`}
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