'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserRole } from '@/hooks/useUserRole';
import ImageThumbnail from '@/components/ui/ImageThumbnail';
import ExerciseProgress from '@/components/exercises/ExerciseProgress';
import { calculateExerciseProgress, convertLegacyRequirements } from '@/utils/exerciseProgress';
import type { Schema } from '../../../amplify/data/resource';
import AudioThumbnail from '@/components/ui/AudioThumbnail';
import VideoThumbnail from '@/components/ui/VideoThumbnail';
import DocumentThumbnail from '@/components/ui/DocumentThumbnail';

const client = generateClient<Schema>();

interface Exercise {
  id: string;
  title: string;
  description?: string;
  category: string;
  question: string;
  promptType: string;
  requireText: 'not_required' | 'required' | 'or' | boolean;
  requireImage: 'not_required' | 'required' | 'or' | boolean;
  requireAudio: 'not_required' | 'required' | 'or' | boolean;
  requireVideo: 'not_required' | 'required' | 'or' | boolean;
  requireDocument: 'not_required' | 'required' | 'or' | boolean;
  instructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExerciseWithStatus extends Exercise {
  status: 'unstarted' | 'started' | 'completed';
  responseCount: number;
  lastResponseDate?: string;
  recentImages?: string[];
  recentAudio?: string;
  recentVideo?: string;
  recentDocuments?: string[];
  latestResponse?: {
    responseText?: string;
    imageS3Keys?: string[];
    audioS3Key?: string;
    videoS3Key?: string;
    documentS3Keys?: string[];
    status?: 'draft' | 'completed';
  };
}

export default function ExercisesPage() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesWithStatus, setExercisesWithStatus] = useState<ExerciseWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'participate' | 'manage'>('participate'); // Default to participate

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      if (isAdmin) {
        loadExerciseTemplates();
        loadUserExercises(); // Load both for admins
      } else {
        loadUserExercises();
      }
    }
  }, [authStatus, user, isAdmin]);

  const loadExerciseTemplates = async () => {
    try {
      const { data } = await client.models.Exercise.list();
      if (data) {
        const mappedExercises: Exercise[] = data.map(exercise => ({
          id: exercise.id,
          title: exercise.title || '',
          description: exercise.description || undefined,
          category: exercise.category || '',
          question: exercise.question || '',
          promptType: 'text', // Default value since this field is being deprecated
          requireText: exercise.requireText ?? false,
          requireImage: exercise.requireImage ?? false,
          requireAudio: exercise.requireAudio ?? false,
          requireVideo: exercise.requireVideo ?? false,
          requireDocument: exercise.requireDocument ?? false,
          allowEditingCompleted: exercise.allowEditingCompleted ?? false,
          isActive: exercise.isActive ?? true,
          createdAt: exercise.createdAt || new Date().toISOString(),
          updatedAt: exercise.updatedAt || new Date().toISOString(),
        }));
        setExercises(mappedExercises);
      }
    } catch (error) {
      console.error('Error loading exercise templates:', error);
      setError('Failed to load exercise templates');
    }
  };

  const loadUserExercises = async () => {
    try {
      // Load all active exercises
      const { data: exerciseData } = await client.models.Exercise.list({
        filter: { isActive: { eq: true } }
      });

      if (!exerciseData) {
        setIsLoading(false);
        return;
      }

      // Load user's responses
      const { data: responseData } = await client.models.ExerciseResponse.list({
        filter: { userId: { eq: user?.userId } }
      });

      // Combine exercise data with user response status
      const exercisesWithStatus: ExerciseWithStatus[] = exerciseData.map(exercise => {
        const userResponses = responseData?.filter(response => response.exerciseId === exercise.id) || [];
        
        const lastResponse = userResponses.sort((a, b) => 
          new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        )[0];

        // Calculate actual completion based on requirements (convert to enum format)
        const requirements = convertLegacyRequirements(exercise);

        const latestResponseForProgress = lastResponse ? {
          textResponse: lastResponse.responseText || undefined,
          imageUrls: lastResponse.imageS3Keys?.filter((key): key is string => key !== null) || [],
          audioUrl: lastResponse.audioS3Key || undefined,
          videoUrl: lastResponse.videoS3Key || undefined,
          documentUrls: lastResponse.documentS3Keys?.filter((key): key is string => key !== null) || [],
        } : undefined;

        const latestResponse = lastResponse ? {
          responseText: lastResponse.responseText || undefined,
          imageS3Keys: lastResponse.imageS3Keys?.filter((key): key is string => key !== null) || undefined,
          audioS3Key: lastResponse.audioS3Key || undefined,
          videoS3Key: lastResponse.videoS3Key || undefined,
          documentS3Keys: lastResponse.documentS3Keys?.filter((key): key is string => key !== null) || undefined,
          status: lastResponse.status as 'draft' | 'completed' | undefined,
        } : undefined;

        const progress = calculateExerciseProgress(requirements, latestResponseForProgress, lastResponse?.status as 'draft' | 'completed' | undefined);
        
        // Map new states to the existing interface
        let status: 'unstarted' | 'started' | 'completed';
        switch (progress.state) {
          case 'unstarted':
            status = 'unstarted';
            break;
          case 'incomplete':
            status = 'started';
            break;
          case 'completed':
            status = 'completed';
            break;
        }
        
        // Get recent images from the most recent responses (up to 3 images)
        const recentImages: string[] = [];
        const responsesWithImages = userResponses
          .filter(response => response.imageS3Keys && response.imageS3Keys.length > 0)
          .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        
        for (const response of responsesWithImages) {
          if (response.imageS3Keys) {
            const validKeys = response.imageS3Keys.filter((key): key is string => key !== null);
            recentImages.push(...validKeys);
            if (recentImages.length >= 3) break;
          }
        }

        // Get most recent audio
        const recentAudio = userResponses
          .filter(response => response.audioS3Key)
          .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0]?.audioS3Key || undefined;

        // Get most recent video
        const recentVideo = userResponses
          .filter(response => response.videoS3Key)
          .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0]?.videoS3Key || undefined;

        // Get recent documents from the most recent responses (up to 3 documents)
        const recentDocuments: string[] = [];
        const responsesWithDocuments = userResponses
          .filter(response => response.documentS3Keys && response.documentS3Keys.length > 0)
          .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        
        for (const response of responsesWithDocuments) {
          if (response.documentS3Keys) {
            const validKeys = response.documentS3Keys.filter((key): key is string => key !== null);
            recentDocuments.push(...validKeys);
            if (recentDocuments.length >= 3) break;
          }
        }

        return {
          id: exercise.id,
          title: exercise.title || '',
          description: exercise.description || undefined,
          category: exercise.category || '',
          question: exercise.question || '',
          promptType: 'text', // Default value since this field is being deprecated
          requireText: exercise.requireText ?? false,
          requireImage: exercise.requireImage ?? false,
          requireAudio: exercise.requireAudio ?? false,
          requireVideo: exercise.requireVideo ?? false,
          requireDocument: exercise.requireDocument ?? false,
          allowEditingCompleted: exercise.allowEditingCompleted ?? false,
          isActive: exercise.isActive ?? true,
          createdAt: exercise.createdAt || new Date().toISOString(),
          updatedAt: exercise.updatedAt || new Date().toISOString(),
          status,
          responseCount: userResponses.length,
          lastResponseDate: lastResponse?.updatedAt || undefined,
          recentImages: recentImages.slice(0, 3), // Limit to 3 images
          recentAudio,
          recentVideo,
          recentDocuments: recentDocuments.slice(0, 3), // Limit to 3 documents
          latestResponse,
        };
      });

      // Sort exercises by last updated (most recent first)
      const sortedExercises = exercisesWithStatus.sort((a, b) => {
        const aDate = a.lastResponseDate || a.updatedAt;
        const bDate = b.lastResponseDate || b.updatedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setExercisesWithStatus(sortedExercises);
    } catch (error) {
      console.error('Error loading user exercises:', error);
      setError('Failed to load exercises');
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unstarted: 'bg-gray-100 text-gray-800',
      started: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unstarted': return '🔓';
      case 'started': return '🚀';
      case 'completed': return '✅';
      default: return '🔓';
    }
  };

  const getPromptTypeIcon = (promptType: string) => {
    switch (promptType) {
      case 'text': return '📝';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      default: return '📝';
    }
  };

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAdmin) {
    // Admin view: Both exercise participation and template management
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Admin Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {activeTab === 'participate' ? 'My Exercises' : 'Exercise Templates'}
                </h1>
                <p className="text-gray-600 mt-2">
                  {activeTab === 'participate' 
                    ? 'Track your progress and continue your personal development journey'
                    : 'Manage exercise templates and configurations'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {activeTab === 'manage' && (
                  <Link
                    href="/exercises/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Create New Template
                  </Link>
                )}
                <div className="text-sm text-gray-500">
                  👨‍💼 Admin View
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('participate')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'participate'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏃‍♂️ Participate in Exercises
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'manage'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ⚙️ Manage Templates
                </button>
              </nav>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'participate' ? (
            // User Exercise Participation View for Admins
            <>
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">🔓</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Unstarted</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {exercisesWithStatus.filter(e => e.status === 'unstarted').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">🚀</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Started</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {exercisesWithStatus.filter(e => e.status === 'started').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">✅</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {exercisesWithStatus.filter(e => e.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercises Grid for Participation */}
              {exercisesWithStatus.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises available yet</h3>
                  <p className="text-gray-600 mb-6">Check back soon for new exercises!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exercisesWithStatus.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
                    >
                      <div className="p-6 flex-grow flex flex-col">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{getPromptTypeIcon(exercise.promptType)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(exercise.category)}`}>
                              {getCategoryDisplayName(exercise.category)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getStatusIcon(exercise.status)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exercise.status)}`}>
                              {exercise.status === 'unstarted' ? 'Unstarted' : 
                               exercise.status === 'started' ? 'Started' : 
                               exercise.status === 'completed' ? 'Completed' : exercise.status}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {exercise.title}
                        </h3>
                        
                        <div 
                          className="text-sm text-gray-600 mb-3 line-clamp-2 prose prose-sm max-w-none rich-text-content"
                          dangerouslySetInnerHTML={{ __html: exercise.question }}
                        />

                        {exercise.description && (
                          <div 
                            className="text-xs text-gray-500 mb-4 line-clamp-3 prose prose-xs max-w-none rich-text-content"
                            dangerouslySetInnerHTML={{ __html: exercise.description }}
                          />
                        )}

                        {/* Progress Info */}
                        <div className="mb-4">
                          <ExerciseProgress
                            requirements={convertLegacyRequirements(exercise as any)}
                            response={exercise.latestResponse ? {
                              textResponse: exercise.latestResponse.responseText,
                              imageUrls: exercise.latestResponse.imageS3Keys || [],
                              audioUrl: exercise.latestResponse.audioS3Key,
                              videoUrl: exercise.latestResponse.videoS3Key,
                              documentUrls: exercise.latestResponse.documentS3Keys || [],
                            } : undefined}
                            actualStatus={exercise.latestResponse?.status}
                            showDetails={true}
                            compact={false}
                          />
                          {exercise.lastResponseDate && (
                            <div className="text-xs text-gray-500 mt-2">
                              Last updated: {new Date(exercise.lastResponseDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Recent Images Preview */}
                        {exercise.recentImages && exercise.recentImages.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center space-x-1 mb-2">
                              <span className="text-xs text-gray-500">Recent images:</span>
                            </div>
                            <div className="flex space-x-1">
                              {exercise.recentImages.map((s3Key, index) => (
                                <ImageThumbnail 
                                  key={index} 
                                  s3Key={s3Key} 
                                  alt={`Recent image ${index + 1}`}
                                  size="sm"
                                  className="flex-shrink-0"
                                />
                              ))}
                              {exercise.recentImages.length === 3 && (
                                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                                  +
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recent Media Preview (Audio, Video, Documents) */}
                        {(exercise.recentAudio || exercise.recentVideo || (exercise.recentDocuments && exercise.recentDocuments.length > 0)) && (
                          <div className="mb-4">
                            <div className="flex items-center space-x-1 mb-2">
                              <span className="text-xs text-gray-500">Recent media:</span>
                            </div>
                            <div className="flex space-x-1">
                              {exercise.recentAudio && (
                                <AudioThumbnail 
                                  alt="Recent audio"
                                  size="sm"
                                  className="flex-shrink-0"
                                />
                              )}
                              {exercise.recentVideo && (
                                <VideoThumbnail 
                                  alt="Recent video"
                                  size="sm"
                                  className="flex-shrink-0"
                                />
                              )}
                              {exercise.recentDocuments && exercise.recentDocuments.slice(0, 2).map((s3Key, index) => (
                                <DocumentThumbnail 
                                  key={index}
                                  fileName={s3Key.split('/').pop()}
                                  alt={`Recent document ${index + 1}`}
                                  size="sm"
                                  className="flex-shrink-0"
                                />
                              ))}
                              {exercise.recentDocuments && exercise.recentDocuments.length > 2 && (
                                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                                  +{exercise.recentDocuments.length - 2}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                          <div className="text-xs text-gray-500">
                            Updated {new Date(exercise.updatedAt).toLocaleDateString()}
                          </div>
                          <div>
                            {(() => {
                              const requirements = convertLegacyRequirements(exercise as any);
                              const response = exercise.latestResponse ? {
                                textResponse: exercise.latestResponse.responseText,
                                imageUrls: exercise.latestResponse.imageS3Keys || [],
                                audioUrl: exercise.latestResponse.audioS3Key,
                                videoUrl: exercise.latestResponse.videoS3Key,
                                documentUrls: exercise.latestResponse.documentS3Keys || [],
                              } : undefined;
                              const progress = calculateExerciseProgress(requirements, response, exercise.latestResponse?.status);
                              
                              return (
                                <Link
                                  href={`/exercises/${exercise.id}/complete`}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
                                >
                                  {progress.state === 'unstarted' ? 'Start' : 
                                   progress.state === 'incomplete' ? 'Continue' : 'View'}
                                </Link>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
                         // Template Management View for Admins
             <>
               {/* Exercise Templates Grid */}
               {exercises.length === 0 ? (
                 <div className="text-center py-12">
                   <div className="text-6xl mb-4">📝</div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">No exercise templates yet</h3>
                   <p className="text-gray-600 mb-6">Get started by creating your first exercise template</p>
                   <Link
                     href="/exercises/new"
                     className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     Create First Template
                   </Link>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {exercises.map((exercise) => (
                     <div
                       key={exercise.id}
                       className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                     >
                       <div className="p-6">
                         {/* Header */}
                         <div className="flex items-start justify-between mb-4">
                           <div className="flex items-center space-x-2">
                             <span className="text-2xl">{getPromptTypeIcon(exercise.promptType)}</span>
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(exercise.category)}`}>
                               {getCategoryDisplayName(exercise.category)}
                             </span>
                           </div>
                           <div className="flex items-center space-x-1">
                             <div className={`w-2 h-2 rounded-full ${exercise.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                             <span className="text-xs text-gray-500">
                               {exercise.isActive ? 'Active' : 'Inactive'}
                             </span>
                           </div>
                         </div>

                         {/* Content */}
                         <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                           {exercise.title}
                         </h3>
                         
                         <div 
                           className="text-sm text-gray-600 mb-3 line-clamp-2 prose prose-sm max-w-none rich-text-content"
                           dangerouslySetInnerHTML={{ __html: exercise.question }}
                         />

                         {exercise.description && (
                           <div 
                             className="text-xs text-gray-500 mb-4 line-clamp-3 prose prose-xs max-w-none rich-text-content"
                             dangerouslySetInnerHTML={{ __html: exercise.description }}
                           />
                         )}

                         {/* Footer */}
                         <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                           <div className="text-xs text-gray-500">
                             Updated {new Date(exercise.updatedAt).toLocaleDateString()}
                           </div>
                           <div className="flex space-x-2">
                             <Link
                               href={`/exercises/${exercise.id}`}
                               className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                             >
                               View
                             </Link>
                             <Link
                               href={`/exercises/${exercise.id}/edit`}
                               className="text-green-600 hover:text-green-800 text-sm font-medium"
                             >
                               Edit
                             </Link>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </>
           )}
        </div>
      </div>
    );
  }

  // Regular user view: Exercise status tracking
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* User Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Exercises</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Track your progress and continue your personal development journey
              </p>
            </div>
            <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg shadow-sm sm:bg-transparent sm:shadow-none sm:px-0 sm:py-0">
              <span className="font-medium">{exercisesWithStatus.filter(e => e.status === 'completed').length}</span> of <span className="font-medium">{exercisesWithStatus.length}</span> completed
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md text-sm sm:text-base">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">🔓</div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Unstarted</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {exercisesWithStatus.filter(e => e.status === 'unstarted').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">🚀</div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Started</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {exercisesWithStatus.filter(e => e.status === 'started').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">✅</div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {exercisesWithStatus.filter(e => e.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises Grid */}
        {exercisesWithStatus.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No exercises available yet</h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Check back soon for new exercises!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {exercisesWithStatus.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
              >
                <div className="p-4 sm:p-6 flex-grow flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-lg sm:text-2xl flex-shrink-0">{getPromptTypeIcon(exercise.promptType)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium truncate ${getCategoryColor(exercise.category)}`}>
                        {getCategoryDisplayName(exercise.category)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                      <span className="text-base sm:text-lg">{getStatusIcon(exercise.status)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(exercise.status)}`}>
                        {exercise.status === 'unstarted' ? 'Unstarted' : 
                         exercise.status === 'started' ? 'Started' : 
                         exercise.status === 'completed' ? 'Completed' : exercise.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {exercise.title}
                  </h3>
                  
                  <div 
                    className="text-sm text-gray-600 mb-3 line-clamp-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: exercise.question }}
                  />

                  {exercise.description && (
                    <div 
                      className="text-xs text-gray-500 mb-3 sm:mb-4 line-clamp-3 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: exercise.description }}
                    />
                  )}

                  {/* Progress Info */}
                  <div className="mb-3 sm:mb-4">
                    <ExerciseProgress
                      requirements={convertLegacyRequirements(exercise as any)}
                      response={exercise.latestResponse ? {
                        textResponse: exercise.latestResponse.responseText,
                        imageUrls: exercise.latestResponse.imageS3Keys || [],
                        audioUrl: exercise.latestResponse.audioS3Key,
                        videoUrl: exercise.latestResponse.videoS3Key,
                        documentUrls: exercise.latestResponse.documentS3Keys || [],
                      } : undefined}
                      actualStatus={exercise.latestResponse?.status}
                      showDetails={false}
                      compact={true}
                    />
                    {exercise.lastResponseDate && (
                      <div className="text-xs text-gray-500 mt-2">
                        Last updated: {new Date(exercise.lastResponseDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Recent Images Preview */}
                  {exercise.recentImages && exercise.recentImages.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center space-x-1 mb-2">
                        <span className="text-xs text-gray-500">Recent images:</span>
                      </div>
                      <div className="flex space-x-1 overflow-x-auto pb-1">
                        {exercise.recentImages.map((s3Key, index) => (
                          <ImageThumbnail 
                            key={index} 
                            s3Key={s3Key} 
                            alt={`Recent image ${index + 1}`}
                            size="sm"
                            className="flex-shrink-0"
                          />
                        ))}
                        {exercise.recentImages.length === 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                            +
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Media Preview (Audio, Video, Documents) */}
                  {(exercise.recentAudio || exercise.recentVideo || (exercise.recentDocuments && exercise.recentDocuments.length > 0)) && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center space-x-1 mb-2">
                        <span className="text-xs text-gray-500">Recent media:</span>
                      </div>
                      <div className="flex space-x-1 overflow-x-auto pb-1">
                        {exercise.recentAudio && (
                          <AudioThumbnail 
                            alt="Recent audio"
                            size="sm"
                            className="flex-shrink-0"
                          />
                        )}
                        {exercise.recentVideo && (
                          <VideoThumbnail 
                            alt="Recent video"
                            size="sm"
                            className="flex-shrink-0"
                          />
                        )}
                        {exercise.recentDocuments && exercise.recentDocuments.slice(0, 2).map((s3Key, index) => (
                          <DocumentThumbnail 
                            key={index}
                            fileName={s3Key.split('/').pop()}
                            alt={`Recent document ${index + 1}`}
                            size="sm"
                            className="flex-shrink-0"
                          />
                        ))}
                        {exercise.recentDocuments && exercise.recentDocuments.length > 2 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                            +{exercise.recentDocuments.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  {exercise.responseCount > 0 && (
                    <div className="text-xs text-gray-500 mb-4">
                      {exercise.responseCount} response{exercise.responseCount !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex-grow flex items-end">
                    <Link
                      href={`/exercises/${exercise.id}`}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium text-sm transition-colors duration-200 touch-manipulation"
                    >
                      {exercise.status === 'completed' ? 'Review & Redo' :
                       exercise.status === 'started' ? 'Continue' : 
                       'Start Exercise'}
                    </Link>
                  </div>

                  {/* Secondary Actions */}
                  {exercise.responseCount > 0 && (
                    <div className="mt-2 flex justify-center">
                      <Link
                        href={`/exercises/${exercise.id}/responses`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium touch-manipulation"
                      >
                        View All Responses
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 