'use client';

import { useParams, useRouter } from 'next/navigation';
import ExerciseEditor from '@/components/exercises/ExerciseEditor';

export default function EditExercisePage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params?.id as string;

  const handleSave = (exercise: unknown) => {
    console.log('Exercise updated:', exercise);
    router.push(`/exercises/${exerciseId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ExerciseEditor
        exerciseId={exerciseId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
} 