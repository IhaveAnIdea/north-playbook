'use client';

import { useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserRole } from '@/hooks/useUserRole';
import Link from 'next/link';
import ExerciseEditor from '@/components/exercises/ExerciseEditor';

export default function NewExercisePage() {
  const router = useRouter();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const handleSave = (exercise: unknown) => {
    console.log('Exercise created:', exercise);
    
    // Check if the response has errors
    const response = exercise as { data?: unknown; errors?: Array<{ message: string }> };
    if (response?.errors && response.errors.length > 0) {
      console.error('Exercise creation failed with errors:', response.errors);
      alert(`Exercise creation failed: ${response.errors.map(err => err.message).join(', ')}`);
      return;
    }
    
    if (response?.data || (exercise as { id?: string })?.id) {
      console.log('Exercise created successfully!');
      router.push('/exercises');
    } else {
      console.error('Unexpected response format:', response);
      alert('Exercise creation failed: Unexpected response format');
    }
  };

  const handleCancel = () => {
    router.push('/exercises');
  };

  if (roleLoading || authStatus === 'configuring') {
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
          <p className="text-gray-600 mb-6">Only administrators can create exercise templates.</p>
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
      <ExerciseEditor
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
} 