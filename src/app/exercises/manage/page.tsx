'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  promptType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ExerciseManagePage() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <p className="text-gray-600 mb-6">Only administrators can manage exercise templates.</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exercise Management</h1>
              <p className="text-gray-600 mt-2">
                Create and manage exercise templates for all users
              </p>
            </div>
            <Link
              href="/exercises/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create New Exercise
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises created yet</h3>
            <p className="text-gray-600 mb-6">Create your first exercise template to get started</p>
            <Link
              href="/exercises/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create First Exercise
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Exercise Templates</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exercises.map((exercise) => (
                    <tr key={exercise.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {exercise.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {exercise.question}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {exercise.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exercise.promptType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(exercise.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/exercises/${exercise.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                        <Link
                          href={`/exercises/${exercise.id}/edit`}
                          className="text-green-600 hover:text-green-800"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteExercise(exercise.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
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