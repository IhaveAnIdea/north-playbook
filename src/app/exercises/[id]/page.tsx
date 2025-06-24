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
  requireText: 'not_required' | 'required' | 'or' | boolean;
  requireImage: 'not_required' | 'required' | 'or' | boolean;
  requireAudio: 'not_required' | 'required' | 'or' | boolean;
  requireVideo: 'not_required' | 'required' | 'or' | boolean;
  requireDocument: 'not_required' | 'required' | 'or' | boolean;
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
            imagesFromResponses.push(...response.imageS3Keys.filter(key => key !== null));
            if (imagesFromResponses.length >= 6) break; // Show up to 6 recent images
          }
        }
        
        setRecentImages(imagesFromResponses.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading recent images:', error);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const displayNames: Record<string, string> = {
      achievement_based_identity: 'Achievement-based identity',
      connection_and_belonging: 'Connection & Belonging',
      connection_to_nature: 'Connection to Nature',
      creative_expression: 'Creative Expression',
      diet_and_nutrition: 'Diet & Nutrition',
      emotional_re_appraisal: 'Emotional Re-Appraisal',
      exercise: 'Exercise',
      goal_attainment: 'Goal Attainment',
      goal_pursuit: 'Goal Pursuit',
      goal_resilience: 'Goal Resilience',
      gratitude: 'Gratitude',
      habit_formation: 'Habit Formation',
      high_standard_friends: 'High-Standard Friends',
      long_term_focus: 'Long-Term Focus',
      loving_relationships: 'Loving Relationships',
      meaning: 'Meaning',
      mindfulness_practice: 'Mindfulness Practice',
      perfectionism: 'Perfectionism',
      purpose: 'Purpose',
      purpose_based_identity: 'Purpose-based identity',
      purpose_beyond_self: 'Purpose Beyond Self',
      rumination: 'Rumination',
      self_auditing: 'Self-Auditing',
      self_awareness: 'Self-Awareness',
      self_compassion: 'Self-Compassion',
      self_talk: 'Self-Talk',
      self_worth: 'Self-Worth',
      sleep_and_rest: 'Sleep and Rest',
      substance_use: 'Substance Use',
      success_comparison: 'Success Comparison',
      tribe: 'Tribe',
      vulnerability: 'Vulnerability',
      worry: 'Worry',
      // Legacy categories for backward compatibility
      mindset: 'Mindset',
      motivation: 'Motivation',
      goals: 'Goals',
      reflection: 'Reflection',
      vision: 'Vision',
    };
    return displayNames[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      connection_to_nature: 'bg-green-100 text-green-800',
      habit_formation: 'bg-blue-100 text-blue-800',
      goal_resilience: 'bg-purple-100 text-purple-800',
      substance_use: 'bg-red-100 text-red-800',
      self_compassion: 'bg-pink-100 text-pink-800',
      goal_attainment: 'bg-emerald-100 text-emerald-800',
      worry: 'bg-orange-100 text-orange-800',
      high_standard_friends: 'bg-cyan-100 text-cyan-800',
      mindfulness_practice: 'bg-indigo-100 text-indigo-800',
      sleep_and_rest: 'bg-slate-100 text-slate-800',
      purpose: 'bg-violet-100 text-violet-800',
      self_worth: 'bg-amber-100 text-amber-800',
      emotional_re_appraisal: 'bg-teal-100 text-teal-800',
      perfectionism: 'bg-rose-100 text-rose-800',
      achievement_based_identity: 'bg-lime-100 text-lime-800',
      self_auditing: 'bg-sky-100 text-sky-800',
      purpose_based_identity: 'bg-fuchsia-100 text-fuchsia-800',
      connection_and_belonging: 'bg-blue-100 text-blue-800',
      tribe: 'bg-green-100 text-green-800',
      purpose_beyond_self: 'bg-purple-100 text-purple-800',
      diet_and_nutrition: 'bg-yellow-100 text-yellow-800',
      goal_pursuit: 'bg-blue-100 text-blue-800',
      self_talk: 'bg-pink-100 text-pink-800',
      loving_relationships: 'bg-red-100 text-red-800',
      gratitude: 'bg-pink-100 text-pink-800',
      meaning: 'bg-indigo-100 text-indigo-800',
      exercise: 'bg-green-100 text-green-800',
      self_awareness: 'bg-yellow-100 text-yellow-800',
      vulnerability: 'bg-purple-100 text-purple-800',
      rumination: 'bg-gray-100 text-gray-800',
      creative_expression: 'bg-pink-100 text-pink-800',
      success_comparison: 'bg-orange-100 text-orange-800',
      long_term_focus: 'bg-blue-100 text-blue-800',
      // Legacy categories for backward compatibility
      mindset: 'bg-purple-100 text-purple-800',
      motivation: 'bg-blue-100 text-blue-800',
      goals: 'bg-green-100 text-green-800',
      reflection: 'bg-yellow-100 text-yellow-800',
      vision: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getAllResponseTypes = (exercise: Exercise) => {
    const required: string[] = [];
    const or: string[] = [];
    const optional: string[] = [];

    // Handle text
    if (exercise.requireText === 'required' || exercise.requireText === true) {
      required.push('📝 Text');
    } else if (exercise.requireText === 'or') {
      or.push('📝 Text');
    } else if (exercise.requireText === 'not_required') {
      optional.push('📝 Text');
    }

    // Handle image
    if (exercise.requireImage === 'required' || exercise.requireImage === true) {
      required.push('🖼️ Image');
    } else if (exercise.requireImage === 'or') {
      or.push('🖼️ Image');
    } else if (exercise.requireImage === 'not_required') {
      optional.push('🖼️ Image');
    }

    // Handle audio
    if (exercise.requireAudio === 'required' || exercise.requireAudio === true) {
      required.push('🎵 Audio');
    } else if (exercise.requireAudio === 'or') {
      or.push('🎵 Audio');
    } else if (exercise.requireAudio === 'not_required') {
      optional.push('🎵 Audio');
    }

    // Handle video
    if (exercise.requireVideo === 'required' || exercise.requireVideo === true) {
      required.push('🎥 Video');
    } else if (exercise.requireVideo === 'or') {
      or.push('🎥 Video');
    } else if (exercise.requireVideo === 'not_required') {
      optional.push('🎥 Video');
    }

    // Handle document
    if (exercise.requireDocument === 'required' || exercise.requireDocument === true) {
      required.push('📄 Document');
    } else if (exercise.requireDocument === 'or') {
      or.push('📄 Document');
    } else if (exercise.requireDocument === 'not_required') {
      optional.push('📄 Document');
    }

    return { required, or, optional };
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

  const responseTypes = getAllResponseTypes(exercise);

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
                      {getCategoryDisplayName(exercise.category)}
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
                    Work on Assignment
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
              <div 
                className="text-lg text-gray-700 bg-gray-50 p-4 rounded-md prose max-w-none rich-text-content"
                dangerouslySetInnerHTML={{ __html: exercise.question }}
              />
            </div>

            {/* Instructions */}
            {exercise.instructions && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Instructions</h2>
                <div className="bg-blue-50 p-4 rounded-md">
                  <div 
                    className="text-blue-800 prose max-w-none rich-text-content"
                    dangerouslySetInnerHTML={{ __html: exercise.instructions }}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {exercise.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description & Narrative</h2>
                <div 
                  className="prose max-w-none text-gray-700 rich-text-content"
                  dangerouslySetInnerHTML={{ __html: exercise.description }}
                />
              </div>
            )}

            {/* Response Types */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Response Requirements</h2>
              <div className="space-y-4">
                {/* Required Types */}
                {responseTypes.required.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <h3 className="text-sm font-medium text-red-900 mb-2">Required (Always Mandatory)</h3>
                    <p className="text-red-800 text-sm mb-3">
                      You must provide ALL of these response types:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {responseTypes.required.map((type, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* OR Types */}
                {responseTypes.or.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                    <h3 className="text-sm font-medium text-yellow-900 mb-2">OR Group (Choose At Least One)</h3>
                    <p className="text-yellow-800 text-sm mb-3">
                      You must provide AT LEAST ONE of these response types:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {responseTypes.or.map((type, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional Types */}
                {responseTypes.optional.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Optional (Not Required)</h3>
                    <p className="text-green-800 text-sm mb-3">
                      These response types are optional - you can include them if you wish:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {responseTypes.optional.map((type, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Prompts/Settings */}
                {((exercise.requireText === 'required' || exercise.requireText === 'or' || exercise.requireText === true) && exercise.textPrompt) && (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Text Response Prompt</h3>
                    <p className="text-sm text-blue-800">
                      <strong>Prompt:</strong> {exercise.textPrompt}
                    </p>
                    {exercise.maxTextLength && (
                      <p className="text-xs text-blue-600 mt-1">
                        Maximum {exercise.maxTextLength} characters
                      </p>
                    )}
                  </div>
                )}

                {((exercise.requireImage === 'required' || exercise.requireImage === 'or' || exercise.requireImage === true) && exercise.allowMultipleImages) && (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Image Upload Settings</h3>
                    <p className="text-sm text-blue-800">
                      Multiple images allowed
                    </p>
                  </div>
                )}

                {((exercise.requireDocument === 'required' || exercise.requireDocument === 'or' || exercise.requireDocument === true) && exercise.allowMultipleDocuments) && (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Document Upload Settings</h3>
                    <p className="text-sm text-blue-800">
                      Multiple documents allowed
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