'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserRole } from '@/hooks/useUserRole';

import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

interface Exercise {
  id: string;
  title: string;
  description?: string;
  category: string;
  question: string;
  instructions?: string;
  promptType?: string; // Made optional for backward compatibility
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Required response types (supporting both new enum and legacy boolean)
  requireText?: 'not_required' | 'required' | 'or' | boolean;
  requireImage?: 'not_required' | 'required' | 'or' | boolean;
  requireAudio?: 'not_required' | 'required' | 'or' | boolean;
  requireVideo?: 'not_required' | 'required' | 'or' | boolean;
  requireDocument?: 'not_required' | 'required' | 'or' | boolean;
}

type SortField = 'title' | 'category' | 'responseTypes' | 'isActive' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function ExerciseManagePage() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Debug log to verify updated component is loading
  console.log('🔧 Manage page loaded with enhanced actions - Copy feature should be visible!');

  // Column width management
  const [columnWidths, setColumnWidths] = useState({
    title: 300,
    category: 200,
    responseTypes: 150,
    isActive: 120,
    updatedAt: 120,
    actions: 180  // Reduced from 320 to 180 for icon-only buttons
  });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent, column: string) => {
    console.log('Mouse down on column:', column);
    setIsResizing(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column as keyof typeof columnWidths]);
    e.preventDefault();
  };

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isResizing) return;
      const diff = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);
      console.log('Resizing column:', isResizing, 'to width:', newWidth);
      setColumnWidths(prev => ({
        ...prev,
        [isResizing]: newWidth
      }));
    };

    const mouseUpHandler = () => {
      console.log('Mouse up, stopping resize');
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      
      return () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
    }
  }, [isResizing, startX, startWidth]);

  useEffect(() => {
    if (authStatus === 'authenticated' && user && isAdmin) {
      loadExercises();
    }
  }, [authStatus, user, isAdmin]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const { data } = await client.models.Exercise.list();
      setExercises(data as Exercise[]);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setError('Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExerciseStatus = async (exerciseId: string, currentStatus: boolean) => {
    try {
      await client.models.Exercise.update({
        id: exerciseId,
        isActive: !currentStatus,
      });
      
      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ? { ...ex, isActive: !currentStatus } : ex
      ));
    } catch (error) {
      console.error('Error updating exercise status:', error);
      setError('Failed to update exercise status');
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
      return;
    }

    try {
      await client.models.Exercise.delete({ id: exerciseId });
      setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      setError('Failed to delete exercise');
    }
  };

  const copyExercise = async (exercise: Exercise) => {
    console.log('🔥 Copy exercise clicked for:', exercise.title);
    
    try {
      console.log('🔄 Creating new exercise...');
      
      // Helper function to convert legacy boolean to enum
      const convertRequirement = (value?: 'not_required' | 'required' | 'or' | boolean): 'not_required' | 'required' | 'or' => {
        if (value === true) return 'required';
        if (value === false) return 'not_required';
        return value || 'not_required';
      };

      const requestBody = {
        title: `Copy of ${exercise.title}`,
        description: exercise.description || 'Copy of assignment', // Ensure description is not empty
        category: exercise.category,
        question: exercise.question,
        instructions: exercise.instructions || '',
        promptType: exercise.promptType || '',
        isActive: false,
        requireText: convertRequirement(exercise.requireText),
        requireImage: convertRequirement(exercise.requireImage),
        requireAudio: convertRequirement(exercise.requireAudio),
        requireVideo: convertRequirement(exercise.requireVideo),
        requireDocument: convertRequirement(exercise.requireDocument),
      };

      console.log('📤 Request body:', requestBody);

      // Use Amplify client directly (bypasses authentication issues)
      console.log('🔄 Creating exercise with Amplify client...');
      const { data, errors } = await client.models.Exercise.create({
        title: requestBody.title,
        description: requestBody.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: requestBody.category as any,
        question: requestBody.question,
        instructions: requestBody.instructions,
        isActive: requestBody.isActive,
        requireText: requestBody.requireText,
        requireImage: requestBody.requireImage,
        requireAudio: requestBody.requireAudio,
        requireVideo: requestBody.requireVideo,
        requireDocument: requestBody.requireDocument,
      });

      if (errors && errors.length > 0) {
        console.error('❌ Amplify errors:', errors);
        setError(`Failed to create exercise copy: ${errors.map(e => e.message).join(', ')}`);
        return;
      }

      if (data) {
        console.log('✅ Exercise created successfully:', data);
        setExercises(prev => [data as Exercise, ...prev]);
        console.log('🚀 Navigating to edit page for:', data.id);
        
        // Navigate to the edit page with the newly created exercise
        router.push(`/exercises/${data.id}/edit`);
      } else {
        console.error('❌ No data returned from Amplify create');
        setError('Failed to create exercise copy - no data returned');
      }
    } catch (error) {
      console.error('💥 Error copying exercise:', error);
      setError('Failed to copy exercise');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return '↕️'; // Neutral sort icon
    }
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
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

  const getResponseTypesDisplay = (exercise: Exercise) => {
    const requiredTypes: string[] = [];
    const orTypes: string[] = [];

    // Type to emoji mapping
    const typeEmojis: Record<string, string> = {
      text: '📝',
      image: '🖼️',
      audio: '🎵',
      video: '🎥',
      document: '📄'
    };

    // Check each response type
    const responseFields = [
      { key: 'text', field: exercise.requireText },
      { key: 'image', field: exercise.requireImage },
      { key: 'audio', field: exercise.requireAudio },
      { key: 'video', field: exercise.requireVideo },
      { key: 'document', field: exercise.requireDocument }
    ];

    responseFields.forEach(({ key, field }) => {
      // Handle new enum format
      if (field === 'required') {
        requiredTypes.push(typeEmojis[key]);
      } else if (field === 'or') {
        orTypes.push(typeEmojis[key]);
      }
      // Handle legacy boolean format for backward compatibility
      else if (field === true) {
        requiredTypes.push(typeEmojis[key]);
      }
    });

    // Build display string
    const parts = [];
    if (requiredTypes.length > 0) {
      parts.push(requiredTypes.join(' '));
    }
    if (orTypes.length > 0) {
      parts.push(`(${orTypes.join(' OR ')})`);
    }

    return parts.length > 0 ? parts.join(' + ') : 'None';
  };

  const sortedExercises = [...exercises].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'category':
        aValue = getCategoryDisplayName(a.category).toLowerCase();
        bValue = getCategoryDisplayName(b.category).toLowerCase();
        break;
      case 'responseTypes':
        aValue = getResponseTypesDisplay(a).toLowerCase();
        bValue = getResponseTypesDisplay(b).toLowerCase();
        break;
      case 'isActive':
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (roleLoading || (authStatus === 'configuring')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Only administrators can manage assignment templates.</p>
          <Link
            href="/exercises"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignment Management</h1>
              <p className="text-gray-600 mt-2">
                Create and manage assignment templates for all users
              </p>
            </div>
            <Link
              href="/exercises/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create New Assignment
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Exercise Management Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading exercises...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments created yet</h3>
            <p className="text-gray-600 mb-6">Create your first assignment template to get started</p>
            <Link
              href="/exercises/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create First Assignment
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Assignment Templates</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: `${columnWidths.title}px`, minWidth: `${columnWidths.title}px`, maxWidth: `${columnWidths.title}px` }}
                    >
                      <div 
                        className="cursor-pointer hover:bg-gray-100 select-none flex items-center space-x-1"
                        onClick={() => handleSort('title')}
                      >
                        <span>Assignment</span>
                        <span className="text-sm">{getSortIcon('title')}</span>
                      </div>
                      <div 
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-200 border-r-2 border-transparent hover:border-blue-400 transition-all z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'title')}
                        title="Drag to resize column"
                      />
                    </th>
                    <th 
                      className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: `${columnWidths.category}px`, minWidth: `${columnWidths.category}px`, maxWidth: `${columnWidths.category}px` }}
                    >
                      <div 
                        className="cursor-pointer hover:bg-gray-100 select-none flex items-center space-x-1"
                        onClick={() => handleSort('category')}
                      >
                        <span>Category</span>
                        <span className="text-sm">{getSortIcon('category')}</span>
                      </div>
                      <div 
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-200 border-r-2 border-transparent hover:border-blue-400 transition-all z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'category')}
                        title="Drag to resize column"
                      />
                    </th>
                    <th 
                      className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: `${columnWidths.responseTypes}px`, minWidth: `${columnWidths.responseTypes}px`, maxWidth: `${columnWidths.responseTypes}px` }}
                    >
                      <div 
                        className="cursor-pointer hover:bg-gray-100 select-none flex items-center space-x-1"
                        onClick={() => handleSort('responseTypes')}
                      >
                        <span>Required Types</span>
                        <span className="text-sm">{getSortIcon('responseTypes')}</span>
                      </div>
                      <div 
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-200 border-r-2 border-transparent hover:border-blue-400 transition-all z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'responseTypes')}
                        title="Drag to resize column"
                      />
                    </th>
                    <th 
                      className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: `${columnWidths.isActive}px`, minWidth: `${columnWidths.isActive}px`, maxWidth: `${columnWidths.isActive}px` }}
                    >
                      <div 
                        className="cursor-pointer hover:bg-gray-100 select-none flex items-center space-x-1"
                        onClick={() => handleSort('isActive')}
                      >
                        <span>Status</span>
                        <span className="text-sm">{getSortIcon('isActive')}</span>
                      </div>
                      <div 
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-200 border-r-2 border-transparent hover:border-blue-400 transition-all z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'isActive')}
                        title="Drag to resize column"
                      />
                    </th>
                    <th 
                      className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: `${columnWidths.updatedAt}px`, minWidth: `${columnWidths.updatedAt}px`, maxWidth: `${columnWidths.updatedAt}px` }}
                    >
                      <div 
                        className="cursor-pointer hover:bg-gray-100 select-none flex items-center space-x-1"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <span>Updated</span>
                        <span className="text-sm">{getSortIcon('updatedAt')}</span>
                      </div>
                      <div 
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-200 border-r-2 border-transparent hover:border-blue-400 transition-all z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'updatedAt')}
                        title="Drag to resize column"
                      />
                    </th>
                    <th 
                      className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50"
                      style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px`, maxWidth: `${columnWidths.actions}px` }}
                    >
                      <span>Actions</span>
                      <div 
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-200 border-r-2 border-transparent hover:border-blue-400 transition-all z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'actions')}
                        title="Drag to resize column"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedExercises.map((exercise) => (
                    <tr key={exercise.id} className="hover:bg-gray-50">
                      <td 
                        className="px-6 py-4 overflow-hidden" 
                        style={{ 
                          width: `${columnWidths.title}px`, 
                          minWidth: `${columnWidths.title}px`, 
                          maxWidth: `${columnWidths.title}px` 
                        }}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {exercise.title}
                          </div>
                          <div 
                            className="text-sm text-gray-500 line-clamp-2 prose prose-sm max-w-none rich-text-content"
                            dangerouslySetInnerHTML={{ __html: exercise.question }}
                          />
                        </div>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap overflow-hidden" 
                        style={{ 
                          width: `${columnWidths.category}px`, 
                          minWidth: `${columnWidths.category}px`, 
                          maxWidth: `${columnWidths.category}px` 
                        }}
                      >
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 truncate">
                          {getCategoryDisplayName(exercise.category)}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden" 
                        style={{ 
                          width: `${columnWidths.responseTypes}px`, 
                          minWidth: `${columnWidths.responseTypes}px`, 
                          maxWidth: `${columnWidths.responseTypes}px` 
                        }}
                      >
                        <span className="truncate">{getResponseTypesDisplay(exercise)}</span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap overflow-hidden" 
                        style={{ 
                          width: `${columnWidths.isActive}px`, 
                          minWidth: `${columnWidths.isActive}px`, 
                          maxWidth: `${columnWidths.isActive}px` 
                        }}
                      >
                        <button
                          onClick={() => toggleExerciseStatus(exercise.id, exercise.isActive)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            exercise.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {exercise.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 overflow-hidden" 
                        style={{ 
                          width: `${columnWidths.updatedAt}px`, 
                          minWidth: `${columnWidths.updatedAt}px`, 
                          maxWidth: `${columnWidths.updatedAt}px` 
                        }}
                      >
                        <span className="truncate">
                          {new Date(exercise.updatedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white overflow-hidden" 
                        style={{ 
                          width: `${columnWidths.actions}px`, 
                          minWidth: `${columnWidths.actions}px`, 
                          maxWidth: `${columnWidths.actions}px` 
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <Link
                            href={`/exercises/${exercise.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="View assignment details"
                          >
                            👁️
                          </Link>
                          <Link
                            href={`/exercises/${exercise.id}/edit`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            title="Edit assignment"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => copyExercise(exercise)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                            title="Create a copy of this assignment"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => deleteExercise(exercise.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title="Delete assignment permanently"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 