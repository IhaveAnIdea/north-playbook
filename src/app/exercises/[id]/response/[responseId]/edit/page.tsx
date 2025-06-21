'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EditResponsePage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params?.id as string;

  useEffect(() => {
    // Redirect to the complete page, which handles editing existing responses
    if (exerciseId) {
      router.replace(`/exercises/${exerciseId}/complete`);
    }
  }, [exerciseId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
} 