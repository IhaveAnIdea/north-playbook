'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ClientOnlyPlaybook = dynamic(() => import('@/components/playbook/ClientOnlyPlaybook'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center py-8">
        <h4 className="text-2xl font-semibold text-gray-900">Loading your playbook...</h4>
      </div>
    </div>
  ),
});

export default function PlaybookPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {mounted && <ClientOnlyPlaybook />}
    </div>
  );
} 