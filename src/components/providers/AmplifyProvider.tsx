'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '@/lib/amplify-config';
import { useState, useEffect } from 'react';

interface AmplifyProviderProps {
  children: React.ReactNode;
}

export function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration issues by only rendering after mount
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Authenticator
      hideSignUp={false}
      components={{
        Header: () => (
          <div className="text-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">North Playbook</h1>
            <p className="text-gray-600 mt-2">Welcome to your personal development journey</p>
          </div>
        ),
      }}
    >
      {children}
    </Authenticator>
  );
} 